export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { getDriveClient } from "@/app/lib/googleDrive";
import { getPublicDocumentById } from "@/app/lib/publicDocuments";

function safeFilename(name: string) {
  return name.replace(/[/\\?%*:|"<>]/g, "_");
}

export async function GET(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    const raw = req.nextUrl.searchParams.get("raw") === "1";

    if (!Number.isFinite(id) || id <= 0) {
      return new NextResponse("Invalid id", { status: 400 });
    }

    const doc = await getPublicDocumentById(id);
    if (!doc || !doc.fileId) {
      return new NextResponse("Document not found", { status: 404 });
    }

    if (!raw) {
      const previewUrl = new URL(`/api/public-documents/view?id=${id}&raw=1`, req.nextUrl.origin);
      const safeTitle = (doc.title || doc.name || "Document Preview")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

      return new NextResponse(
        `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${safeTitle}</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        background: linear-gradient(180deg, #081019 0%, #0b1320 100%);
        color: #f5f7fa;
        font-family: Arial, sans-serif;
      }
      .wrap {
        min-height: 100vh;
        padding: 24px;
      }
      .shell {
        max-width: 1200px;
        margin: 0 auto;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 24px;
        overflow: hidden;
        background: rgba(10, 16, 24, 0.88);
        box-shadow: 0 18px 48px rgba(0,0,0,0.28);
      }
      .bar {
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.04);
      }
      .meta {
        min-width: 0;
      }
      .eyebrow {
        font-size: 11px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.62);
      }
      .title {
        margin-top: 6px;
        font-size: 18px;
        font-weight: 700;
        line-height: 1.35;
      }
      .hint {
        margin-top: 4px;
        font-size: 13px;
        color: rgba(255,255,255,0.7);
      }
      .frame {
        width: 100%;
        height: calc(100vh - 142px);
        min-height: 620px;
        border: 0;
        background: #0b1320;
      }
      @media (max-width: 768px) {
        .wrap { padding: 12px; }
        .bar { padding: 14px 16px; }
        .title { font-size: 16px; }
        .frame { height: calc(100vh - 128px); min-height: 520px; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="shell">
        <div class="bar">
          <div class="meta">
            <div class="eyebrow">${doc.kind}</div>
            <div class="title">${safeTitle}</div>
            <div class="hint">Public preview</div>
          </div>
        </div>
        <iframe class="frame" src="${previewUrl.toString()}" title="${safeTitle}"></iframe>
      </div>
    </div>
  </body>
</html>`,
        {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        }
      );
    }

    const drive = getDriveClient();
    const meta = await drive.files.get({
      fileId: doc.fileId,
      fields: "name,mimeType",
      supportsAllDrives: true,
    });

    const mimeType = meta.data.mimeType || doc.type || "application/pdf";
    const filename = safeFilename(meta.data.name || doc.name || doc.title || "document");

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
    console.error("PUBLIC DOCUMENT VIEW ERROR:", error);
    return new NextResponse("Failed to load document", { status: 500 });
  }
}
