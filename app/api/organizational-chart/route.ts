export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import { supabaseAdmin } from "@/app/lib/db";
import { getCloudinaryConfig, getCloudinaryDestroyUrl, signCloudinaryParams } from "@/app/lib/cloudinary";
import { deleteDriveFileById, getDriveClient } from "@/app/lib/googleDrive";
import {
  buildAttachmentDocumentTitle,
  cleanupTempUpload,
  getOrganizationalChartDocumentCategory,
  getOrganizationalChartSectionLabel,
  getOrganizationalChartSourceModule,
  normalizeAttachmentType,
  uploadOrganizationalChartAttachmentFromTemp,
  type NormalizedAttachmentType,
  type OrgSection,
  type TempAttachmentUpload,
} from "@/app/lib/organizationalChartDocuments";

const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const PDF_MIME_TYPES = new Set(["application/pdf"]);
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MANAGER_ROLES = new Set(["admin", "co_admin"]);
const SECTIONS = new Set(["pasu", "assistant_pasu", "pamo_staff", "former_pasu"]);
const STATUSES = new Set([
  "active",
  "archived",
  "resigned",
  "retired",
  "end_of_contract",
  "transferred",
  "reassigned",
]);
const PAMO_ARCHIVE_STATUSES = new Set([
  "resigned",
  "retired",
  "end_of_contract",
  "transferred",
  "reassigned",
]);
const SOURCE_MODULE = getOrganizationalChartSourceModule();
const DOCUMENT_CATEGORY = getOrganizationalChartDocumentCategory();

type OrgStatus =
  | "active"
  | "archived"
  | "resigned"
  | "retired"
  | "end_of_contract"
  | "transferred"
  | "reassigned";

type OrgRow = {
  id: number;
  section: OrgSection;
  full_name: string;
  position_title: string;
  email: string;
  mobile: string;
  status: OrgStatus;
  notes: string;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  attachment_url: string | null;
  attachment_mime_type: string | null;
  attachment_drive_file_id: string | null;
  attachment_uploaded_at: string | null;
  attachment_type: string | null;
  photo_public_id: string | null;
  photo_url: string | null;
  photo_original_name: string | null;
  photo_width: number | null;
  photo_height: number | null;
  photo_format: string | null;
  photo_uploaded_at: string | null;
  created_at: string;
  updated_at: string;
};

type LinkedDocumentRow = {
  id: number;
  fileId: string | null;
};

type UploadedAttachment = {
  driveFileId: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

const ORG_ENTRY_BASE_SELECT =
  "id,section,full_name,position_title,email,mobile,status,notes,attachment_path,attachment_name,attachment_size,attachment_url,attachment_mime_type,photo_public_id,photo_url,photo_original_name,photo_width,photo_height,photo_format,photo_uploaded_at,created_at,updated_at";
const ORG_ENTRY_EXTENDED_SELECT = `${ORG_ENTRY_BASE_SELECT},attachment_drive_file_id,attachment_uploaded_at,attachment_type`;

function isMissingOptionalColumnError(error: { code?: string | null; message?: string | null } | null | undefined) {
  const code = String(error?.code || "").trim();
  const message = String(error?.message || "").toLowerCase();

  if (code === "PGRST204" || code === "42703") {
    return true;
  }

  return (
    message.includes("attachment_drive_file_id") ||
    message.includes("attachment_uploaded_at") ||
    message.includes("attachment_type") ||
    message.includes("source_module") ||
    message.includes("source_record_type") ||
    message.includes("source_record_id") ||
    message.includes("source_section")
  );
}

function parseDocumentFileIdFromAttachmentUrl(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = raw.startsWith("http") ? new URL(raw) : new URL(raw, "http://local");
    const fileId = String(url.searchParams.get("id") || "").trim();
    return fileId;
  } catch {
    return "";
  }
}

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function canManage(role?: string) {
  return MANAGER_ROLES.has(normalizeRole(role));
}

