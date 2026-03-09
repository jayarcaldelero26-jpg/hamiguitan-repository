export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/db";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

function normalizeCategory(v: string) {
  const s = (v || "").trim().toLowerCase();

  if (s === "stakeholder" || s === "stakeholders") return "Stakeholders";
  if (s === "academe") return "Academe";
  if (s === "pamo activity" || s === "pamo" || s === "activity" || s === "activities") {
    return "PAMO Activity";
  }

  return "Academe";
}

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function drivePreviewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;
}

function getTokenPayload(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, SECRET) as any;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const payload = getTokenPayload(req);

  if (!payload) {
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
      return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
    }

    const documents = (rows || []).map((d: any) => ({
      ...d,
      url: d.fileId ? drivePreviewUrl(d.fileId) : "",
      downloadUrl: d.fileId ? `/api/documents/download?id=${d.fileId}` : "",
    }));

    return NextResponse.json(documents);
  } catch (e: any) {
    console.error("DOCUMENTS GET FATAL:", e);
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const payload = getTokenPayload(req);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const role = normalizeRole(payload?.role);

    if (role !== "admin" && role !== "co_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const fileId = String(body?.fileId || "").trim();
    const name = String(body?.name || "").trim();
    const mimeType = String(body?.type || "application/octet-stream").trim();
    const rawCategory = String(body?.category || "Academe").trim();
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
        { error: insertError.message || "Failed to save document metadata" },
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
  } catch (e: any) {
    console.error("DOCUMENT POST ERROR:", e);
    return NextResponse.json({ error: e?.message || "Failed to save document" }, { status: 500 });
  }
}