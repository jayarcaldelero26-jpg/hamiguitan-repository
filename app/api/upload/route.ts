export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { supabaseAdmin } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/auth";
import {
  getDriveClient,
  findOrCreateFolder,
  normalizeDriveCategory,
  normalizeFolderName,
} from "@/app/lib/googleDrive";

const ACADEME_ID = process.env.DRIVE_ACADEME_FOLDER_ID!;
const STAKEHOLDERS_ID = process.env.DRIVE_STAKEHOLDERS_FOLDER_ID!;
const PAMO_ID = process.env.DRIVE_PAMO_FOLDER_ID!;

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

function requiredString(v: FormDataEntryValue | null) {
  if (!v || typeof v !== "string") return "";
  return v.trim();
}

function getCategoryFolderId(category: string) {
  if (category === "Academe") return ACADEME_ID;
  if (category === "Stakeholders") return STAKEHOLDERS_ID;
  if (category === "PAMO Activity") return PAMO_ID;
  return "";
}

export async function POST(req: NextRequest) {
  let uploadTotalStarted = false;

  try {
    console.time("upload-total");
    uploadTotalStarted = true;

    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (me.role !== "admin" && me.role !== "co_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!ACADEME_ID || !STAKEHOLDERS_ID || !PAMO_ID) {
      return NextResponse.json(
        { error: "Drive folder IDs are not configured." },
        { status: 500 }
      );
    }

    const formData = await req.formData();

    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const rawCategory = requiredString(formData.get("category"));
    const title = requiredString(formData.get("title"));
    const dateReceived = requiredString(formData.get("dateReceived"));
    let folder = normalizeFolderName(requiredString(formData.get("folder")));
    const year =
      requiredString(formData.get("year")) || new Date().getFullYear().toString();

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
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

    const fileObj = file as File;
    const fileName = fileObj.name || "upload";
    const mimeType = fileObj.type || "application/octet-stream";

    const arrayBuffer = await fileObj.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!buffer.length) {
      return NextResponse.json(
        { error: "Selected file is empty." },
        { status: 400 }
      );
    }

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Maximum file size is 100MB." },
        { status: 400 }
      );
    }

    console.log("UPLOAD START:", {
      userId: me.id,
      role: me.role,
      category,
      folder,
      title,
      dateReceived,
      year,
      fileName,
      mimeType,
      size: buffer.length,
    });

    const drive = getDriveClient();

    console.time("resolve-folder");
    let targetFolderId = categoryFolderId;

    if (folder) {
      targetFolderId = await findOrCreateFolder(drive, folder, categoryFolderId);
    }
    console.timeEnd("resolve-folder");

    console.time("drive-upload");
    const uploaded = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [targetFolderId],
      },
      media: {
        mimeType,
        body: Readable.from(buffer),
      },
      fields: "id,name,webViewLink",
      supportsAllDrives: true,
    });
    console.timeEnd("drive-upload");

    const fileId = uploaded.data.id;
    if (!fileId) {
      throw new Error("Google Drive did not return a file ID.");
    }

    console.time("drive-permission");
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
      console.error("UPLOAD PERMISSION WARNING:", permError);
    }
    console.timeEnd("drive-permission");

    const uploadedAt = new Date().toISOString();

    console.time("db-save");
    const { data: insertedRow, error: insertError } = await supabaseAdmin
      .from("documents")
      .insert([
        {
          fileId,
          name: fileName,
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
    console.timeEnd("db-save");

    if (insertError) {
      console.error("UPLOAD DB INSERT ERROR:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to save metadata." },
        { status: 500 }
      );
    }

    console.log("UPLOAD DONE:", {
      id: insertedRow?.id,
      fileId,
      fileName,
    });

    console.timeEnd("upload-total");

    return NextResponse.json({
      ok: true,
      id: insertedRow?.id,
      fileId,
      name: fileName,
      category,
      folder: folder || "",
    });
  } catch (error: any) {
    console.error("UPLOAD ERROR:", error);

    if (uploadTotalStarted) {
      try {
        console.timeEnd("upload-total");
      } catch {}
    }

    return NextResponse.json(
      { error: error?.message || "Upload failed." },
      { status: 500 }
    );
  }
}