export const runtime = "nodejs";

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import {
  getCloudinaryConfig,
  getOrganizationalChartCloudinaryFolder,
  signCloudinaryParams,
} from "@/app/lib/cloudinary";

const MANAGER_ROLES = new Set(["admin", "co_admin"]);
const SECTIONS = new Set(["pasu", "assistant_pasu", "pamo_staff", "former_pasu"]);
const ASSET_KINDS = new Set(["photo"]);

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function canManage(role?: string) {
  return MANAGER_ROLES.has(normalizeRole(role));
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManage(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const section = String(body?.section || "").trim().toLowerCase();
    const assetKind = String(body?.assetKind || "photo").trim().toLowerCase();

    if (!SECTIONS.has(section)) {
      return NextResponse.json({ error: "Invalid section." }, { status: 400 });
    }
    if (!ASSET_KINDS.has(assetKind)) {
      return NextResponse.json({ error: "Invalid asset kind." }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = getOrganizationalChartCloudinaryFolder(section, "photos");
    const publicId = `${section}/${assetKind}/${me.id}/${randomUUID()}`;
    const { cloudName, apiKey } = getCloudinaryConfig();
    const signature = signCloudinaryParams({
      folder,
      public_id: publicId,
      timestamp,
    });

    return NextResponse.json({
      cloudName,
      apiKey,
      folder,
      publicId,
      resourceType: "image",
      timestamp,
      signature,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create Cloudinary upload signature." },
      { status: 500 }
    );
  }
}
