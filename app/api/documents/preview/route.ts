export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { getDriveClient } from "@/app/lib/googleDrive";
import { getCurrentUser } from "@/app/lib/auth";
import { supabaseAdmin } from "@/app/lib/db";

function safeFilename(name: string) {
  return name.replace(/[/\\?%*:|"<>]/g, "_");
}

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();

  if (!me) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const fileId = String(req.nextUrl.searchParams.get("id") || "").trim();

    if (!fileId) {
      return new NextResponse("Missing id", { status: 400 });
    }

    const { data: doc, error: docError } = await supabaseAdmin
      .from("documents")
      .select("id,fileId,name,type")
      .eq("fileId", fileId)
      .maybeSingle();

    if (docError) {
      console.error("PREVIEW DOC LOOKUP ERROR:", docError);
      return new NextResponse("Failed to load document", { status: 500 });
    }

    if (!doc) {
      return new NextResponse("Document not found", { status: 404 });
    }

    const drive = getDriveClient();

    const meta = await drive.files.get({
      fileId: doc.fileId,
      fields: "name,mimeType",
      supportsAllDrives: true,
    });

    const mimeType = meta.data.mimeType || doc.type || "application/pdf";
    const filename = safeFilename(meta.data.name || doc.name || "preview");

    const fileRes = await drive.files.get(
      {
        fileId: doc.fileId,
        alt: "media",
        supportsAllDrives: true,
      },
      { responseType: "stream" }
    );
    const body = Readable.toWeb(fileRes.data as Readable) as ReadableStream<Uint8Array>;

    return new NextResponse(body, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("PREVIEW ROUTE ERROR:", error);
    return new NextResponse("Failed to preview document", { status: 500 });
  }
}
