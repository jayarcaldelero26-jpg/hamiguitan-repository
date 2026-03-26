// app/lib/googleDrive.ts
import "server-only";

import { google, drive_v3 } from "googleapis";
import { supabaseAdmin } from "@/app/lib/db";
import { serverEnv } from "@/app/lib/serverEnv";

export function createOAuthClient() {
  return new google.auth.OAuth2(
    serverEnv.googleClientId,
    serverEnv.googleClientSecret,
    serverEnv.googleRedirectUri
  );
}

export function getDriveClient(): drive_v3.Drive {
  const oauth = createOAuthClient();

  oauth.setCredentials({
    refresh_token: serverEnv.googleRefreshToken,
  });

  return google.drive({ version: "v3", auth: oauth });
}

export function normalizeDriveCategory(input: string) {
  const s = (input || "").trim().toLowerCase();

  if (s === "academe") return "Academe";
  if (s === "stakeholder" || s === "stakeholders") return "Stakeholders";
  if (
    s === "pamo activity" ||
    s === "pamo" ||
    s === "activity" ||
    s === "activities"
  ) {
    return "PAMO Activity";
  }

  return "";
}

export function normalizeFolderName(input: string) {
  return (input || "").replace(/\s+/g, " ").trim();
}

export function getCategoryFolderId(category: string) {
  if (category === "Academe") return serverEnv.driveAcademeFolderId;
  if (category === "Stakeholders") return serverEnv.driveStakeholdersFolderId;
  if (category === "PAMO Activity") return serverEnv.drivePamoFolderId;
  return "";
}

const CONFIGURED_REPOSITORY_ROOT_IDS = [
  serverEnv.driveRootFolderId,
  serverEnv.driveAcademeFolderId,
  serverEnv.driveStakeholdersFolderId,
  serverEnv.drivePamoFolderId,
].filter(Boolean);

type FolderCacheRow = {
  folder_id: string;
  parent_id: string | null;
  folder_name: string;
};

function isMissingFolderCacheTableError(
  error: { code?: string | null; message?: string | null } | null | undefined
) {
  const code = String(error?.code || "").trim();
  const message = String(error?.message || "").toLowerCase();

  if (code === "42P01" || code === "PGRST205") {
    return true;
  }

  return message.includes("drive_folder_cache");
}

async function readFolderCache(
  parentId: string | undefined,
  folderName: string
): Promise<FolderCacheRow | null> {
  const { data, error } = await supabaseAdmin
    .from("drive_folder_cache")
    .select("folder_id,parent_id,folder_name")
    .eq("parent_id", parentId || "")
    .eq("folder_name", folderName)
    .maybeSingle();

  if (error) {
    if (!isMissingFolderCacheTableError(error)) {
      console.error("DRIVE FOLDER CACHE READ ERROR:", error);
    }
    return null;
  }

  return (data as FolderCacheRow | null) || null;
}

async function writeFolderCache(
  parentId: string | undefined,
  folderName: string,
  folderId: string
) {
  const { error } = await supabaseAdmin.from("drive_folder_cache").upsert(
    {
      parent_id: parentId || "",
      folder_name: folderName,
      folder_id: folderId,
      last_verified_at: new Date().toISOString(),
    },
    {
      onConflict: "parent_id,folder_name",
    }
  );

  if (error && !isMissingFolderCacheTableError(error)) {
    console.error("DRIVE FOLDER CACHE WRITE ERROR:", error);
  }
}

async function deleteFolderCache(parentId: string | undefined, folderName: string) {
  const { error } = await supabaseAdmin
    .from("drive_folder_cache")
    .delete()
    .eq("parent_id", parentId || "")
    .eq("folder_name", folderName);

  if (error && !isMissingFolderCacheTableError(error)) {
    console.error("DRIVE FOLDER CACHE DELETE ERROR:", error);
  }
}

async function verifyCachedFolder(
  drive: drive_v3.Drive,
  folderId: string,
  folderName: string,
  parentId?: string
): Promise<boolean> {
  try {
    const res = await drive.files.get({
      fileId: folderId,
      fields: "id,name,mimeType,parents,trashed",
      supportsAllDrives: true,
    });

    const data = res.data;
    const parents = (data.parents || []).filter(Boolean);
    const isFolder = data.mimeType === "application/vnd.google-apps.folder";
    const matchesParent = parentId ? parents.includes(parentId) : true;
    const matchesName = normalizeFolderName(data.name || "") === folderName;

    return Boolean(data.id) && isFolder && !data.trashed && matchesParent && matchesName;
  } catch (error) {
    console.error("DRIVE FOLDER CACHE VERIFY ERROR:", {
      folderId,
      folderName,
      parentId: parentId || "",
      error,
    });
    return false;
  }
}

