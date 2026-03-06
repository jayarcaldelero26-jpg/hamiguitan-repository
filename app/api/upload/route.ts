export const runtime = "nodejs";

import { supabaseAdmin } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createOAuthClient } from "@/app/lib/googleDrive";
import { Readable } from "stream";
import { getCurrentUser } from "@/app/lib/auth";

function requiredString(v: FormDataEntryValue | null) {
  if (!v || typeof v !== "string") return "";
  return v.trim();
}

function normalizeSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function normalizeCategoryFolderName(category: string) {
  const c = (category || "").trim().toLowerCase();

  if (c === "academe") return "Academe";
  if (c === "stakeholder" || c === "stakeholders") return "Stakeholders";
  if (c === "pamo activity" || c === "pamo" || c === "activity" || c === "activities") {
    return "PAMO Activity";
  }
  if (c === "general") return "General";
  return "General";
}

async function findOrCreateFolder(
  drive: any,
  name: string,
  parentId?: string
): Promise<string> {
  const safeName = name.replace(/'/g, "\\'");

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
  });

  const found = existing.data.files?.[0];
  if (found?.id) return found.id;

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

export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (me.role !== "admin" && me.role !== "co_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();

    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    let category = requiredString(formData.get("category")) || "General";
    const title = requiredString(formData.get("title"));
    const dateReceived = requiredString(formData.get("dateReceived"));
    let folder = requiredString(formData.get("folder"));
    const year = requiredString(formData.get("year")) || new Date().getFullYear().toString();

    category = normalizeSpaces(category);
    folder = normalizeSpaces(folder);

    const catLower = category.toLowerCase();

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    if (!dateReceived) {
      return NextResponse.json({ error: "Date received is required." }, { status: 400 });
    }

    const isStakeholder = catLower === "stakeholder" || catLower === "stakeholders";
    if (isStakeholder && !folder) {
      return NextResponse.json(
        { error: "Stakeholder folder/name is required." },
        { status: 400 }
      );
    }

    if (isStakeholder && folder) {
      folder = folder.toUpperCase();
    }

    const stream = (file as File).stream();
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as any) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const ROOT = "Hamiguitan Repository";
    const rootId = await findOrCreateFolder(drive, ROOT);

    const categoryFolderName = normalizeCategoryFolderName(category);
    const categoryFolderId = await findOrCreateFolder(drive, categoryFolderName, rootId);

    let targetFolderId = categoryFolderId;
    if (folder) {
      targetFolderId = await findOrCreateFolder(drive, folder, categoryFolderId);
    }

    const readableStream = Readable.from(buffer);

    const uploaded = await drive.files.create({
      requestBody: {
        name: (file as File).name,
        parents: [targetFolderId],
      },
      media: {
        mimeType: (file as File).type || "application/octet-stream",
        body: readableStream,
      },
      fields: "id",
    });

    const fileId = uploaded.data.id;
    if (!fileId) {
      return NextResponse.json({ error: "Google Drive upload failed." }, { status: 500 });
    }

    await drive.permissions.create({
      fileId,
      requestBody: {
        type: "anyone",
        role: "reader",
      },
    });

    const fileName = (file as File).name;
    const fileType = (file as File).type || "unknown";
    const uploadedAt = new Date().toISOString();

    const { error: insertError } = await supabaseAdmin.from("documents").insert([
      {
        fileId,
        name: fileName,
        type: fileType,
        category: categoryFolderName,
        folder: folder || "",
        title,
        dateReceived,
        year,
        uploadedAt,
      },
    ]);

    if (insertError) {
      console.error("UPLOAD DB INSERT ERROR:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to save metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, fileId });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json(
      { error: "Upload failed", details: String(error) },
      { status: 500 }
    );
  }
}