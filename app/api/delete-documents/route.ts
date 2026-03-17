export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/auth";
import { writeAuditLog } from "@/app/lib/auditLog";
import { deleteDriveFileById, getDriveClient } from "@/app/lib/googleDrive";

function isValidId(value: number) {
  return Number.isInteger(value) && value > 0;
}

export async function DELETE(req: NextRequest) {
  let totalStarted = false;

  try {
    console.time("delete-total");
    totalStarted = true;

    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (me.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const idStr = String(searchParams.get("id") || "").trim();
    const id = Number(idStr);

    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }

    console.time("delete-find-doc");

    const { data: doc, error: findError } = await supabaseAdmin
      .from("documents")
      .select("id, fileId, name, category, folder")
      .eq("id", id)
      .maybeSingle();

    console.timeEnd("delete-find-doc");

    if (findError) {
      console.error("DELETE DOCUMENT FIND ERROR:", findError);
      return NextResponse.json(
        { error: "Failed to find document." },
        { status: 500 }
      );
    }

    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (doc.fileId) {
      try {
        console.time("delete-drive-file");

        const drive = getDriveClient();
        await deleteDriveFileById(drive, doc.fileId);

        console.timeEnd("delete-drive-file");
      } catch (error: unknown) {
        const status = typeof error === "object" && error !== null && "code" in error
          ? Number((error as { code?: unknown }).code)
          : undefined;

        if (status !== 404) {
          console.error("DRIVE DELETE FAILED:", {
            documentId: doc.id,
            fileId: doc.fileId,
            requestedByUserId: me.id,
            error,
          });
          return NextResponse.json(
            { error: "Failed to delete document from Google Drive." },
            { status: 500 }
          );
        }

        console.error("DRIVE DELETE FAILED:", {
          documentId: doc.id,
          fileId: doc.fileId,
          requestedByUserId: me.id,
          error,
        });
      }
    }

    console.time("delete-db-row");

    const { error: deleteError } = await supabaseAdmin
      .from("documents")
      .delete()
      .eq("id", id);

    console.timeEnd("delete-db-row");

    if (deleteError) {
      console.error("DELETE DOCUMENT DB ERROR:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete document." },
        { status: 500 }
      );
    }

    await writeAuditLog({
      userId: me.id,
      userEmail: me.email,
      action: "document_delete",
      fileName: doc.name || null,
      fromPath: doc.folder ? `${doc.category} / ${doc.folder}` : doc.category,
      toPath: null,
    });

    console.timeEnd("delete-total");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE DOCUMENT ERROR:", error);

    if (totalStarted) {
      try {
        console.timeEnd("delete-total");
      } catch {}
    }

    return NextResponse.json(
      { error: "Failed to delete document." },
      { status: 500 }
    );
  }
}
