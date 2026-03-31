export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import { assertTrustedOrigin, isInvalidOriginError } from "@/app/lib/requestSecurity";
import {
  createDriveResumableUploadSession,
  findOrCreateFolder,
  getCategoryFolderId,
  getDriveClient,
  normalizeDriveCategory,
  normalizeFolderName,
} from "@/app/lib/googleDrive";

const TEMP_UPLOAD_MAX_FILE_SIZE = 50 * 1024 * 1024;

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
    const originalName = requiredString(body?.originalName);
    const mimeType = requiredString(body?.mimeType) || "application/octet-stream";
    const rawCategory = requiredString(body?.category);
    const title = requiredString(body?.title);
    const dateReceived = requiredString(body?.dateReceived);
    const year = requiredString(body?.year) || new Date().getFullYear().toString();
    const fileSize =
      typeof body?.fileSize === "number" && Number.isFinite(body.fileSize)
        ? body.fileSize
        : 0;
    let folder = normalizeFolderName(requiredString(body?.folder));

    if (!originalName) {
      return NextResponse.json({ error: "Missing original file name." }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Document title is required." }, { status: 400 });
    }

    if (!dateReceived) {
      return NextResponse.json({ error: "Date received is required." }, { status: 400 });
    }

    if (!fileSize) {
      return NextResponse.json({ error: "Missing file size." }, { status: 400 });
    }

    if (fileSize <= TEMP_UPLOAD_MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Files up to 50 MB should use the temporary upload flow." },
        { status: 400 }
      );
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
    let targetFolderId = categoryFolderId;

    if (folder) {
      targetFolderId = await findOrCreateFolder(drive, folder, categoryFolderId);
    }

    const { sessionUri } = await createDriveResumableUploadSession({
      fileName: originalName,
      mimeType,
      parentId: targetFolderId,
      fileSize,
    });

    return NextResponse.json({
      ok: true,
      uploadMode: "resumable",
      sessionUri,
      category,
      folder,
      title,
      dateReceived,
      year,
    });
  } catch (error: unknown) {
    if (isInvalidOriginError(error)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    console.error("RESUMABLE UPLOAD INITIATE ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to prepare resumable upload.") },
      { status: 500 }
    );
  }
}
