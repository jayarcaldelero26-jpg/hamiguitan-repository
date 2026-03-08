export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/db";
import jwt from "jsonwebtoken";
import { getDriveClient } from "@/app/lib/googleDrive";

const SECRET = process.env.JWT_SECRET!;

function getToken(req: NextRequest) {
  return req.cookies.get("auth_token")?.value || "";
}

export async function DELETE(req: NextRequest) {
  let totalStarted = false;

  try {
    console.time("delete-total");
    totalStarted = true;

    const token = getToken(req);
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

    console.time("delete-find-doc");

    const { data: doc, error: findError } = await supabaseAdmin
      .from("documents")
      .select("id, fileId")
      .eq("id", id)
      .maybeSingle();

    console.timeEnd("delete-find-doc");

    if (findError) {
      console.error("DELETE DOCUMENT FIND ERROR:", findError);
      return NextResponse.json({ error: "Failed to find document" }, { status: 500 });
    }

    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (doc.fileId) {
      try {
        console.time("delete-drive-file");

        const drive = getDriveClient();
        await drive.files.delete({
          fileId: doc.fileId,
          supportsAllDrives: true,
        });

        console.timeEnd("delete-drive-file");
      } catch (e) {
        console.error("DRIVE DELETE FAILED:", e);
        // keep going so DB record still gets deleted
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
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }

    console.timeEnd("delete-total");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE DOCUMENT ERROR:", error);

    if (totalStarted) {
      try {
        console.timeEnd("delete-total");
      } catch {}
    }

    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}