function normalizeSection(value: string): OrgSection | "" {
  const section = String(value || "").trim().toLowerCase();
  return SECTIONS.has(section) ? (section as OrgSection) : "";
}

function normalizeStatus(section: OrgSection, value: string): OrgStatus {
  const raw = String(value || "").trim().toLowerCase();

  if (section === "pasu" || section === "assistant_pasu") return "active";
  if (section === "former_pasu") return "archived";

  return STATUSES.has(raw) ? (raw as OrgStatus) : "active";
}

function isArchivedPamoStatus(status: OrgStatus) {
  return PAMO_ARCHIVE_STATUSES.has(status);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidMobile(mobile: string) {
  return /^\+?[0-9][0-9\s\-()]{6,19}$/.test(mobile);
}

function validationError(message: string, field?: string) {
  return NextResponse.json({ error: message, field }, { status: 400 });
}

function normalizeAttachmentUpload(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;
  const tempPath = String(value.tempPath || "").trim();
  const originalName = String(value.originalName || "").trim();
  const mimeType = String(value.mimeType || "").trim().toLowerCase();
  const size = Number(value.size || 0);
  const attachmentType = normalizeAttachmentType(value.attachmentType);

  if (!tempPath || !originalName || !mimeType || !Number.isFinite(size) || size <= 0) {
    return null;
  }

  if (!PDF_MIME_TYPES.has(mimeType) && !originalName.toLowerCase().endsWith(".pdf")) {
    return null;
  }

  if (size > MAX_ATTACHMENT_SIZE) {
    return null;
  }

  return {
    tempPath,
    originalName,
    mimeType: "application/pdf",
    size,
    attachmentType,
  } satisfies TempAttachmentUpload;
}

function normalizePhotoPayload(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;
  const publicId = String(value.publicId || "").trim();
  const secureUrl = String(value.secureUrl || "").trim();
  const originalName = String(value.originalName || "").trim();
  const format = String(value.format || "").trim().toLowerCase();
  const mimeType = String(value.mimeType || "").trim().toLowerCase();
  const width = Number(value.width || 0);
  const height = Number(value.height || 0);
  const size = Number(value.size || 0);

  if (!publicId || !secureUrl || !originalName || !format || !mimeType) {
    return null;
  }

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return null;
  }

  if (!Number.isFinite(size) || size <= 0 || size > MAX_PHOTO_SIZE) {
    return null;
  }

  if (!IMAGE_MIME_TYPES.has(mimeType)) {
    return null;
  }

  return {
    publicId,
    secureUrl,
    originalName,
    width,
    height,
    format,
    mimeType,
    size,
  };
}

async function removeCloudinaryAsset(
  publicId: string | null | undefined,
  resourceType: "raw" | "image"
) {
  if (!publicId) return;

  const timestamp = Math.floor(Date.now() / 1000);
  const { apiKey } = getCloudinaryConfig();
  const signature = signCloudinaryParams({
    public_id: publicId,
    timestamp,
  });

  const response = await fetch(getCloudinaryDestroyUrl(resourceType), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      public_id: publicId,
      timestamp,
      api_key: apiKey,
      signature,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(payload?.error?.message || "Failed to delete Cloudinary asset.");
  }
}

async function removeDriveFile(fileId: string | null | undefined) {
  if (!fileId) return;

  const drive = getDriveClient();
  await deleteDriveFileById(drive, fileId);
}

async function listEntries() {
  const { data, error } = await supabaseAdmin
    .from("organizational_chart_entries")
    .select(ORG_ENTRY_EXTENDED_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    if (!isMissingOptionalColumnError(error)) {
      throw new Error(error.message || "Failed to load organizational chart entries.");
    }

    const { data: fallbackData, error: fallbackError } = await supabaseAdmin
      .from("organizational_chart_entries")
      .select(ORG_ENTRY_BASE_SELECT)
      .order("created_at", { ascending: false });

    if (fallbackError) {
      throw new Error(fallbackError.message || "Failed to load organizational chart entries.");
    }

    return ((fallbackData || []) as Array<Record<string, unknown>>).map((row) => ({
      ...row,
      attachment_drive_file_id: null,
      attachment_uploaded_at: null,
      attachment_type: null,
    })) as OrgRow[];
  }

  return (data || []) as OrgRow[];
}

