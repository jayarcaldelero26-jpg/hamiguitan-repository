import "server-only";

import { Readable } from "stream";
import type { ReadableStream as NodeReadableStream } from "stream/web";
import { supabaseAdmin } from "@/app/lib/db";
import { serverEnv } from "@/app/lib/serverEnv";
import { findOrCreateFolder, getDriveClient } from "@/app/lib/googleDrive";

export type OrgSection = "pasu" | "assistant_pasu" | "pamo_staff" | "former_pasu";

export type NormalizedAttachmentType = "SO" | "Memo" | "Supporting Document";

export type TempAttachmentUpload = {
  tempPath: string;
  originalName: string;
  mimeType: string;
  size: number;
  attachmentType: NormalizedAttachmentType;
};

export type UploadedOrgAttachment = {
  driveFileId: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

const ORG_CHART_SOURCE_MODULE = "organizational_chart";
const ORG_CHART_DOCUMENT_CATEGORY = "PAMO Activity";

function getPersonnelDriveRootFolderId() {
  return process.env.DRIVE_PERSONNEL_FOLDER_ID?.trim() || serverEnv.drivePamoFolderId;
}

export function getOrganizationalChartSourceModule() {
  return ORG_CHART_SOURCE_MODULE;
}

export function getOrganizationalChartDocumentCategory() {
  return ORG_CHART_DOCUMENT_CATEGORY;
}

export function getOrganizationalChartSectionLabel(section: OrgSection) {
  if (section === "pasu") return "Current PASU";
  if (section === "assistant_pasu") return "Assistant Superintendent";
  if (section === "former_pasu") return "Archives";
  return "Active PAMO Staff";
}

export function normalizeAttachmentType(input: unknown): NormalizedAttachmentType {
  const value = String(input || "")
    .trim()
    .toLowerCase();

  if (value === "so") return "SO";
  if (value === "memo") return "Memo";
  return "Supporting Document";
}

export function buildAttachmentDocumentTitle(input: {
  fullName: string;
  positionTitle: string;
  attachmentType: NormalizedAttachmentType;
}) {
  const fullName = input.fullName.trim();
  const positionTitle = input.positionTitle.trim();
  const roleLabel = positionTitle || "Personnel Record";

  if (!fullName) {
    return `${input.attachmentType} - ${roleLabel}`;
  }

  return `${input.attachmentType} - ${fullName} (${roleLabel})`;
}

export async function cleanupTempUpload(tempPath: string) {
  if (!tempPath) return;

  await supabaseAdmin.storage.from(serverEnv.tempUploadsBucket).remove([tempPath]);
}

export async function uploadOrganizationalChartAttachmentFromTemp(
  section: OrgSection,
  upload: TempAttachmentUpload
): Promise<UploadedOrgAttachment> {
  const { data: fileData, error: downloadError } = await supabaseAdmin.storage
    .from(serverEnv.tempUploadsBucket)
    .download(upload.tempPath);

  if (downloadError || !fileData) {
    throw new Error(downloadError?.message || "Failed to download staged attachment.");
  }

  const drive = getDriveClient();
  const rootFolderId = getPersonnelDriveRootFolderId();
  const sectionFolderId = await findOrCreateFolder(
    drive,
    getOrganizationalChartSectionLabel(section),
    rootFolderId
  );
  const attachmentsFolderId = await findOrCreateFolder(drive, "Attachments", sectionFolderId);

  const uploaded = await drive.files.create({
    requestBody: {
      name: upload.originalName,
      parents: [attachmentsFolderId],
    },
    media: {
      mimeType: upload.mimeType,
      body: Readable.fromWeb(fileData.stream() as unknown as NodeReadableStream),
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const driveFileId = uploaded.data.id;

  if (!driveFileId) {
    throw new Error("Google Drive did not return a file ID for the attachment.");
  }

  return {
    driveFileId,
    name: upload.originalName,
    mimeType: upload.mimeType,
    size: upload.size,
    uploadedAt: new Date().toISOString(),
  };
}
