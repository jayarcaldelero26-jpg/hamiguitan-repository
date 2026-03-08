// app/lib/googleDrive.ts
import { google } from "googleapis";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function createOAuthClient() {
  return new google.auth.OAuth2(
    requiredEnv("GOOGLE_CLIENT_ID"),
    requiredEnv("GOOGLE_CLIENT_SECRET"),
    requiredEnv("GOOGLE_REDIRECT_URI")
  );
}

export function getDriveClient() {
  const oauth = createOAuthClient();

  oauth.setCredentials({
    refresh_token: requiredEnv("GOOGLE_REFRESH_TOKEN"),
  });

  return google.drive({ version: "v3", auth: oauth });
}

export function normalizeDriveCategory(input: string) {
  const s = (input || "").trim().toLowerCase();

  if (s === "academe") return "Academe";
  if (s === "stakeholder" || s === "stakeholders") return "Stakeholders";
  if (s === "pamo activity" || s === "pamo" || s === "activity" || s === "activities") {
    return "PAMO Activity";
  }

  return "General";
}

export function normalizeFolderName(input: string) {
  return (input || "").replace(/\s+/g, " ").trim();
}

export async function findOrCreateFolder(
  drive: any,
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
  drive: any,
  parentId: string
): Promise<string[]> {
  const folders: string[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const res: any = await drive.files.list({
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
    });

    const files = res.data.files || [];
    for (const f of files) {
      const name = normalizeFolderName(f.name || "");
      if (name) folders.push(name);
    }

    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);

  return Array.from(new Set(folders)).sort((a, b) => a.localeCompare(b));
}