async function getLinkedDocument(entryId: number, fallbackFileId?: string | null) {
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("id,fileId")
    .eq("source_module", SOURCE_MODULE)
    .eq("source_record_id", entryId)
    .maybeSingle();

  if (error) {
    if (!isMissingOptionalColumnError(error)) {
      throw new Error(error.message || "Failed to load linked organizational attachment.");
    }

    const fileId = String(fallbackFileId || "").trim();
    if (!fileId) return null;

    const { data: fallbackData, error: fallbackError } = await supabaseAdmin
      .from("documents")
      .select("id,fileId")
      .eq("fileId", fileId)
      .maybeSingle();

    if (fallbackError) {
      throw new Error(fallbackError.message || "Failed to load linked organizational attachment.");
    }

    return (fallbackData || null) as LinkedDocumentRow | null;
  }

  return (data || null) as LinkedDocumentRow | null;
}

async function upsertLinkedDocument(args: {
  entryId: number;
  section: OrgSection;
  fullName: string;
  positionTitle: string;
  attachmentType: NormalizedAttachmentType;
  attachment: UploadedAttachment;
  previousFileId?: string | null;
}) {
  const existingDocument = await getLinkedDocument(args.entryId, args.previousFileId);
  const folder = `Personnel - ${getOrganizationalChartSectionLabel(args.section)}`;
  const title = buildAttachmentDocumentTitle({
    fullName: args.fullName,
    positionTitle: args.positionTitle,
    attachmentType: args.attachmentType,
  });
  const payload = {
    fileId: args.attachment.driveFileId,
    name: args.attachment.name,
    type: args.attachment.mimeType,
    category: DOCUMENT_CATEGORY,
    folder,
    title,
    dateReceived: args.attachment.uploadedAt.slice(0, 10),
    year: args.attachment.uploadedAt.slice(0, 4),
    uploadedAt: args.attachment.uploadedAt,
  };

  const extendedPayload = {
    ...payload,
    source_module: SOURCE_MODULE,
    source_record_type: "organizational_chart_entry",
    source_record_id: args.entryId,
    source_section: args.section,
  };

  if (existingDocument) {
    const { error } = await supabaseAdmin.from("documents").update(extendedPayload).eq("id", existingDocument.id);

    if (error) {
      if (!isMissingOptionalColumnError(error)) {
        throw new Error(error.message || "Failed to update linked dashboard document.");
      }

      const { error: fallbackError } = await supabaseAdmin.from("documents").update(payload).eq("id", existingDocument.id);

      if (fallbackError) {
        throw new Error(fallbackError.message || "Failed to update linked dashboard document.");
      }
    }

    return;
  }

  const { error } = await supabaseAdmin.from("documents").insert([extendedPayload]);

  if (error) {
    if (!isMissingOptionalColumnError(error)) {
      throw new Error(error.message || "Failed to create linked dashboard document.");
    }

    const { error: fallbackError } = await supabaseAdmin.from("documents").insert([payload]);

    if (fallbackError) {
      throw new Error(fallbackError.message || "Failed to create linked dashboard document.");
    }
  }
}

async function deleteLinkedDocument(entryId: number, fallbackFileId?: string | null) {
  const existingDocument = await getLinkedDocument(entryId, fallbackFileId);
  if (!existingDocument) return;

  const { error } = await supabaseAdmin.from("documents").delete().eq("id", existingDocument.id);

  if (error) {
    throw new Error(error.message || "Failed to delete linked dashboard document.");
  }
}

