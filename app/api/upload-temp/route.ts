export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/auth";
import { serverEnv } from "@/app/lib/serverEnv";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-() ]+/g, "_");
}

function getErrorName(error: unknown) {
  return error instanceof Error ? error.name : undefined;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole(me.role);
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

    const safeFileName = sanitizeFileName(file.name || "upload");
    const uniqueId = randomUUID();
    const tempPath = `${me.id}/${uniqueId}-${safeFileName}`;

    console.log("UPLOAD TEMP START:", {
      userId: me.id,
      tempPath,
      fileName: file.name,
      safeFileName,
      size: file.size,
      type: file.type || "application/octet-stream",
    });

    if (!file.size) {
      return NextResponse.json(
        { error: "Uploaded file is empty." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.storage
      .from(serverEnv.tempUploadsBucket)
      .upload(tempPath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (error) {
      console.error("UPLOAD TEMP STORAGE ERROR:", {
        message: error.message,
        name: getErrorName(error),
        tempPath,
        bucket: serverEnv.tempUploadsBucket,
      });

      return NextResponse.json(
        {
          error: error.message || "Failed to upload temporary file.",
          details: {
            tempPath,
            bucket: serverEnv.tempUploadsBucket,
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
  } catch (error: unknown) {
    console.error("UPLOAD TEMP ERROR:", error);

    return NextResponse.json(
      {
        error: getErrorMessage(error, "Temporary upload failed."),
      },
      { status: 500 }
    );
  }
}
