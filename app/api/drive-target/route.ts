export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import {
  getDriveClient,
  normalizeDriveCategory,
  normalizeFolderName,
  findOrCreateFolder,
} from "@/app/lib/googleDrive";
import { getCurrentUser } from "@/app/lib/auth";
import { serverEnv } from "@/app/lib/serverEnv";

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function getCategoryFolderId(category: string) {
  if (category === "Academe") return serverEnv.driveAcademeFolderId;
  if (category === "Stakeholders") return serverEnv.driveStakeholdersFolderId;
  if (category === "PAMO Activity") return serverEnv.drivePamoFolderId;
  return serverEnv.driveRootFolderId;
}

function isSupportedCategory(category: string) {
  return (
    category === "Academe" ||
    category === "Stakeholders" ||
    category === "PAMO Activity"
  );
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
    const body = await req.json();

    const rawCategory = String(body?.category || "");
    let folder = normalizeFolderName(String(body?.folder || ""));

    const category = normalizeDriveCategory(rawCategory);

    if (!isSupportedCategory(category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    if (category === "Stakeholders" && folder) {
      folder = folder.toUpperCase();
    }

    const categoryFolderId = getCategoryFolderId(category);

    if (!categoryFolderId) {
      return NextResponse.json(
        { error: "Drive folder ID is not configured for this category." },
        { status: 500 }
      );
    }

    const drive = getDriveClient();

    let targetFolderId = categoryFolderId;
    if (folder) {
      targetFolderId = await findOrCreateFolder(drive, folder, categoryFolderId);
    }

    return NextResponse.json({
      ok: true,
      category,
      folder,
      parentId: targetFolderId,
    });
  } catch (error: unknown) {
    console.error("DRIVE TARGET ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to resolve Drive folder.") },
      { status: 500 }
    );
  }
}