function getAttachmentColumns(
  attachment: UploadedAttachment | null,
  attachmentType: NormalizedAttachmentType | null
) {
  if (!attachment) {
    return {
      attachment_path: null,
      attachment_name: null,
      attachment_size: null,
      attachment_url: null,
      attachment_mime_type: null,
      attachment_drive_file_id: null,
      attachment_uploaded_at: null,
      attachment_type: null,
    };
  }

  return {
    attachment_path: null,
    attachment_name: attachment.name,
    attachment_size: attachment.size,
    attachment_url: `/api/documents/preview?id=${attachment.driveFileId}`,
    attachment_mime_type: attachment.mimeType,
    attachment_drive_file_id: attachment.driveFileId,
    attachment_uploaded_at: attachment.uploadedAt,
    attachment_type: attachmentType || "Supporting Document",
  };
}

function getLegacyAttachmentColumns(attachment: UploadedAttachment | null) {
  if (!attachment) {
    return {
      attachment_path: null,
      attachment_name: null,
      attachment_size: null,
      attachment_url: null,
      attachment_mime_type: null,
    };
  }

  return {
    attachment_path: null,
    attachment_name: attachment.name,
    attachment_size: attachment.size,
    attachment_url: `/api/documents/preview?id=${attachment.driveFileId}`,
    attachment_mime_type: attachment.mimeType,
  };
}

function validatePayload(body: unknown) {
  const value = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const section = normalizeSection(String(value.section || ""));
  if (!section) {
    return { ok: false as const, response: validationError("Invalid section.", "section") };
  }

  const fullName = String(value.full_name || "").trim();
  const positionTitle = String(value.position_title || "").trim();
  const email = String(value.email || "").trim().toLowerCase();
  const mobile = String(value.mobile || "").trim();
  const notes = String(value.notes || "").trim();
  const status = normalizeStatus(section, String(value.status || ""));
  const removeAttachment = Boolean(value.removeAttachment);
  const removePhoto = Boolean(value.removePhoto);
  const attachmentUpload = normalizeAttachmentUpload(value.attachmentUpload);
  const photo = normalizePhotoPayload(value.photo);
  const attachmentType = attachmentUpload
    ? attachmentUpload.attachmentType
    : normalizeAttachmentType(value.attachmentType);

  if (!fullName) {
    return { ok: false as const, response: validationError("Full name is required.", "full_name") };
  }
  if (!positionTitle) {
    return { ok: false as const, response: validationError("Position title is required.", "position_title") };
  }
  if (!email) {
    return { ok: false as const, response: validationError("Email is required.", "email") };
  }
  if (!isValidEmail(email)) {
    return { ok: false as const, response: validationError("Enter a valid email address.", "email") };
  }
  if (!mobile) {
    return { ok: false as const, response: validationError("Mobile number is required.", "mobile") };
  }
  if (!isValidMobile(mobile)) {
    return { ok: false as const, response: validationError("Enter a valid mobile number.", "mobile") };
  }
  if (value.attachmentUpload && !attachmentUpload) {
    return { ok: false as const, response: validationError("Attachment metadata is invalid.", "attachment") };
  }
  if (value.photo && !photo) {
    return { ok: false as const, response: validationError("Photo metadata is invalid.", "photo") };
  }

  return {
    ok: true as const,
    payload: {
      section,
      full_name: fullName,
      position_title: positionTitle,
      email,
      mobile,
      notes,
      status,
      attachmentUpload,
      attachmentType,
      photo,
      removeAttachment,
      removePhoto,
    },
  };
}

