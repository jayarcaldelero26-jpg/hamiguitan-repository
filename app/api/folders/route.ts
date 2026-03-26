export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import {
  getDriveClient,
  listChildFolders,
  normalizeDriveCategory,
} from "@/app/lib/googleDrive";
import { getCurrentUser } from "@/app/lib/auth";
import { serverEnv } from "@/app/lib/serverEnv";

const FOLDER_LIST_CACHE_TTL_MS = 30_000;

type FolderResponseKey = "academe" | "stakeholders" | "pamo";
type FolderCategory = "Academe" | "Stakeholders" | "PAMO Activity";
type FolderCacheEntry = {
  folders: string[];
  expiresAt: number;
};

const folderListCache = new Map<FolderCategory, FolderCacheEntry>();

function getFolderConfig(category: FolderCategory): {
  key: FolderResponseKey;
  parentId: string;
} {
  if (category === "Academe") {
    return {
      key: "academe",
      parentId: serverEnv.driveAcademeFolderId,
    };
  }

  if (category === "Stakeholders") {
    return {
      key: "stakeholders",
      parentId: serverEnv.driveStakeholdersFolderId,
    };
  }

  return {
    key: "pamo",
    parentId: serverEnv.drivePamoFolderId,
  };
}

function readFolderListCache(category: FolderCategory) {
  const cached = folderListCache.get(category);
  if (!cached) return null;
  if (Date.now() >= cached.expiresAt) {
    folderListCache.delete(category);
    return null;
  }

  return cached.folders;
}

function writeFolderListCache(category: FolderCategory, folders: string[]) {
  folderListCache.set(category, {
    folders,
    expiresAt: Date.now() + FOLDER_LIST_CACHE_TTL_MS,
  });
}

async function loadFoldersForCategory(
  category: FolderCategory
): Promise<{ key: FolderResponseKey; folders: string[] }> {
  const cachedFolders = readFolderListCache(category);
  const { key, parentId } = getFolderConfig(category);

  if (cachedFolders) {
    return {
      key,
      folders: cachedFolders,
    };
  }

  const drive = getDriveClient();
  const folders = await listChildFolders(drive, parentId);
  writeFolderListCache(category, folders);

  return {
    key,
    folders,
  };
}

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requestedCategory = normalizeDriveCategory(
      req.nextUrl.searchParams.get("category") || ""
    );

    if (
      req.nextUrl.searchParams.has("category") &&
      !requestedCategory
    ) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    if (requestedCategory) {
      const { key, folders } = await loadFoldersForCategory(requestedCategory);

      return NextResponse.json({
        [key]: folders,
      });
    }

    const results = await Promise.all([
      loadFoldersForCategory("Academe"),
      loadFoldersForCategory("Stakeholders"),
      loadFoldersForCategory("PAMO Activity"),
    ]);

    const payload: Record<string, string[]> = {};

    for (const result of results) {
      payload[result.key] = result.folders;
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("FOLDERS GET ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load folders." },
      { status: 500 }
    );
  }
}
