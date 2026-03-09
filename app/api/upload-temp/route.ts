export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/app/lib/db";

const SECRET = process.env.JWT_SECRET!;
const TEMP_BUCKET = "temp-uploads";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function getTokenPayload(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, SECRET) as any;
  } catch {
    return null;
  }
}

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-() ]+/g, "_");
}

export async function POST(req: NextRequest) {
  const payload = getTokenPayload(req);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole(payload?.role);
  if (role !== "admin" && role !== "co_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum allowed file size is 50 MB." },
        { status: 400 }
      );
    }

    const safeFileName = sanitizeFileName(file.name);
    const uniqueId = randomUUID();
    const tempPath = `${payload?.id || "user"}/${uniqueId}-${safeFileName}`;

    console.log("UPLOAD TEMP START:", {
      userId: payload?.id || "user",
      tempPath,
      fileName: file.name,
      safeFileName,
      size: file.size,
      type: file.type || "application/octet-stream",
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!buffer.length) {
      return NextResponse.json(
        { error: "Uploaded file is empty." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.storage
      .from(TEMP_BUCKET)
      .upload(tempPath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (error) {
      console.error("UPLOAD TEMP STORAGE ERROR:", {
        message: error.message,
        name: (error as any)?.name,
        tempPath,
        bucket: TEMP_BUCKET,
      });

      return NextResponse.json(
        {
          error: error.message || "Failed to upload temporary file.",
          details: {
            tempPath,
            bucket: TEMP_BUCKET,
          },
        },
        { status: 500 }
      );
    }

    console.log("UPLOAD TEMP DONE:", {
      tempPath,
      path: data?.path,
      id: data?.id,
      fullPath: data?.fullPath,
    });

    return NextResponse.json({
      ok: true,
      tempPath,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error("UPLOAD TEMP ERROR:", error);

    return NextResponse.json(
      {
        error: error?.message || "Temporary upload failed.",
      },
      { status: 500 }
    );
  }
}