export async function GET() {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await listEntries());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load organizational chart entries." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManage(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let uploadedPhotoPublicId: string | null = null;
  let uploadedAttachment: UploadedAttachment | null = null;
  let stagedTempPath = "";
  let insertedEntryId: number | null = null;

  try {
    const body = await req.json();
    const validated = validatePayload(body);
    if (!validated.ok) return validated.response;

    const { payload } = validated;
    stagedTempPath = payload.attachmentUpload?.tempPath || "";

    if (payload.attachmentUpload) {
      uploadedAttachment = await uploadOrganizationalChartAttachmentFromTemp(
        payload.section,
        payload.attachmentUpload
      );
    }

    const photoColumns = payload.photo
      ? {
          photo_public_id: payload.photo.publicId,
          photo_url: payload.photo.secureUrl,
          photo_original_name: payload.photo.originalName,
          photo_width: payload.photo.width,
          photo_height: payload.photo.height,
          photo_format: payload.photo.format,
          photo_uploaded_at: new Date().toISOString(),
        }
      : {
          photo_public_id: null,
          photo_url: null,
          photo_original_name: null,
          photo_width: null,
          photo_height: null,
          photo_format: null,
          photo_uploaded_at: null,
        };

    uploadedPhotoPublicId = photoColumns.photo_public_id;

    const insertPayload = {
      section: payload.section,
      full_name: payload.full_name,
      position_title: payload.position_title,
      email: payload.email,
      mobile: payload.mobile,
      status:
        payload.section === "pamo_staff" && isArchivedPamoStatus(payload.status)
          ? payload.status
          : payload.section === "former_pasu"
            ? "archived"
            : "active",
      notes: payload.notes,
      ...getAttachmentColumns(uploadedAttachment, payload.attachmentType),
      ...photoColumns,
    };

    let insertResult = await supabaseAdmin
      .from("organizational_chart_entries")
      .insert([insertPayload])
      .select("id")
      .single();

    if (insertResult.error && isMissingOptionalColumnError(insertResult.error)) {
      insertResult = await supabaseAdmin
        .from("organizational_chart_entries")
        .insert([
          {
            section: payload.section,
            full_name: payload.full_name,
            position_title: payload.position_title,
            email: payload.email,
            mobile: payload.mobile,
            status:
              payload.section === "pamo_staff" && isArchivedPamoStatus(payload.status)
                ? payload.status
                : payload.section === "former_pasu"
                  ? "archived"
                  : "active",
            notes: payload.notes,
            ...getLegacyAttachmentColumns(uploadedAttachment),
            ...photoColumns,
          },
        ])
        .select("id")
        .single();
    }

    if (insertResult.error || !insertResult.data) {
      throw new Error(insertResult.error?.message || "Failed to create organizational chart entry.");
    }

    insertedEntryId = Number(insertResult.data.id);

    if (uploadedAttachment) {
      await upsertLinkedDocument({
        entryId: insertedEntryId,
        section: payload.section,
        fullName: payload.full_name,
        positionTitle: payload.position_title,
        attachmentType: payload.attachmentType,
        attachment: uploadedAttachment,
        previousFileId: null,
      });
    }

    return NextResponse.json(await listEntries(), { status: 201 });
  } catch (error) {
    if (insertedEntryId) {
      await supabaseAdmin.from("organizational_chart_entries").delete().eq("id", insertedEntryId);
      await deleteLinkedDocument(insertedEntryId, uploadedAttachment?.driveFileId || null).catch(() => undefined);
    }

    if (uploadedAttachment?.driveFileId) {
      await removeDriveFile(uploadedAttachment.driveFileId).catch(() => undefined);
    }

    if (uploadedPhotoPublicId) {
      await removeCloudinaryAsset(uploadedPhotoPublicId, "image").catch(() => undefined);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create organizational chart entry." },
      { status: 500 }
    );
  } finally {
    if (stagedTempPath) {
      await cleanupTempUpload(stagedTempPath).catch(() => undefined);
    }
  }
}

