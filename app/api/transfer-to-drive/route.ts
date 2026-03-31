export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import type { ReadableStream as NodeReadableStream } from "stream/web";
import { supabaseAdmin } from "@/app/lib/db";
import { writeAuditLog } from "@/app/lib/auditLog";
import {
  getDriveClient,
  findOrCreateFolder,
  normalizeDriveCategory,
  normalizeFolderName,
} from "@/app/lib/googleDrive";
import { getCurrentUser } from "@/app/lib/auth";
import { assertTrustedOrigin, isInvalidOriginError } from "@/app/lib/requestSecurity";
import { serverEnv } from "@/app/lib/serverEnv";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function requiredString(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getCategoryFolderId(category: string) {
  if (category === "Academe") return serverEnv.driveAcademeFolderId;
  if (category === "Stakeholders") return serverEnv.driveStakeholdersFolderId;
  if (category === "PAMO Activity") return serverEnv.drivePamoFolderId;
  return "";
}

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);

    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = normalizeRole(me.role);
    if (role !== "admin" && role !== "co_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const tempPath = requiredString(body?.tempPath);
    const originalName = requiredString(body?.originalName);
    const mimeType = requiredString(body?.mimeType) || "application/octet-stream";
    const rawCategory = requiredString(body?.category);
    const title = requiredString(body?.title);
    const dateReceived = requiredString(body?.dateReceived);
    const year =
      requiredString(body?.year) || new Date().getFullYear().toString();
    const declaredFileSize =
      typeof body?.fileSize === "number" && Number.isFinite(body.fileSize)
        ? body.fileSize
        : 0;

    let folder = normalizeFolderName(requiredString(body?.folder));

    if (!tempPath) {
      return NextResponse.json({ error: "Missing temp file path." }, { status: 400 });
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

    if (declaredFileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum allowed file size is 50 MB." },
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
      declaredFileSize,
    });

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(serverEnv.tempUploadsBucket)
      .download(tempPath);

    if (downloadError || !fileData) {
      console.error("SUPABASE DOWNLOAD ERROR:", downloadError);
      return NextResponse.json(
        { error: downloadError?.message || "Failed to download temp file." },
        { status: 500 }
      );
    }

    const actualFileSize =
      typeof fileData.size === "number" ? fileData.size : declaredFileSize;

    if (!actualFileSize) {
      return NextResponse.json(
        { error: "Temporary file is empty." },
        { status: 400 }
      );
    }

    if (actualFileSize > MAX_FILE_SIZE) {
      try {
        await supabaseAdmin.storage
          .from(serverEnv.tempUploadsBucket)
          .remove([tempPath]);
      } catch (cleanupError) {
        console.error("TEMP FILE CLEANUP WARNING:", cleanupError);
      }

      return NextResponse.json(
        { error: "File is too large. Maximum allowed file size is 50 MB." },
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
        body: Readable.fromWeb(fileData.stream() as unknown as NodeReadableStream),
      },
      fields: "id,name,webViewLink",
      supportsAllDrives: true,
    });

    const fileId = uploaded.data.id;
    if (!fileId) {
      throw new Error("Google Drive did not return a file ID.");
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
      .from(serverEnv.tempUploadsBucket)
      .remove([tempPath]);

    if (removeError) {
      console.error("TEMP FILE DELETE WARNING:", removeError);
    }

    console.log("TRANSFER DONE:", {
      id: insertedRow?.id,
      fileId,
      name: originalName,
    });

    await writeAuditLog({
      userId: me.id,
      userEmail: me.email,
      action: "document_upload",
      fileName: originalName,
      fromPath: null,
      toPath: folder ? `${category} / ${folder}` : category,
    });

    return NextResponse.json({
      ok: true,
      id: insertedRow?.id,
      fileId,
      name: originalName,
      category,
      folder: folder || "",
    });
  } catch (error: unknown) {
    if (isInvalidOriginError(error)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    console.error("TRANSFER ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Transfer failed.") },
      { status: 500 }
    );
  }
}
