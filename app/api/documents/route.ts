export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/auth";

function normalizeCategory(v: string) {
  const s = (v || "").trim().toLowerCase();

  if (s === "stakeholder" || s === "stakeholders") return "Stakeholders";
  if (s === "academe") return "Academe";
  if (s === "pamo activity" || s === "pamo" || s === "activity" || s === "activities") {
    return "PAMO Activity";
  }

  return "";
}

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function loadAuditLogModule() {
  return import("@/app/lib/auditLog");
}

async function loadGoogleDriveModule() {
  return import("@/app/lib/googleDrive");
}

function buildAuditPath(category: string, folder: string) {
  return folder ? `${category} / ${folder}` : category;
}

const BASE_DOCUMENT_SELECT = "id,fileId,name,type,category,folder,title,dateReceived,year,uploadedAt";
const EXTENDED_DOCUMENT_SELECT = `${BASE_DOCUMENT_SELECT},source_module,source_record_type,source_record_id,source_section`;

function isMissingOptionalDocumentColumnError(error: { code?: string | null; message?: string | null } | null | undefined) {
  const code = String(error?.code || "").trim();
  const message = String(error?.message || "").toLowerCase();

  if (code === "PGRST204" || code === "42703") {
    return true;
  }

  return (
    message.includes("source_module") ||
    message.includes("source_record_type") ||
    message.includes("source_record_id") ||
    message.includes("source_section")
  );
}

function normalizeDocumentRows(rows: Array<Record<string, unknown>>) {
  return rows.map((row) => ({
    ...row,
    sourceModule: row.source_module ?? null,
    sourceRecordType: row.source_record_type ?? null,
    sourceRecordId:
      typeof row.source_record_id === "number" ? row.source_record_id : row.source_record_id ?? null,
    sourceSection: row.source_section ?? null,
  }));
}

