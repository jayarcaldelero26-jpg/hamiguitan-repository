export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Readable } from "stream";
import { supabaseAdmin } from "@/app/lib/db";
import {
  getDriveClient,
  findOrCreateFolder,
  normalizeDriveCategory,
  normalizeFolderName,
} from "@/app/lib/googleDrive";

const SECRET = process.env.JWT_SECRET!;
const TEMP_BUCKET = "temp-uploads";

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

function requiredString(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function getCategoryFolderId(category: string) {
  if (category === "Academe") return ACADEME_ID;
  if (category === "Stakeholders") return STAKEHOLDERS_ID;
  if (category === "PAMO Activity") return PAMO_ID;
  return "";
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

    const tempPath = requiredString(body?.tempPath);
    const originalName = requiredString(body?.originalName);
    const mimeType =
      requiredString(body?.mimeType) || "application/octet-stream";
    const rawCategory = requiredString(body?.category);
    const title = requiredString(body?.title);
    const dateReceived = requiredString(body?.dateReceived);
    const year =
      requiredString(body?.year) || new Date().getFullYear().toString();
    let folder = normalizeFolderName(requiredString(body?.folder));

    if (!tempPath) {
      return NextResponse.json(
        { error: "Missing temp file path." },
        { status: 400 }
      );
    }

    if (!originalName) {
      return NextResponse.json(
        { error: "Missing original file name." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "Document title is required." },
        { status: 400 }
      );
    }

    if (!dateReceived) {
      return NextResponse.json(
        { error: "Date received is required." },
        { status: 400 }
      );
    }

    const category = normalizeDriveCategory(rawCategory);
    const isStakeholder = category === "Stakeholders";
    const isPamo = category === "PAMO Activity";

    if ((isStakeholder || isPamo) && !folder) {
      return NextResponse.json(
        {
          error:
            category === "Stakeholders"
              ? "Stakeholder folder/name is required."
              : "Activity group is required.",
        },
        { status: 400 }
      );
    }

    if (isStakeholder && folder) {
      folder = folder.toUpperCase();
    }

    const categoryFolderId = getCategoryFolderId(category);
    if (!categoryFolderId) {
      return NextResponse.json(
        { error: "Invalid category folder configuration." },
        { status: 500 }
      );
    }

    console.log("TRANSFER START:", {
      tempPath,
      originalName,
      mimeType,
      category,
      folder,
      title,
      dateReceived,
      year,
    });

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(TEMP_BUCKET)
      .download(tempPath);

    if (downloadError || !fileData) {
      console.error("SUPABASE DOWNLOAD ERROR:", downloadError);
      return NextResponse.json(
        { error: downloadError?.message || "Failed to download temp file." },
        { status: 500 }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!buffer.length) {
      return NextResponse.json(
        { error: "Temporary file is empty." },
        { status: 400 }
      );
    }

    const drive = getDriveClient();

    let targetFolderId = categoryFolderId;
    if (folder) {
      targetFolderId = await findOrCreateFolder(drive, folder, categoryFolderId);
    }

    const uploaded = await drive.files.create({
      requestBody: {
        name: originalName,
        parents: [targetFolderId],
      },
      media: {
        mimeType,
        body: Readable.from(buffer),
      },
      fields: "id,name,webViewLink",
      supportsAllDrives: true,
    });

    const fileId = uploaded.data.id;
    if (!fileId) {
      throw new Error("Google Drive did not return a file ID.");
    }

    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          type: "anyone",
          role: "reader",
        },
        supportsAllDrives: true,
      });
    } catch (permError) {
      console.error("DRIVE PERMISSION WARNING:", permError);
    }

    const uploadedAt = new Date().toISOString();

    const { data: insertedRow, error: insertError } = await supabaseAdmin
      .from("documents")
      .insert([
        {
          fileId,
          name: originalName,
          type: mimeType,
          category,
          folder: folder || "",
          title,
          dateReceived,
          year,
          uploadedAt,
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      console.error("DOCUMENT INSERT ERROR:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to save metadata." },
        { status: 500 }
      );
    }

    const { error: removeError } = await supabaseAdmin.storage
      .from(TEMP_BUCKET)
      .remove([tempPath]);

    if (removeError) {
      console.error("TEMP FILE DELETE WARNING:", removeError);
    }

    console.log("TRANSFER DONE:", {
      id: insertedRow?.id,
      fileId,
      name: originalName,
    });

    return NextResponse.json({
      ok: true,
      id: insertedRow?.id,
      fileId,
      name: originalName,
      category,
      folder: folder || "",
    });
  } catch (error: any) {
    console.error("TRANSFER ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "Transfer failed." },
      { status: 500 }
    );
  }
}