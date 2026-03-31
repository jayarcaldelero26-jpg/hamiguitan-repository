export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import { assertTrustedOrigin, isInvalidOriginError } from "@/app/lib/requestSecurity";
import { uploadDriveResumableChunk } from "@/app/lib/googleDrive";

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function requiredHeader(req: NextRequest, name: string) {
  return (req.headers.get(name) || "").trim();
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);

    const me = await getCurrentUser();
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = normalizeRole(me.role);
    if (role !== "admin" && role !== "co_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sessionUri = requiredHeader(req, "x-upload-session-uri");
    const contentRange = requiredHeader(req, "x-upload-content-range");
    const contentType =
      requiredHeader(req, "x-upload-content-type") || "application/octet-stream";

    if (!sessionUri) {
      return NextResponse.json(
        { error: "Missing resumable upload session URL." },
        { status: 400 }
      );
    }

    if (!contentRange) {
      return NextResponse.json(
        { error: "Missing resumable upload content range." },
        { status: 400 }
      );
    }

    const chunk = await req.arrayBuffer();
    if (chunk.byteLength === 0) {
      return NextResponse.json(
        { error: "Missing resumable upload chunk body." },
        { status: 400 }
      );
    }

    const result = await uploadDriveResumableChunk({
      sessionUri,
      chunk,
      contentType,
      contentRange,
    });

    if (!result.complete) {
      return NextResponse.json({
        ok: true,
        complete: false,
        range: result.range,
      });
    }

    return NextResponse.json({
      ok: true,
      complete: true,
      file: result.payload ?? null,
    });
  } catch (error: unknown) {
    if (isInvalidOriginError(error)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    console.error("RESUMABLE UPLOAD CHUNK ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to upload resumable chunk.") },
      { status: 500 }
    );
  }
}
