export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import db from "@/app/lib/db";
import jwt from "jsonwebtoken";
import { google } from "googleapis";
import { createOAuthClient } from "@/app/lib/googleDrive";

const SECRET = process.env.JWT_SECRET!;

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const doc = db
    .prepare("SELECT id, fileId FROM documents WHERE id = ?")
    .get(id) as any;

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ✅ OPTIONAL: delete from Google Drive
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
    // if drive delete fails, we can still delete DB or return error
    // choose behavior: here we still proceed DB delete but warn
    console.error("DRIVE DELETE FAILED:", e);
  }

  // delete DB record
  db.prepare("DELETE FROM documents WHERE id = ?").run(id);

  return NextResponse.json({ success: true });
}