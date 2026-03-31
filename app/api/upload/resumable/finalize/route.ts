export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/auth";
import { writeAuditLog } from "@/app/lib/auditLog";
import { assertTrustedOrigin, isInvalidOriginError } from "@/app/lib/requestSecurity";
import {
  findOrCreateFolder,
  getCategoryFolderId,
  getDriveClient,
  normalizeDriveCategory,
  normalizeFolderName,
} from "@/app/lib/googleDrive";

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function requiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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
    const fileId = requiredString(body?.fileId);
    const originalName = requiredString(body?.originalName);
    const mimeType = requiredString(body?.mimeType) || "application/octet-stream";
    const rawCategory = requiredString(body?.category);
    const title = requiredString(body?.title);
    const dateReceived = requiredString(body?.dateReceived);
    const year = requiredString(body?.year) || new Date().getFullYear().toString();
    const declaredFileSize =
      typeof body?.fileSize === "number" && Number.isFinite(body.fileSize)
        ? body.fileSize
        : 0;
    let folder = normalizeFolderName(requiredString(body?.folder));

    if (!fileId) {
      return NextResponse.json({ error: "Missing uploaded Google Drive file ID." }, { status: 400 });
    }

    if (!originalName) {
      return NextResponse.json({ error: "Missing original file name." }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Document title is required." }, { status: 400 });
    }

    if (!dateReceived) {
      return NextResponse.json({ error: "Date received is required." }, { status: 400 });
    }

    const category = normalizeDriveCategory(rawCategory);
    const isStakeholder = category === "Stakeholders";
    const isPamo = category === "PAMO Activity";

    if (!category) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

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

    const drive = getDriveClient();
    let expectedParentId = categoryFolderId;

    if (folder) {
      expectedParentId = await findOrCreateFolder(drive, folder, categoryFolderId);
    }

    const driveFile = await drive.files.get({
      fileId,
      fields: "id,name,mimeType,size,parents,trashed",
      supportsAllDrives: true,
    });

    const driveData = driveFile.data;
    if (!driveData.id || driveData.trashed) {
      return NextResponse.json({ error: "Uploaded Drive file could not be verified." }, { status: 400 });
    }

    const parents = (driveData.parents || []).filter(Boolean);
    if (!parents.includes(expectedParentId)) {
      return NextResponse.json(
        { error: "Uploaded Drive file is not in the expected repository folder." },
        { status: 400 }
      );
    }

    const actualSize = Number(driveData.size || 0);
    if (declaredFileSize && actualSize && declaredFileSize !== actualSize) {
      return NextResponse.json(
        { error: "Uploaded file size does not match the completed Drive upload." },
        { status: 400 }
      );
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
      .select("id,fileId,name,type,category,folder,title,dateReceived,year,uploadedAt")
      .single();

    if (insertError) {
      console.error("RESUMABLE FINALIZE DB INSERT ERROR:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to save metadata." },
        { status: 500 }
      );
    }

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
      id: insertedRow.id,
      fileId,
      name: originalName,
      category,
      folder: folder || "",
      document: insertedRow,
    });
  } catch (error: unknown) {
    if (isInvalidOriginError(error)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    console.error("RESUMABLE UPLOAD FINALIZE ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to finalize resumable upload.") },
      { status: 500 }
    );
  }
}
