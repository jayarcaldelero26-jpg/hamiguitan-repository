export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/db";
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

/** GET documents */
export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    jwt.verify(token, SECRET);

    const { data: rows, error } = await supabaseAdmin
      .from("documents")
      .select(`
        id,
        fileId,
        name,
        type,
        category,
        folder,
        title,
        dateReceived,
        year,
        uploadedAt
      `)
      .order("uploadedAt", { ascending: false });

    if (error) {
      console.error("DOCUMENTS GET ERROR:", error);
      return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
    }

    const documents = (rows || []).map((d: any) => ({
      ...d,
      url: d.fileId ? drivePreviewUrl(d.fileId) : "",
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
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const folder = requiredString(formData.get("folder"));
    const title = requiredString(formData.get("title"));
    const dateReceived = requiredString(formData.get("dateReceived"));
    const year = requiredString(formData.get("year"));
    const type = requiredString(formData.get("type")) || "Document";

    const originalName = (file as File).name || "upload";
    const finalName = originalName;

    const drive = getDriveClient();

    const ROOT = "Hamiguitan Repository";
    const rootId = await findOrCreateFolder(drive, ROOT);

    const categoryId = await findOrCreateFolder(drive, category, rootId);

    let targetParent = categoryId;
    if (folder) {
      targetParent = await findOrCreateFolder(drive, folder, categoryId);
    }

    const arrayBuffer = await (file as File).arrayBuffer();
    const streamBody = Readable.from(Buffer.from(arrayBuffer));

    const uploaded = await drive.files.create({
      requestBody: {
        name: finalName,
        parents: [targetParent],
      },
      media: {
        mimeType: (file as File).type || "application/octet-stream",
        body: streamBody,
      },
      fields: "id,name",
    });

    const fileId = uploaded.data.id!;
    const uploadedAt = new Date().toISOString();

    const { data: insertedRow, error: insertError } = await supabaseAdmin
      .from("documents")
      .insert([
        {
          fileId,
          name: finalName,
          type,
          category,
          folder: folder || "",
          title: title || "",
          dateReceived: dateReceived || "",
          year: year || "",
          uploadedAt,
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      console.error("DOCUMENT INSERT ERROR:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to save document metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: insertedRow?.id,
      fileId,
      name: finalName,
      category,
      folder: folder || "",
    });
  } catch (e: any) {
    console.error("DOCUMENT POST ERROR:", e);
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
  }
}