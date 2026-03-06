export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/db";
import jwt from "jsonwebtoken";
import { google } from "googleapis";
import { createOAuthClient } from "@/app/lib/googleDrive";

const SECRET = process.env.JWT_SECRET!;

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let user: any;
  try {
    user = jwt.verify(token, SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const idStr = searchParams.get("id");
  const id = Number(idStr);

  if (!idStr || Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const { data: doc, error: findError } = await supabaseAdmin
    .from("documents")
    .select("id, fileId")
    .eq("id", id)
    .maybeSingle();

  if (findError) {
    console.error("DELETE DOCUMENT FIND ERROR:", findError);
    return NextResponse.json({ error: "Failed to find document" }, { status: 500 });
  }

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    if (doc.fileId) {
      const oauth2Client = createOAuthClient();
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });

      const drive = google.drive({ version: "v3", auth: oauth2Client });
      await drive.files.delete({ fileId: doc.fileId });
    }
  } catch (e) {
    console.error("DRIVE DELETE FAILED:", e);
  }

  const { error: deleteError } = await supabaseAdmin
    .from("documents")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("DELETE DOCUMENT DB ERROR:", deleteError);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}