export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManage(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let uploadedPhotoPublicId: string | null = null;
  let uploadedAttachment: UploadedAttachment | null = null;
  let stagedTempPath = "";

  try {
    const body = await req.json();
    const id = Number((body as Record<string, unknown>)?.id);

    if (!Number.isFinite(id) || id <= 0) {
      return validationError("Invalid entry id.", "id");
    }

    const validated = validatePayload(body);
    if (!validated.ok) return validated.response;
    const { payload } = validated;
    stagedTempPath = payload.attachmentUpload?.tempPath || "";

    let existingResult = await supabaseAdmin
      .from("organizational_chart_entries")
      .select(ORG_ENTRY_EXTENDED_SELECT.replace(",created_at,updated_at", ""))
      .eq("id", id)
      .single();

    if (existingResult.error && isMissingOptionalColumnError(existingResult.error)) {
      existingResult = await supabaseAdmin
        .from("organizational_chart_entries")
        .select(ORG_ENTRY_BASE_SELECT.replace(",created_at,updated_at", ""))
        .eq("id", id)
        .single();
    }

    if (existingResult.error || !existingResult.data) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    const existingData = existingResult.data as unknown as Record<string, unknown>;
    const previous = {
      ...existingData,
      attachment_drive_file_id: existingData.attachment_drive_file_id ?? null,
      attachment_uploaded_at: existingData.attachment_uploaded_at ?? null,
      attachment_type: existingData.attachment_type ?? null,
    } as OrgRow;

    if (payload.attachmentUpload) {
      uploadedAttachment = await uploadOrganizationalChartAttachmentFromTemp(
        payload.section,
        payload.attachmentUpload
      );
    }

    const attachmentColumns = uploadedAttachment
      ? getAttachmentColumns(uploadedAttachment, payload.attachmentType)
      : payload.removeAttachment
        ? getAttachmentColumns(null, null)
        : {
            attachment_path: previous.attachment_path,
            attachment_name: previous.attachment_name,
            attachment_size: previous.attachment_size,
            attachment_url: previous.attachment_url,
            attachment_mime_type: previous.attachment_mime_type,
            attachment_drive_file_id: previous.attachment_drive_file_id,
            attachment_uploaded_at: previous.attachment_uploaded_at,
            attachment_type: previous.attachment_type,
          };

    const photoColumns = payload.photo
      ? {
          photo_public_id: payload.photo.publicId,
          photo_url: payload.photo.secureUrl,
          photo_original_name: payload.photo.originalName,
          photo_width: payload.photo.width,
          photo_height: payload.photo.height,
          photo_format: payload.photo.format,
          photo_uploaded_at: new Date().toISOString(),
        }
      : payload.removePhoto
        ? {
            photo_public_id: null,
            photo_url: null,
            photo_original_name: null,
            photo_width: null,
            photo_height: null,
            photo_format: null,
            photo_uploaded_at: null,
          }
        : {
            photo_public_id: previous.photo_public_id,
            photo_url: previous.photo_url,
            photo_original_name: previous.photo_original_name,
            photo_width: previous.photo_width,
            photo_height: previous.photo_height,
            photo_format: previous.photo_format,
            photo_uploaded_at: previous.photo_uploaded_at,
          };

    uploadedPhotoPublicId = payload.photo?.publicId || null;

    const nextStatus =
      payload.section === "pamo_staff"
        ? payload.status
        : payload.section === "former_pasu"
          ? "archived"
          : "active";

    const updatePayload = {
      section: payload.section,
      full_name: payload.full_name,
      position_title: payload.position_title,
      email: payload.email,
      mobile: payload.mobile,
      status: nextStatus,
      notes: payload.notes,
      ...attachmentColumns,
      ...photoColumns,
    };

    let updateResult = await supabaseAdmin.from("organizational_chart_entries").update(updatePayload).eq("id", id);

    if (updateResult.error && isMissingOptionalColumnError(updateResult.error)) {
      updateResult = await supabaseAdmin
        .from("organizational_chart_entries")
        .update({
          section: payload.section,
          full_name: payload.full_name,
          position_title: payload.position_title,
          email: payload.email,
          mobile: payload.mobile,
          status: nextStatus,
          notes: payload.notes,
          ...getLegacyAttachmentColumns(uploadedAttachment),
          ...(uploadedAttachment
            ? {}
            : payload.removeAttachment
              ? getLegacyAttachmentColumns(null)
              : {
                  attachment_path: previous.attachment_path,
                  attachment_name: previous.attachment_name,
                  attachment_size: previous.attachment_size,
                  attachment_url: previous.attachment_url,
                  attachment_mime_type: previous.attachment_mime_type,
                }),
          ...photoColumns,
        })
        .eq("id", id);
    }

    if (updateResult.error) {
      throw new Error(updateResult.error.message || "Failed to update organizational chart entry.");
    }

    try {
      const effectiveAttachment =
        attachmentColumns.attachment_drive_file_id &&
        attachmentColumns.attachment_name &&
        attachmentColumns.attachment_mime_type &&
        attachmentColumns.attachment_size &&
        attachmentColumns.attachment_uploaded_at
          ? {
              driveFileId: attachmentColumns.attachment_drive_file_id,
              name: attachmentColumns.attachment_name,
              mimeType: attachmentColumns.attachment_mime_type,
              size: attachmentColumns.attachment_size,
              uploadedAt: attachmentColumns.attachment_uploaded_at,
            }
          : null;

      if (effectiveAttachment) {
        await upsertLinkedDocument({
          entryId: id,
          section: payload.section,
          fullName: payload.full_name,
          positionTitle: payload.position_title,
          attachmentType: normalizeAttachmentType(attachmentColumns.attachment_type),
          attachment: effectiveAttachment,
          previousFileId:
            previous.attachment_drive_file_id || parseDocumentFileIdFromAttachmentUrl(previous.attachment_url),
        });
      } else {
        await deleteLinkedDocument(
          id,
          previous.attachment_drive_file_id || parseDocumentFileIdFromAttachmentUrl(previous.attachment_url)
        );
      }
    } catch (syncError) {
      const rollbackResult = await supabaseAdmin
        .from("organizational_chart_entries")
        .update({
          section: previous.section,
          full_name: previous.full_name,
          position_title: previous.position_title,
          email: previous.email,
          mobile: previous.mobile,
          status: previous.status,
          notes: previous.notes,
          attachment_path: previous.attachment_path,
          attachment_name: previous.attachment_name,
          attachment_size: previous.attachment_size,
          attachment_url: previous.attachment_url,
          attachment_mime_type: previous.attachment_mime_type,
          attachment_drive_file_id: previous.attachment_drive_file_id,
          attachment_uploaded_at: previous.attachment_uploaded_at,
          attachment_type: previous.attachment_type,
          photo_public_id: previous.photo_public_id,
          photo_url: previous.photo_url,
          photo_original_name: previous.photo_original_name,
          photo_width: previous.photo_width,
          photo_height: previous.photo_height,
          photo_format: previous.photo_format,
          photo_uploaded_at: previous.photo_uploaded_at,
        })
        .eq("id", id);

      if (rollbackResult.error && isMissingOptionalColumnError(rollbackResult.error)) {
        await supabaseAdmin
          .from("organizational_chart_entries")
          .update({
            section: previous.section,
            full_name: previous.full_name,
            position_title: previous.position_title,
            email: previous.email,
            mobile: previous.mobile,
            status: previous.status,
            notes: previous.notes,
            attachment_path: previous.attachment_path,
            attachment_name: previous.attachment_name,
            attachment_size: previous.attachment_size,
            attachment_url: previous.attachment_url,
            attachment_mime_type: previous.attachment_mime_type,
            photo_public_id: previous.photo_public_id,
            photo_url: previous.photo_url,
            photo_original_name: previous.photo_original_name,
            photo_width: previous.photo_width,
            photo_height: previous.photo_height,
            photo_format: previous.photo_format,
            photo_uploaded_at: previous.photo_uploaded_at,
          })
          .eq("id", id);
      }

      if (uploadedAttachment?.driveFileId) {
        await removeDriveFile(uploadedAttachment.driveFileId).catch(() => undefined);
      }
      if (uploadedPhotoPublicId) {
        await removeCloudinaryAsset(uploadedPhotoPublicId, "image").catch(() => undefined);
      }

      throw syncError;
    }

    const shouldClearLegacyAttachment = Boolean(payload.attachmentUpload || payload.removeAttachment);

    const previousAttachmentFileId =
      previous.attachment_drive_file_id || parseDocumentFileIdFromAttachmentUrl(previous.attachment_url);

    if (shouldClearLegacyAttachment && previousAttachmentFileId) {
      await removeDriveFile(previousAttachmentFileId).catch(() => undefined);
    }

    if (shouldClearLegacyAttachment && !previousAttachmentFileId && previous.attachment_path) {
      await removeCloudinaryAsset(previous.attachment_path, "raw").catch(() => undefined);
    }

    if ((payload.photo || payload.removePhoto) && previous.photo_public_id) {
      await removeCloudinaryAsset(previous.photo_public_id, "image").catch(() => undefined);
    }

    return NextResponse.json(await listEntries());
  } catch (error) {
    if (uploadedAttachment?.driveFileId) {
      await removeDriveFile(uploadedAttachment.driveFileId).catch(() => undefined);
    }
    if (uploadedPhotoPublicId) {
      await removeCloudinaryAsset(uploadedPhotoPublicId, "image").catch(() => undefined);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update organizational chart entry." },
      { status: 500 }
    );
  } finally {
    if (stagedTempPath) {
      await cleanupTempUpload(stagedTempPath).catch(() => undefined);
    }
  }
}

