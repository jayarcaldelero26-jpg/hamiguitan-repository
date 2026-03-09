export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { getDriveClient, normalizeDriveCategory, normalizeFolderName } from "@/app/lib/googleDrive";

const SECRET = process.env.JWT_SECRET!;
const ROOT_ID = process.env.DRIVE_ROOT_FOLDER_ID!;
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

function getCategoryFolderId(category: string) {
  if (category === "Academe") return ACADEME_ID;
  if (category === "Stakeholders") return STAKEHOLDERS_ID;
  if (category === "PAMO Activity") return PAMO_ID;
  return ROOT_ID;
}

async function findOrCreateFolder(drive: any, name: string, parentId?: string) {
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

  const list = await drive.files.list({
    q,
    fields: "files(id,name)",
    spaces: "drive",
    pageSize: 1,
  });

  const existing = list.data.files?.[0];
  if (existing?.id) return existing.id;

  const created = await drive.files.create({
    requestBody: {
      name: cleanName,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id,name",
  });

  if (!created.data.id) {
    throw new Error(`Failed to create folder: ${cleanName}`);
  }

  return created.data.id;
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
    const body = await req.json();

    const rawCategory = String(body?.category || "");
    let folder = normalizeFolderName(String(body?.folder || ""));

    const category = normalizeDriveCategory(rawCategory);

    if (category === "Stakeholders" && folder) {
      folder = folder.toUpperCase();
    }

    const drive = getDriveClient();
    const categoryFolderId = getCategoryFolderId(category);

    let targetFolderId = categoryFolderId;
    if (folder) {
      targetFolderId = await findOrCreateFolder(drive, folder, categoryFolderId);
    }

    return NextResponse.json({
      ok: true,
      category,
      folder,
      parentId: targetFolderId,
    });
  } catch (e: any) {
    console.error("DRIVE TARGET ERROR:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to resolve Drive folder." },
      { status: 500 }
    );
  }
}