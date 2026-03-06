import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDriveClient } from "@/app/lib/googleDrive";

export const runtime = "nodejs";
const SECRET = process.env.JWT_SECRET!;

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    jwt.verify(token, SECRET);

    const fileId = req.nextUrl.searchParams.get("id");
    if (!fileId) return new NextResponse("Missing id", { status: 400 });

    const drive = getDriveClient();

    const meta = await drive.files.get({
      fileId,
      fields: "name,mimeType",
    });

    const mimeType = meta.data.mimeType || "application/pdf";
    const filename = meta.data.name || "preview.pdf";

    const fileRes = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" } // ✅ IMPORTANT: return bytes, not stream
    );

    const buf = Buffer.from(fileRes.data as any);

    return new NextResponse(buf, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
}