export async function DELETE(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManage(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));

    if (!Number.isFinite(id) || id <= 0) {
      return validationError("Invalid entry id.", "id");
    }

    let existingResult = await supabaseAdmin
      .from("organizational_chart_entries")
      .select("id,attachment_path,attachment_drive_file_id,photo_public_id")
      .eq("id", id)
      .single();

    if (existingResult.error && isMissingOptionalColumnError(existingResult.error)) {
      existingResult = await supabaseAdmin
        .from("organizational_chart_entries")
        .select("id,attachment_path,attachment_url,photo_public_id")
        .eq("id", id)
        .single();
    }

    if (existingResult.error || !existingResult.data) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    const existing = {
      ...(existingResult.data as Record<string, unknown>),
      attachment_drive_file_id: (existingResult.data as Record<string, unknown>).attachment_drive_file_id ?? null,
      attachment_url: (existingResult.data as Record<string, unknown>).attachment_url ?? null,
    } as {
      id: number;
      attachment_path: string | null;
      attachment_drive_file_id: string | null;
      attachment_url: string | null;
      photo_public_id: string | null;
    };

    const { error } = await supabaseAdmin.from("organizational_chart_entries").delete().eq("id", id);
    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to delete organizational chart entry." },
        { status: 500 }
      );
    }

    await deleteLinkedDocument(
      id,
      existing.attachment_drive_file_id || parseDocumentFileIdFromAttachmentUrl(existing.attachment_url)
    ).catch(() => undefined);

    const existingAttachmentFileId =
      existing.attachment_drive_file_id || parseDocumentFileIdFromAttachmentUrl(existing.attachment_url);

    if (existingAttachmentFileId) {
      await removeDriveFile(existingAttachmentFileId).catch(() => undefined);
    } else if (existing.attachment_path) {
      await removeCloudinaryAsset(existing.attachment_path, "raw").catch(() => undefined);
    }

    if (existing.photo_public_id) {
      await removeCloudinaryAsset(existing.photo_public_id, "image").catch(() => undefined);
    }

    return NextResponse.json(await listEntries());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete organizational chart entry." },
      { status: 500 }
    );
  }
}