export async function GET() {
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: rows, error } = await supabaseAdmin
      .from("documents")
      .select(EXTENDED_DOCUMENT_SELECT)
      .order("uploadedAt", { ascending: false })
      .limit(500);

    if (error) {
      if (!isMissingOptionalDocumentColumnError(error)) {
        console.error("DOCUMENTS GET ERROR:", error);
        return NextResponse.json({ error: "Failed to load documents." }, { status: 500 });
      }

      console.error("DOCUMENTS GET FALLBACK:", error);

      const { data: fallbackRows, error: fallbackError } = await supabaseAdmin
        .from("documents")
        .select(BASE_DOCUMENT_SELECT)
        .order("uploadedAt", { ascending: false })
        .limit(500);

      if (fallbackError) {
        console.error("DOCUMENTS GET FALLBACK ERROR:", fallbackError);
        return NextResponse.json({ error: "Failed to load documents." }, { status: 500 });
      }

      return NextResponse.json(normalizeDocumentRows((fallbackRows || []) as Array<Record<string, unknown>>));
    }

    return NextResponse.json(normalizeDocumentRows((rows || []) as Array<Record<string, unknown>>));
  } catch (error) {
    console.error("DOCUMENTS GET FATAL:", error);
    return NextResponse.json({ error: "Failed to load documents." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const role = normalizeRole(me.role);

    if (role !== "admin" && role !== "co_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const fileId = String(body?.fileId || "").trim();
    const name = String(body?.name || "").trim();
    const mimeType = String(body?.type || "application/octet-stream").trim();
    const rawCategory = String(body?.category || "").trim();
    const category = normalizeCategory(rawCategory);
    const folder = String(body?.folder || "").trim();
    const title = String(body?.title || "").trim();
    const dateReceived = String(body?.dateReceived || "").trim();
    const year = String(body?.year || new Date().getFullYear()).trim();

    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId." }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Missing file name." }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Document title is required." }, { status: 400 });
    }

    if (!dateReceived) {
      return NextResponse.json({ error: "Date received is required." }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const uploadedAt = new Date().toISOString();

    const { data: insertedRow, error: insertError } = await supabaseAdmin
      .from("documents")
      .insert([
        {
          fileId,
          name,
          type: mimeType,
          category,
          folder,
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
        { error: insertError.message || "Failed to save document metadata." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: insertedRow?.id,
      fileId,
      name,
      type: mimeType,
      category,
      folder,
    });
  } catch (error: unknown) {
    console.error("DOCUMENT POST ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to save document.") },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const role = normalizeRole(me.role);

    if (role !== "admin" && role !== "co_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const id = Number(body?.id);
    const category = normalizeCategory(String(body?.category || ""));
    const title = String(body?.title || "").trim();
    const dateReceived = String(body?.dateReceived || "").trim();
    const { normalizeFolderName } = await loadGoogleDriveModule();
    let folder = normalizeFolderName(String(body?.folder || ""));

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid document id." }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Document title is required." }, { status: 400 });
    }

    if (!dateReceived) {
      return NextResponse.json({ error: "Date received is required." }, { status: 400 });
    }

    if ((category === "Stakeholders" || category === "PAMO Activity") && !folder) {
      return NextResponse.json({ error: "Folder is required for this category." }, { status: 400 });
    }

    if (category === "Stakeholders" && folder) {
      folder = folder.toUpperCase();
    }

    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateReceived)
      ? new Date(`${dateReceived}T00:00:00.000Z`)
      : new Date(dateReceived);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date received." }, { status: 400 });
    }

    const year = String(parsedDate.getUTCFullYear());

    const { data: currentDocument, error: currentDocumentError } = await supabaseAdmin
      .from("documents")
      .select("id,fileId,name,type,category,folder,title,dateReceived,year,uploadedAt")
      .eq("id", id)
      .single();

    if (currentDocumentError) {
      console.error("DOCUMENT PATCH LOAD ERROR:", currentDocumentError);
      return NextResponse.json(
        { error: currentDocumentError.message || "Failed to load document." },
        { status: currentDocumentError.code === "PGRST116" ? 404 : 500 }
      );
    }

    const currentCategory = normalizeCategory(String(currentDocument?.category || ""));
    const currentFolder = normalizeFolderName(String(currentDocument?.folder || ""));
    const locationChanged = currentCategory !== category || currentFolder !== folder;

    if (locationChanged) {
      const fileId = String(currentDocument?.fileId || "").trim();

      if (!fileId) {
        return NextResponse.json(
          { error: "Document is missing its Google Drive file reference." },
          { status: 409 }
        );
      }

      try {
        const {
          ensureFileInExpectedParent,
          getDriveClient,
          getDriveFileInfo,
          moveDriveFileToParent,
          resolveExistingDocumentDriveParent,
          resolveDocumentDriveParent,
        } = await loadGoogleDriveModule();
        const drive = getDriveClient();
        const driveFile = await getDriveFileInfo(drive, fileId);
        const expectedSourceParentId = await resolveExistingDocumentDriveParent(
          drive,
          currentCategory,
          currentFolder
        );

        await ensureFileInExpectedParent(
          drive,
          fileId,
          driveFile.parents,
          expectedSourceParentId || ""
        );

        const targetParentId = await resolveDocumentDriveParent(drive, category, folder);

        await moveDriveFileToParent(drive, fileId, driveFile.parents, targetParentId);
      } catch (error: unknown) {
        console.error("DOCUMENT PATCH DRIVE MOVE ERROR:", error);
        return NextResponse.json(
          { error: getErrorMessage(error, "Failed to move document in Google Drive.") },
          { status: 500 }
        );
      }
    }

    const { data: updated, error } = await supabaseAdmin
      .from("documents")
      .update({
        category,
        title,
        dateReceived,
        folder,
        year,
      })
      .eq("id", id)
      .select("id,fileId,name,type,category,folder,title,dateReceived,year,uploadedAt")
      .single();

    if (error) {
      console.error("DOCUMENT PATCH ERROR:", error);
      return NextResponse.json({ error: error.message || "Failed to update document." }, { status: 500 });
    }

    const { writeAuditLog } = await loadAuditLogModule();

    await writeAuditLog({
      userId: me.id,
      userEmail: me.email,
      action: locationChanged ? "document_move" : "document_edit",
      fileName: String(updated?.name || currentDocument?.name || ""),
      fromPath: buildAuditPath(currentCategory, currentFolder),
      toPath: buildAuditPath(category, folder),
    });

    return NextResponse.json({ ok: true, document: updated });
  } catch (error: unknown) {
    console.error("DOCUMENT PATCH FATAL:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to update document.") },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const role = normalizeRole(me.role);

    if (role !== "admin" && role !== "co_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const category = normalizeCategory(String(body?.category || ""));
    const {
      deleteDriveFileById,
      ensureFileInExpectedParent,
      getDriveClient,
      getDriveFileInfo,
      isDriveFolderEmpty,
      normalizeFolderName,
      moveDriveFileToParent,
      replaceDriveFileParents,
      resolveDocumentDriveParent,
      resolveExistingDocumentDriveParent,
    } = await loadGoogleDriveModule();
    let oldFolder = normalizeFolderName(String(body?.oldFolder || ""));
    let newFolder = normalizeFolderName(String(body?.newFolder || ""));

    if (!category) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    if (!oldFolder || oldFolder.toLowerCase() === "unsorted") {
      return NextResponse.json({ error: "Invalid current folder name." }, { status: 400 });
    }

    if (!newFolder) {
      return NextResponse.json({ error: "New folder name is required." }, { status: 400 });
    }

    if (category === "Stakeholders") {
      oldFolder = oldFolder.toUpperCase();
      newFolder = newFolder.toUpperCase();
    }

    if (oldFolder.toLowerCase() === newFolder.toLowerCase()) {
      return NextResponse.json({ error: "New folder name must be different." }, { status: 400 });
    }

    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("documents")
      .select("id,fileId")
      .eq("category", category)
      .eq("folder", oldFolder);

    if (existingError) {
      console.error("FOLDER RENAME PRECHECK ERROR:", existingError);
      return NextResponse.json({ error: "Failed to verify folder rename." }, { status: 500 });
    }

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ error: "Folder not found in this category." }, { status: 404 });
    }

    const missingFileId = existingRows.find((row) => !String(row.fileId || "").trim());
    if (missingFileId) {
      return NextResponse.json(
        { error: "One or more documents are missing their Google Drive file reference." },
        { status: 409 }
      );
    }

    const drive = getDriveClient();
    const expectedSourceParentId = await resolveExistingDocumentDriveParent(
      drive,
      category,
      oldFolder
    );

    if (!expectedSourceParentId) {
      return NextResponse.json(
        { error: "Current Drive folder could not be resolved for this category." },
        { status: 409 }
      );
    }

    const targetParentId = await resolveDocumentDriveParent(drive, category, newFolder);
    const movedFiles: Array<{ fileId: string; originalParents: string[] }> = [];

    try {
      for (const row of existingRows) {
        const fileId = String(row.fileId || "").trim();
        const driveFile = await getDriveFileInfo(drive, fileId);

        await ensureFileInExpectedParent(
          drive,
          fileId,
          driveFile.parents,
          expectedSourceParentId
        );

        const moveResult = await moveDriveFileToParent(
          drive,
          fileId,
          driveFile.parents,
          targetParentId
        );

        if (moveResult.moved) {
          movedFiles.push({
            fileId,
            originalParents: driveFile.parents,
          });
        }
      }
    } catch (error: unknown) {
      console.error("FOLDER RENAME DRIVE MOVE ERROR:", error);

      for (let i = movedFiles.length - 1; i >= 0; i -= 1) {
        const moved = movedFiles[i];
        try {
          const currentDriveFile = await getDriveFileInfo(drive, moved.fileId);
          if (moved.originalParents.length > 0) {
            await replaceDriveFileParents(
              drive,
              moved.fileId,
              currentDriveFile.parents,
              moved.originalParents
            );
          }
        } catch (rollbackError) {
          console.error("FOLDER RENAME ROLLBACK ERROR:", rollbackError);
        }
      }

      return NextResponse.json(
        { error: getErrorMessage(error, "Failed to move folder contents in Google Drive.") },
        { status: 500 }
      );
    }

    const { error } = await supabaseAdmin
      .from("documents")
      .update({ folder: newFolder })
      .eq("category", category)
      .eq("folder", oldFolder);

    if (error) {
      console.error("FOLDER RENAME ERROR:", error);

      for (let i = movedFiles.length - 1; i >= 0; i -= 1) {
        const moved = movedFiles[i];
        try {
          const currentDriveFile = await getDriveFileInfo(drive, moved.fileId);
          if (moved.originalParents.length > 0) {
            await replaceDriveFileParents(
              drive,
              moved.fileId,
              currentDriveFile.parents,
              moved.originalParents
            );
          }
        } catch (rollbackError) {
          console.error("FOLDER RENAME DB ROLLBACK ERROR:", rollbackError);
        }
      }

      return NextResponse.json({ error: error.message || "Failed to rename folder." }, { status: 500 });
    }

    const { writeAuditLog } = await loadAuditLogModule();

    await writeAuditLog({
      userId: me.id,
      userEmail: me.email,
      action: "folder_rename",
      fileName: oldFolder,
      fromPath: buildAuditPath(category, oldFolder),
      toPath: buildAuditPath(category, newFolder),
    });

    try {
      const canDeleteOldFolder = await isDriveFolderEmpty(drive, expectedSourceParentId);
      if (canDeleteOldFolder) {
        await deleteDriveFileById(drive, expectedSourceParentId);
      }
    } catch (cleanupError) {
      console.error("FOLDER RENAME CLEANUP ERROR:", cleanupError);
    }

    return NextResponse.json({
      ok: true,
      category,
      oldFolder,
      newFolder,
      updatedCount: existingRows.length,
    });
  } catch (error: unknown) {
    console.error("FOLDER RENAME FATAL:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to rename folder.") },
      { status: 500 }
    );
  }
}
