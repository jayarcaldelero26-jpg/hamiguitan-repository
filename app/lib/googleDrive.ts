// app/lib/googleDrive.ts
import "server-only";

import { google, drive_v3 } from "googleapis";
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

export async function findOrCreateFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId?: string
): Promise<string> {
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
  if (found?.id) return found.id;

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

  return createdId;
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
