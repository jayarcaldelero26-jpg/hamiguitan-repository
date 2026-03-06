export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import db from "@/app/lib/db";
import jwt from "jsonwebtoken";
import { getDriveClient } from "@/app/lib/googleDrive";
import { Readable } from "stream";

const SECRET = process.env.JWT_SECRET!;

function requiredString(v: FormDataEntryValue | null) {
  if (!v || typeof v !== "string") return "";
  return v.trim();
}

function normalizeCategory(v: string) {
  const s = (v || "").trim().toLowerCase();
  if (s === "stakeholder" || s === "stakeholders") return "Stakeholders";
  if (s === "academe") return "Academe";
  // default
  return "Academe";
}

async function findOrCreateFolder(drive: any, name: string, parentId?: string) {
  const safeName = name.replace(/'/g, "\\'");
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
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  });

  return created.data.id!;
}

function drivePreviewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;
}

/** GET documents (same as before) */
export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    jwt.verify(token, SECRET);

    const rows = db
      .prepare(`
        SELECT
          id, fileId, name, type,
          category, folder, title, dateReceived,
          year, uploadedAt
        FROM documents
        ORDER BY uploadedAt DESC
      `)
      .all() as any[];

    const documents = rows.map((d) => ({
      ...d,
      // keep for preview if you want
      url: d.fileId ? drivePreviewUrl(d.fileId) : "",
      // ✅ add download endpoint for convenience
      downloadUrl: d.fileId ? `/api/documents/download?id=${d.fileId}` : "",
    }));

    return NextResponse.json(documents);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

/** POST upload (admin only) */
export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = jwt.verify(token, SECRET) as any;

    if ((payload?.role || "").toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();

    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const rawCategory = requiredString(formData.get("category")) || "Academe";
    const category = normalizeCategory(rawCategory);

    const folder = requiredString(formData.get("folder")); // optional subfolder inside category
    const title = requiredString(formData.get("title"));
    const dateReceived = requiredString(formData.get("dateReceived")); // YYYY-MM-DD if you use date input
    const year = requiredString(formData.get("year"));
    const type = requiredString(formData.get("type")) || "Document";

    // file name handling
    const originalName = (file as File).name || "upload";
    const finalName = originalName;

    const drive = getDriveClient();

    // ✅ ROOT folder
    const ROOT = "Hamiguitan Repository";
    const rootId = await findOrCreateFolder(drive, ROOT);

    // ✅ Category folder
    const categoryId = await findOrCreateFolder(drive, category, rootId);

    // ✅ Optional subfolder (School/Stakeholder name). No duplicates because search-by-parent.
    let targetParent = categoryId;
    if (folder) {
      targetParent = await findOrCreateFolder(drive, folder, categoryId);
    }

    // ✅ Upload INTO correct folder so you can locate it in Drive
    const arrayBuffer = await (file as File).arrayBuffer();
    const streamBody = Readable.from(Buffer.from(arrayBuffer));

    const uploaded = await drive.files.create({
      requestBody: {
        name: finalName,
        parents: [targetParent], // ✅ MAO NI
      },
      media: {
        mimeType: (file as File).type || "application/octet-stream",
        body: streamBody,
      },
      fields: "id,name",
    });

    const fileId = uploaded.data.id!;
    const uploadedAt = new Date().toISOString();

    // ✅ Save metadata sa DB
    const info = db
      .prepare(`
        INSERT INTO documents (fileId, name, type, category, folder, title, dateReceived, year, uploadedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        fileId,
        finalName,
        type,
        category,
        folder || "",
        title || "",
        dateReceived || "",
        year || "",
        uploadedAt
      );

    return NextResponse.json({
      ok: true,
      id: info.lastInsertRowid,
      fileId,
      name: finalName,
      category,
      folder: folder || "",
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
  }
}