// app/api/documents/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDriveClient } from "@/app/lib/googleDrive";

export const runtime = "nodejs";
const SECRET = process.env.JWT_SECRET!;

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    jwt.verify(token, SECRET);

    const fileId = req.nextUrl.searchParams.get("id");
    if (!fileId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const drive = getDriveClient();

    const meta = await drive.files.get({
      fileId,
      fields: "name,mimeType",
    });

    const filename = meta.data.name || "download";
    const mimeType = meta.data.mimeType || "application/octet-stream";

    const fileRes = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    return new NextResponse(fileRes.data as any, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}