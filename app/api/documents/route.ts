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

export async function GET() {
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: rows, error } = await supabaseAdmin
      .from("documents")
      .select("id,fileId,name,type,category,folder,title,dateReceived,year,uploadedAt")
      .order("uploadedAt", { ascending: false })
      .limit(500);

    if (error) {
      console.error("DOCUMENTS GET ERROR:", error);
      return NextResponse.json({ error: "Failed to load documents." }, { status: 500 });
    }

    const documents = (rows || []).map((d) => ({
      ...d,
      url: d.fileId ? `/api/documents/preview?id=${encodeURIComponent(d.fileId)}` : "",
      previewUrl: d.fileId ? `/api/documents/preview?id=${encodeURIComponent(d.fileId)}` : "",
      downloadUrl: d.fileId ? `/api/documents/download?id=${encodeURIComponent(d.fileId)}` : "",
    }));

    return NextResponse.json(documents);
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
    const folder = String(body?.folder || "").trim();

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

    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateReceived)
      ? new Date(`${dateReceived}T00:00:00.000Z`)
      : new Date(dateReceived);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date received." }, { status: 400 });
    }

    const year = String(parsedDate.getUTCFullYear());

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
    const oldFolder = String(body?.oldFolder || "").trim();
    const newFolder = String(body?.newFolder || "").trim();

    if (!category) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    if (!oldFolder || oldFolder.toLowerCase() === "unsorted") {
      return NextResponse.json({ error: "Invalid current folder name." }, { status: 400 });
    }

    if (!newFolder) {
      return NextResponse.json({ error: "New folder name is required." }, { status: 400 });
    }

    if (oldFolder.toLowerCase() === newFolder.toLowerCase()) {
      return NextResponse.json({ error: "New folder name must be different." }, { status: 400 });
    }

    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("documents")
      .select("id", { count: "exact" })
      .eq("category", category)
      .eq("folder", oldFolder);

    if (existingError) {
      console.error("FOLDER RENAME PRECHECK ERROR:", existingError);
      return NextResponse.json({ error: "Failed to verify folder rename." }, { status: 500 });
    }

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ error: "Folder not found in this category." }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from("documents")
      .update({ folder: newFolder })
      .eq("category", category)
      .eq("folder", oldFolder);

    if (error) {
      console.error("FOLDER RENAME ERROR:", error);
      return NextResponse.json({ error: error.message || "Failed to rename folder." }, { status: 500 });
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
