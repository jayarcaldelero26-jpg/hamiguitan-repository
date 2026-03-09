export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "@/app/lib/db";
import { getDriveClient, normalizeFolderName } from "@/app/lib/googleDrive";

const SECRET = process.env.JWT_SECRET!;
const ACADEME_ID = process.env.DRIVE_ACADEME_FOLDER_ID!;
const STAKEHOLDERS_ID = process.env.DRIVE_STAKEHOLDERS_FOLDER_ID!;
const PAMO_ID = process.env.DRIVE_PAMO_FOLDER_ID!;

function getTokenPayload(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, SECRET) as any;
  } catch {
    return null;
  }
}

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function safeYearFromDate(dateStr?: string) {
  if (!dateStr) return new Date().getFullYear().toString();
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().getFullYear().toString();
  return String(d.getFullYear());
}

async function ensureAnyoneReader(drive: any, fileId: string) {
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        type: "anyone",
        role: "reader",
      },
      supportsAllDrives: true,
    });
  } catch (err) {
    console.error("SYNC PERMISSION WARNING:", fileId, err);
  }
}

async function listFolders(drive: any, parentId: string) {
  const folders: Array<{ id: string; name: string }> = [];
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

    for (const f of res.data.files || []) {
      if (f.id && f.name) {
        folders.push({
          id: f.id,
          name: normalizeFolderName(f.name),
        });
      }
    }

    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);

  return folders;
}

async function listFilesOnly(drive: any, parentId: string) {
  const files: Array<{
    id: string;
    name: string;
    mimeType: string;
    createdTime?: string;
    modifiedTime?: string;
    webViewLink?: string;
  }> = [];

  let pageToken: string | undefined = undefined;

  do {
    const res: any = await drive.files.list({
      q: [
        `mimeType!='application/vnd.google-apps.folder'`,
        `'${parentId}' in parents`,
        `trashed=false`,
      ].join(" and "),
      fields:
        "nextPageToken, files(id,name,mimeType,createdTime,modifiedTime,webViewLink)",
      spaces: "drive",
      orderBy: "name_natural",
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    for (const f of res.data.files || []) {
      if (f.id && f.name) {
        files.push({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType || "application/octet-stream",
          createdTime: f.createdTime || undefined,
          modifiedTime: f.modifiedTime || undefined,
          webViewLink: f.webViewLink || undefined,
        });
      }
    }

    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);

  return files;
}

async function upsertDocument(params: {
  fileId: string;
  name: string;
  type: string;
  category: string;
  folder: string;
  createdTime?: string;
}) {
  const { fileId, name, type, category, folder, createdTime } = params;

  const fallbackDate = createdTime
    ? new Date(createdTime).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const dateReceived = fallbackDate;
  const year = safeYearFromDate(dateReceived);

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("documents")
    .select("id,title,dateReceived,year")
    .eq("fileId", fileId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    const { error: updateError } = await supabaseAdmin
      .from("documents")
      .update({
        name,
        type,
        category,
        folder,
        title: existing.title || name,
        dateReceived: existing.dateReceived || dateReceived,
        year: existing.year || year,
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { action: "updated" as const };
  }

  const uploadedAt = new Date().toISOString();

  const { error: insertError } = await supabaseAdmin.from("documents").insert([
    {
      fileId,
      name,
      type,
      category,
      folder,
      title: name,
      dateReceived,
      year,
      uploadedAt,
    },
  ]);

  if (insertError) {
    throw new Error(insertError.message);
  }

  return { action: "inserted" as const };
}

async function syncCategory(params: {
  drive: any;
  rootFolderId: string;
  categoryName: "Academe" | "Stakeholders" | "PAMO Activity";
}) {
  const { drive, rootFolderId, categoryName } = params;

  let inserted = 0;
  let updated = 0;

  const rootFiles = await listFilesOnly(drive, rootFolderId);
  for (const file of rootFiles) {
    await ensureAnyoneReader(drive, file.id);
    const result = await upsertDocument({
      fileId: file.id,
      name: file.name,
      type: file.mimeType,
      category: categoryName,
      folder: "",
      createdTime: file.createdTime,
    });
    if (result.action === "inserted") inserted++;
    else updated++;
  }

  const subfolders = await listFolders(drive, rootFolderId);

  for (const sub of subfolders) {
    let folderName = normalizeFolderName(sub.name);
    if (categoryName === "Stakeholders" && folderName) {
      folderName = folderName.toUpperCase();
    }

    const files = await listFilesOnly(drive, sub.id);

    for (const file of files) {
      await ensureAnyoneReader(drive, file.id);

      const result = await upsertDocument({
        fileId: file.id,
        name: file.name,
        type: file.mimeType,
        category: categoryName,
        folder: folderName,
        createdTime: file.createdTime,
      });

      if (result.action === "inserted") inserted++;
      else updated++;
    }
  }

  return { inserted, updated };
}

export async function POST(req: NextRequest) {
  const payload = getTokenPayload(req);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole(payload?.role);
  if (role !== "admin" && role !== "co_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    if (!ACADEME_ID || !STAKEHOLDERS_ID || !PAMO_ID) {
      return NextResponse.json(
        { error: "Drive folder IDs are not configured." },
        { status: 500 }
      );
    }

    const drive = getDriveClient();

    const academe = await syncCategory({
      drive,
      rootFolderId: ACADEME_ID,
      categoryName: "Academe",
    });

    const stakeholders = await syncCategory({
      drive,
      rootFolderId: STAKEHOLDERS_ID,
      categoryName: "Stakeholders",
    });

    const pamo = await syncCategory({
      drive,
      rootFolderId: PAMO_ID,
      categoryName: "PAMO Activity",
    });

    return NextResponse.json({
      ok: true,
      summary: {
        academe,
        stakeholders,
        pamo,
        totalInserted:
          academe.inserted + stakeholders.inserted + pamo.inserted,
        totalUpdated:
          academe.updated + stakeholders.updated + pamo.updated,
      },
    });
  } catch (error: any) {
    console.error("SYNC DRIVE ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to sync Google Drive." },
      { status: 500 }
    );
  }
}