export async function findOrCreateFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId?: string
): Promise<string> {
  const cleanName = normalizeFolderName(name);
  const cached = await readFolderCache(parentId, cleanName);

  if (cached?.folder_id) {
    const isValid = await verifyCachedFolder(
      drive,
      cached.folder_id,
      cleanName,
      parentId
    );

    if (isValid) {
      await writeFolderCache(parentId, cleanName, cached.folder_id);
      return cached.folder_id;
    }

    await deleteFolderCache(parentId, cleanName);
  }

  const existingId = await findFolderId(drive, cleanName, parentId);
  if (existingId) {
    await writeFolderCache(parentId, cleanName, existingId);
    return existingId;
  }

  const created = await drive.files.create({
    requestBody: {
      name: cleanName,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id,name",
    supportsAllDrives: true,
  });

  const createdId = created.data.id;
  if (!createdId) {
    throw new Error(`Failed to create folder: ${cleanName}`);
  }

  await writeFolderCache(parentId, cleanName, createdId);

  return createdId;
}

export async function findFolderId(
  drive: drive_v3.Drive,
  name: string,
  parentId?: string
): Promise<string | null> {
  const cleanName = normalizeFolderName(name);
  const safeName = cleanName.replace(/'/g, "\\'");

  const q = [
    `mimeType='application/vnd.google-apps.folder'`,
    `name='${safeName}'`,
    `trashed=false`,
    parentId ? `'${parentId}' in parents` : null,
  ]
    .filter(Boolean)
    .join(" and ");

  const existing = await drive.files.list({
    q,
    fields: "files(id,name)",
    spaces: "drive",
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const found = existing.data.files?.[0];
  return found?.id || null;
}

export async function listChildFolders(
  drive: drive_v3.Drive,
  parentId: string
): Promise<string[]> {
  const folders: string[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const res: drive_v3.Schema$FileList = (
      await drive.files.list({
        q: [
          `mimeType='application/vnd.google-apps.folder'`,
          `'${parentId}' in parents`,
          `trashed=false`,
        ].join(" and "),
        fields: "nextPageToken, files(id,name)",
        spaces: "drive",
        orderBy: "name_natural",
        pageSize: 1000,
        pageToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      })
    ).data;

    const files = res.files || [];

    for (const f of files) {
      const name = normalizeFolderName(f.name || "");
      if (name) folders.push(name);
    }

    pageToken = res.nextPageToken || undefined;
  } while (pageToken);

  return Array.from(new Set(folders)).sort((a, b) => a.localeCompare(b));
}

export async function getDriveFileInfo(
  drive: drive_v3.Drive,
  fileId: string
): Promise<{ id: string; name: string; parents: string[] }> {
  const res = await drive.files.get({
    fileId,
    fields: "id,name,parents",
    supportsAllDrives: true,
  });

  const id = res.data.id || "";
  if (!id) {
    throw new Error("Google Drive did not return file metadata.");
  }

  return {
    id,
    name: res.data.name || "",
    parents: (res.data.parents || []).filter(Boolean),
  };
}

async function folderHasConfiguredAncestor(
  drive: drive_v3.Drive,
  folderId: string,
  visited = new Set<string>()
): Promise<boolean> {
  if (!folderId) return false;
  if (CONFIGURED_REPOSITORY_ROOT_IDS.includes(folderId)) return true;
  if (visited.has(folderId)) return false;

  visited.add(folderId);

  const res = await drive.files.get({
    fileId: folderId,
    fields: "id,parents",
    supportsAllDrives: true,
  });

  const parents = (res.data.parents || []).filter(Boolean);
  if (parents.length === 0) return false;

  for (const parentId of parents) {
    if (await folderHasConfiguredAncestor(drive, parentId, visited)) {
      return true;
    }
  }

  return false;
}

export async function assertFileWithinConfiguredTree(
  drive: drive_v3.Drive,
  parentIds: string[]
) {
  if (!parentIds.length) {
    throw new Error(
      "Drive file is missing parent information; cannot safely move document."
    );
  }

  for (const parentId of parentIds) {
    const isAllowed = await folderHasConfiguredAncestor(drive, parentId);
    if (!isAllowed) {
      throw new Error(
        "Drive file is outside the configured repository folder tree."
      );
    }
  }
}

export async function resolveDocumentDriveParent(
  drive: drive_v3.Drive,
  category: string,
  folder: string
) {
  const categoryFolderId = getCategoryFolderId(category);

  if (!categoryFolderId) {
    throw new Error("Drive folder ID is not configured for this category.");
  }

  const normalizedFolder = normalizeFolderName(folder);
  if (!normalizedFolder) {
    return categoryFolderId;
  }

  return findOrCreateFolder(drive, normalizedFolder, categoryFolderId);
}

export async function resolveExistingDocumentDriveParent(
  drive: drive_v3.Drive,
  category: string,
  folder: string
) {
  const categoryFolderId = getCategoryFolderId(category);

  if (!categoryFolderId) {
    throw new Error("Drive folder ID is not configured for this category.");
  }

  const normalizedFolder = normalizeFolderName(folder);
  if (!normalizedFolder) {
    return categoryFolderId;
  }

  return findFolderId(drive, normalizedFolder, categoryFolderId);
}

export async function moveDriveFileToParent(
  drive: drive_v3.Drive,
  fileId: string,
  currentParentIds: string[],
  targetParentId: string
) {
  if (!targetParentId) {
    throw new Error("Missing target Drive folder.");
  }

  const uniqueCurrentParents = Array.from(new Set(currentParentIds.filter(Boolean)));
  const alreadyInTarget =
    uniqueCurrentParents.length === 1 && uniqueCurrentParents[0] === targetParentId;

  if (alreadyInTarget) {
    return {
      moved: false,
      parents: uniqueCurrentParents,
    };
  }

  if (!uniqueCurrentParents.length) {
    throw new Error(
      "Drive file is missing parent information; cannot safely move document."
    );
  }

  const updated = await drive.files.update({
    fileId,
    addParents: targetParentId,
    removeParents: uniqueCurrentParents.join(","),
    fields: "id,parents",
    supportsAllDrives: true,
  });

  const nextParents = (updated.data.parents || []).filter(Boolean);
  if (!nextParents.includes(targetParentId)) {
    throw new Error("Google Drive move did not place the file in the target folder.");
  }

  return {
    moved: true,
    parents: nextParents,
  };
}

export async function replaceDriveFileParents(
  drive: drive_v3.Drive,
  fileId: string,
  currentParentIds: string[],
  targetParentIds: string[]
) {
  const uniqueCurrentParents = Array.from(new Set(currentParentIds.filter(Boolean)));
  const uniqueTargetParents = Array.from(new Set(targetParentIds.filter(Boolean)));

  if (!uniqueTargetParents.length) {
    throw new Error("Missing target Drive parents.");
  }

  const addParents = uniqueTargetParents
    .filter((parentId) => !uniqueCurrentParents.includes(parentId))
    .join(",");

  const removeParents = uniqueCurrentParents
    .filter((parentId) => !uniqueTargetParents.includes(parentId))
    .join(",");

  if (!addParents && !removeParents) {
    return {
      moved: false,
      parents: uniqueCurrentParents,
    };
  }

  const updated = await drive.files.update({
    fileId,
    addParents: addParents || undefined,
    removeParents: removeParents || undefined,
    fields: "id,parents",
    supportsAllDrives: true,
  });

  const nextParents = (updated.data.parents || []).filter(Boolean);
  const missingTargetParent = uniqueTargetParents.some(
    (parentId) => !nextParents.includes(parentId)
  );

  if (missingTargetParent) {
    throw new Error("Google Drive parent replacement did not complete as expected.");
  }

  return {
    moved: true,
    parents: nextParents,
  };
}

export async function ensureFileInExpectedParent(
  drive: drive_v3.Drive,
  fileId: string,
  currentParentIds: string[],
  expectedParentId: string
) {
  await assertFileWithinConfiguredTree(drive, currentParentIds);

  if (!expectedParentId) {
    throw new Error("Expected Drive source folder could not be resolved.");
  }

  if (!currentParentIds.includes(expectedParentId)) {
    throw new Error(
      "Drive file parent does not match the expected source folder."
    );
  }
}

export async function isDriveFolderEmpty(
  drive: drive_v3.Drive,
  folderId: string
) {
  const res = await drive.files.list({
    q: [`'${folderId}' in parents`, "trashed=false"].join(" and "),
    fields: "files(id)",
    pageSize: 1,
    spaces: "drive",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return (res.data.files || []).length === 0;
}

export async function deleteDriveFileById(
  drive: drive_v3.Drive,
  fileId: string
) {
  await drive.files.delete({
    fileId,
    supportsAllDrives: true,
  });
}
