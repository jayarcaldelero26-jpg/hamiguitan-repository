"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArchiveBoxArrowDownIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CameraIcon,
  CheckCircleIcon,
  DocumentIcon,
  EllipsisHorizontalIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  PhoneIcon,
  TrashIcon,
  UserCircleIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useAuth } from "@/app/components/AuthProvider";
import { useProtectedTheme } from "@/app/components/ProtectedThemeProvider";
import { useEditModalMotion, useModalMotion } from "@/app/lib/modalMotion";
import { repoTheme } from "@/app/lib/repoTheme";

type OrgSection = "pasu" | "assistant_pasu" | "pamo_staff" | "former_pasu";
type OrgStatus =
  | "active"
  | "archived"
  | "resigned"
  | "retired"
  | "end_of_contract"
  | "transferred"
  | "reassigned";
type AttachmentType = "SO" | "Memo" | "Supporting Document";

type OrgEntry = {
  id: number;
  section: OrgSection;
  full_name: string;
  position_title: string;
  email: string;
  mobile: string;
  status: OrgStatus;
  notes: string;
  attachment_name: string | null;
  attachment_size: number | null;
  attachment_url: string | null;
  attachment_mime_type: string | null;
  attachment_drive_file_id: string | null;
  attachment_uploaded_at: string | null;
  attachment_type: AttachmentType | null;
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

type OrgPhotoPayload = {
  publicId: string;
  secureUrl: string;
  originalName: string;
  mimeType: string;
  width: number;
  height: number;
  format: string;
  size: number;
};

type TempAttachmentUpload = {
  tempPath: string;
  originalName: string;
  mimeType: string;
  size: number;
  attachmentType: AttachmentType;
};

type OrgMutationPayload = {
  id?: number;
  section: OrgSection;
  full_name: string;
  position_title: string;
  email: string;
  mobile: string;
  status: OrgStatus;
  notes: string;
  attachmentType: AttachmentType;
  removeAttachment: boolean;
  removePhoto: boolean;
  attachmentUpload?: TempAttachmentUpload;
  photo?: OrgPhotoPayload;
};

type UploadSignatureResponse = {
  cloudName: string;
  apiKey: string;
  folder: string;
  publicId: string;
  resourceType: "image";
  timestamp: number;
  signature: string;
};

type FormState = {
  id: number | null;
  full_name: string;
  position_title: string;
  email: string;
  mobile: string;
  status: OrgStatus;
  notes: string;
  attachmentType: AttachmentType;
  attachmentFile: File | null;
  attachmentName: string;
  attachmentUrl: string;
  attachmentUploadedAt: string;
  removeAttachment: boolean;
  photoFile: File | null;
  photoUrl: string;
  photoName: string;
  removePhoto: boolean;
};

type FormErrors = Partial<
  Record<"full_name" | "position_title" | "email" | "mobile" | "attachment" | "photo", string>
>;
type PageTab = "current" | "archives";
type ModalKind = "pasu" | "assistant" | "staff" | "former_pasu" | null;

const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const PHOTO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ATTACHMENT_TYPE_OPTIONS: AttachmentType[] = ["SO", "Memo", "Supporting Document"];
const ARCHIVE_STATUS_OPTIONS: Array<{ value: OrgStatus; label: string }> = [
  { value: "resigned", label: "Resigned" },
  { value: "retired", label: "Retired" },
  { value: "end_of_contract", label: "End of Contract" },
  { value: "transferred", label: "Transferred" },
  { value: "reassigned", label: "Reassigned" },
];

function createFormState(overrides: Partial<FormState> = {}): FormState {
  return {
    id: null,
    full_name: "",
    position_title: "",
    email: "",
    mobile: "",
    status: "active",
    notes: "",
    attachmentType: "SO",
    attachmentFile: null,
    attachmentName: "",
    attachmentUrl: "",
    attachmentUploadedAt: "",
    removeAttachment: false,
    photoFile: null,
    photoUrl: "",
    photoName: "",
    removePhoto: false,
    ...overrides,
  };
}

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function canManage(role?: string) {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "co_admin";
}

function formatStatus(status: OrgStatus) {
  if (status === "end_of_contract") return "End of Contract";
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAttachmentSize(size: number | null) {
  if (!size) return "";
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function createInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "NA";
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

function getNotesPreview(notes: string, fallback = "No notes added yet.") {
  const text = notes.trim();
  if (!text) return fallback;
  if (text.length <= 130) return text;
  return `${text.slice(0, 127).trimEnd()}...`;
}

function getStatusTone(status: OrgStatus, dark: boolean) {
  if (status === "active") {
    return dark
      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "archived") {
    return dark
      ? "border-slate-300/18 bg-slate-400/10 text-slate-200"
      : "border-slate-200 bg-slate-100 text-slate-700";
  }

  return dark
    ? "border-amber-300/20 bg-amber-400/10 text-amber-200"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

function formatDate(value?: string | null) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidMobile(mobile: string) {
  return /^\+?[0-9][0-9\s\-()]{6,19}$/.test(mobile);
}

function validateAttachment(file: File | null) {
  if (!file) return "";
  const typeValid = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!typeValid) return "Attachment must be a PDF file.";
  if (file.size > MAX_ATTACHMENT_SIZE) return "Attachment must not exceed 50 MB.";
  return "";
}

function validatePhoto(file: File | null) {
  if (!file) return "";
  if (!PHOTO_MIME_TYPES.has(file.type)) return "Photo must be JPG, PNG, WEBP, or GIF.";
  if (file.size > MAX_PHOTO_SIZE) return "Photo must not exceed 10 MB.";
  return "";
}

function validateForm(form: FormState) {
  const errors: FormErrors = {};

  if (!form.full_name.trim()) {
    errors.full_name = "Full name is required.";
  }

  if (!form.position_title.trim()) {
    errors.position_title = "Position title is required.";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!form.mobile.trim()) {
    errors.mobile = "Mobile number is required.";
  } else if (!isValidMobile(form.mobile.trim())) {
    errors.mobile = "Enter a valid mobile number.";
  }

  const attachmentError = validateAttachment(form.attachmentFile);
  if (attachmentError) {
    errors.attachment = attachmentError;
  }

  const photoError = validatePhoto(form.photoFile);
  if (photoError) {
    errors.photo = photoError;
  }

  return errors;
}

async function uploadAttachmentToTemp(file: File, attachmentType: AttachmentType): Promise<TempAttachmentUpload> {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/upload-temp", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = (await response.json().catch(() => null)) as
    | { tempPath?: string; originalName?: string; mimeType?: string; fileSize?: number; error?: string }
    | null;

  if (!response.ok || !data?.tempPath || !data.originalName) {
    throw new Error(data?.error || "Failed to stage PDF attachment.");
  }

  return {
    tempPath: data.tempPath,
    originalName: data.originalName,
    mimeType: data.mimeType || "application/pdf",
    size: typeof data.fileSize === "number" ? data.fileSize : file.size,
    attachmentType,
  };
}

async function uploadPhotoToCloudinary(section: OrgSection, file: File): Promise<OrgPhotoPayload> {
  const signatureRes = await fetch("/api/organizational-chart/upload-signature", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ section, assetKind: "photo" }),
  });
  const signatureData = (await signatureRes.json().catch(() => null)) as
    | (UploadSignatureResponse & { error?: string })
    | null;

  if (!signatureRes.ok || !signatureData) {
    throw new Error(signatureData?.error || "Failed to prepare Cloudinary upload.");
  }

  const uploadFormData = new FormData();
  uploadFormData.set("file", file);
  uploadFormData.set("api_key", signatureData.apiKey);
  uploadFormData.set("timestamp", String(signatureData.timestamp));
  uploadFormData.set("signature", signatureData.signature);
  uploadFormData.set("folder", signatureData.folder);
  uploadFormData.set("public_id", signatureData.publicId);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/${signatureData.resourceType}/upload`,
    {
      method: "POST",
      body: uploadFormData,
    }
  );
  const uploadData = (await uploadRes.json().catch(() => null)) as
    | {
        secure_url?: string;
        public_id?: string;
        width?: number;
        height?: number;
        format?: string;
        resource_type?: string;
        error?: { message?: string };
      }
    | null;

  if (
    !uploadRes.ok ||
    !uploadData?.secure_url ||
    !uploadData.public_id ||
    uploadData.resource_type !== "image" ||
    !uploadData.width ||
    !uploadData.height ||
    !uploadData.format
  ) {
    throw new Error(uploadData?.error?.message || "Failed to upload photo to Cloudinary.");
  }

  return {
    publicId: uploadData.public_id,
    secureUrl: uploadData.secure_url,
    originalName: file.name,
    mimeType: file.type,
    width: uploadData.width,
    height: uploadData.height,
    format: uploadData.format,
    size: file.size,
  };
}

function toFormState(entry: OrgEntry) {
  return createFormState({
    id: entry.id,
    full_name: entry.full_name,
    position_title: entry.position_title,
    email: entry.email,
    mobile: entry.mobile,
    status: entry.status,
    notes: entry.notes,
    attachmentType: entry.attachment_type || "SO",
    attachmentName: entry.attachment_name || "",
    attachmentUrl: entry.attachment_url || "",
    attachmentUploadedAt: entry.attachment_uploaded_at || "",
    photoName: entry.photo_original_name || "",
    photoUrl: entry.photo_url || "",
  });
}

function Avatar({
  name,
  photoUrl,
  ui,
  size = "lg",
}: {
  name: string;
  photoUrl?: string | null;
  ui: ReturnType<typeof repoTheme>;
  size?: "sm" | "lg";
}) {
  const dimensions = size === "sm" ? "h-14 w-14 text-sm rounded-[18px]" : "h-24 w-24 text-xl rounded-[28px]";
  const imageSize = size === "sm" ? 56 : 96;

  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={imageSize}
        height={imageSize}
        className={`${dimensions} object-cover shadow-[0_18px_42px_rgba(0,0,0,0.2)]`}
      />
    );
  }

  return (
    <div
      className={`${dimensions} ${ui.panelSoft} flex items-center justify-center font-semibold text-[var(--ui-text-main)]`}
    >
      {name.trim() ? createInitials(name) : <UserCircleIcon className="h-8 w-8" />}
    </div>
  );
}

function PanelHeader({
  icon,
  eyebrow,
  title,
  description,
  ui,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  ui: ReturnType<typeof repoTheme>;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className={ui.iconBox}>{icon}</div>
      <div>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>{eyebrow}</p>
        <h2 className={`mt-2 text-2xl font-semibold ${ui.textMain}`}>{title}</h2>
        <p className={`mt-2 max-w-2xl text-sm leading-6 ${ui.textMuted}`}>{description}</p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  ui,
}: {
  label: string;
  value: string;
  detail: string;
  ui: ReturnType<typeof repoTheme>;
}) {
  return (
    <div className={`${ui.panelSoft} rounded-[22px] border border-[var(--ui-border)] px-4 py-3.5`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${ui.textSoft}`}>{label}</p>
      <p className={`mt-2 text-[1.7rem] font-semibold leading-none ${ui.textMain}`}>{value}</p>
      <p className={`mt-1.5 text-xs leading-5 ${ui.textMuted}`}>{detail}</p>
    </div>
  );
}

function SectionTabs({
  active,
  onChange,
  ui,
}: {
  active: PageTab;
  onChange: (tab: PageTab) => void;
  ui: ReturnType<typeof repoTheme>;
}) {
  return (
    <div className={`${ui.panelSoft} inline-flex w-full flex-wrap gap-2 rounded-[22px] p-2 sm:w-auto sm:flex-nowrap`}>
      {[
        ["current", "Current Staff", "Leadership + active staff"],
        ["archives", "Archives", "Former PASU + archived staff"],
      ].map(([value, label, detail]) => {
        const selected = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value as PageTab)}
            className={`min-h-11 flex-1 rounded-[18px] px-4 py-3 text-left transition sm:min-w-[210px] sm:flex-none ${
              selected
                ? ui.buttonPrimary
                : "app-clickable app-sidebar-btn app-sidebar-btn-neutral border border-transparent bg-transparent shadow-none hover:border-[var(--ui-border)]"
            }`}
          >
            <span className="block text-sm font-semibold">{label}</span>
            <span
              className={`app-button-subtext mt-1 block text-[10px] uppercase tracking-[0.14em] ${
                selected ? "" : ui.textSoft
              }`}
            >
              {detail}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  error,
  ui,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  ui: ReturnType<typeof repoTheme>;
  type?: "text" | "email";
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${ui.input.replace("pl-11", "pl-4")} min-h-[52px] ${error ? "border-rose-400/60 focus:border-rose-400 focus:ring-rose-500/16" : ""}`}
      />
      {error ? <span className="mt-2 block text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  helper,
  ui,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  helper?: string;
  ui: ReturnType<typeof repoTheme>;
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>
        {label}
      </span>
      <textarea
        value={value}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${ui.input.replace("pl-11", "pl-4")} min-h-[104px] resize-y py-3.5`}
      />
      {helper ? <span className={`mt-2 block text-xs ${ui.textMuted}`}>{helper}</span> : null}
    </label>
  );
}

function PhotoWorkflowCard({
  form,
  error,
  onFileChange,
  onRemoveSelected,
  onToggleRemoveExisting,
  ui,
}: {
  form: FormState;
  error?: string;
  onFileChange: (file: File | null) => void;
  onRemoveSelected: () => void;
  onToggleRemoveExisting: () => void;
  ui: ReturnType<typeof repoTheme>;
}) {
  const previewUrl = useMemo(() => (form.photoFile ? URL.createObjectURL(form.photoFile) : ""), [form.photoFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const activePreview = previewUrl || (form.removePhoto ? "" : form.photoUrl);

  return (
    <div className={`${ui.panelSoft} rounded-[24px] border border-[var(--ui-border)] p-4 sm:p-5`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Avatar name={form.full_name || form.position_title || "Personnel"} photoUrl={activePreview} ui={ui} />
        <div className="min-w-0 flex-1">
          <span className={`block text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>
            Profile Photo
          </span>
          <p className={`mt-2 text-sm leading-6 ${ui.textMuted}`}>
            Use a clean profile image for cards and personnel previews. Photos upload separately from PDF attachments.
          </p>
          <p className="mt-2 truncate text-sm font-medium text-[var(--ui-text-main)]">
            {form.photoFile?.name || form.photoName || "No photo uploaded"}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <label
              className={`app-clickable ${ui.buttonSecondary} inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold`}
            >
              <CameraIcon className="h-4 w-4" />
              Upload Photo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => onFileChange(event.target.files?.[0] || null)}
              />
            </label>
            {form.photoFile ? (
              <button
                type="button"
                onClick={onRemoveSelected}
                className={`${ui.buttonSecondary} inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold`}
              >
                <XMarkIcon className="h-4 w-4" />
                Remove Selected
              </button>
            ) : null}
            {form.photoName && !form.photoFile ? (
              <button
                type="button"
                onClick={onToggleRemoveExisting}
                className={`${ui.buttonSecondary} inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold`}
              >
                <TrashIcon className="h-4 w-4" />
                {form.removePhoto ? "Keep Existing Photo" : "Remove Existing Photo"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {error ? <span className="mt-3 block text-xs text-rose-400">{error}</span> : null}
      {form.removePhoto ? <p className="mt-3 text-xs text-amber-300">The current photo will be removed when you save.</p> : null}
    </div>
  );
}

function AttachmentWorkflowCard({
  form,
  error,
  onTypeChange,
  onFileChange,
  onRemoveSelected,
  onToggleRemoveExisting,
  ui,
}: {
  form: FormState;
  error?: string;
  onTypeChange: (value: AttachmentType) => void;
  onFileChange: (file: File | null) => void;
  onRemoveSelected: () => void;
  onToggleRemoveExisting: () => void;
  ui: ReturnType<typeof repoTheme>;
}) {
  return (
    <div className={`${ui.panelSoft} rounded-[24px] border border-[var(--ui-border)] p-4 sm:p-5`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <span className={`block text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>
            PDF / SO Attachment
          </span>
          <p className={`mt-2 text-sm leading-6 ${ui.textMuted}`}>
            Supporting files stay attached to the personnel record and are uploaded when the form is saved.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ATTACHMENT_TYPE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onTypeChange(option)}
                className={`${form.attachmentType === option ? ui.buttonPrimary : ui.buttonSecondary} inline-flex min-h-10 items-center rounded-full px-4 text-xs font-semibold`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-[20px] border border-[var(--ui-border)] bg-[var(--ui-bg)]/55 px-4 py-3 lg:w-[280px]">
          <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>Current File</p>
          <p className="mt-2 truncate text-sm font-medium text-[var(--ui-text-main)]">
            {form.attachmentFile?.name || form.attachmentName || "No PDF attached"}
          </p>
          <p className={`mt-1 text-xs ${ui.textMuted}`}>
            {form.attachmentUploadedAt ? `Uploaded ${formatDate(form.attachmentUploadedAt)}` : "PDF only, up to 50 MB."}
          </p>
        </div>
      </div>

      <label className={`app-clickable ${ui.panelSoft} mt-4 flex min-h-[72px] items-center justify-between gap-3 rounded-[22px] border border-dashed border-[var(--ui-border)] px-4 py-3`}>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--ui-text-main)]">
            {form.attachmentFile?.name || form.attachmentName || "Select PDF / SO file"}
          </p>
          <p className={`mt-1 text-xs ${ui.textMuted}`}>PDF only, up to 50 MB. Upload starts when you save the record.</p>
        </div>
        <span className={`${ui.buttonSecondary} inline-flex min-h-10 items-center justify-center rounded-full px-4 text-xs font-semibold`}>
          Upload Attachment
        </span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
        />
      </label>

      {error ? <span className="mt-2 block text-xs text-rose-400">{error}</span> : null}

      <div className="mt-4 flex flex-wrap gap-3">
        {form.attachmentUrl && !form.removeAttachment ? (
          <Link
            href={form.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className={`app-clickable ${ui.buttonSecondary} inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold`}
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            View Current PDF
          </Link>
        ) : null}
        {form.attachmentFile ? (
          <button
            type="button"
            onClick={onRemoveSelected}
            className={`${ui.buttonSecondary} inline-flex min-h-10 items-center rounded-full px-4 text-xs font-semibold`}
          >
            Remove Selected File
          </button>
        ) : null}
        {form.attachmentName && !form.attachmentFile ? (
          <button
            type="button"
            onClick={onToggleRemoveExisting}
            className={`${ui.buttonSecondary} inline-flex min-h-10 items-center rounded-full px-4 text-xs font-semibold`}
          >
            {form.removeAttachment ? "Keep Existing PDF" : "Remove Existing PDF"}
          </button>
        ) : null}
      </div>

      {form.removeAttachment ? (
        <p className="mt-2 text-xs text-amber-300">The existing PDF / SO attachment will be removed when you save.</p>
      ) : null}
    </div>
  );
}

function EmptySummaryCard({
  title,
  subtitle,
  ui,
}: {
  title: string;
  subtitle: string;
  ui: ReturnType<typeof repoTheme>;
}) {
  return (
    <div className={`${ui.panelSoft} rounded-[24px] border border-dashed border-[var(--ui-border)] p-5`}>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-[var(--ui-border)] bg-[var(--ui-bg)]/60">
          <UserCircleIcon className="h-8 w-8 text-[var(--ui-text-main)] opacity-70" />
        </div>
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>No assigned record</p>
          <h3 className={`mt-1.5 text-lg font-semibold ${ui.textMain}`}>{title}</h3>
          <p className={`mt-1.5 max-w-xl text-sm leading-5 ${ui.textMuted}`}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function PersonnelSummaryCard({
  entry,
  summaryLabel,
  manageAccess,
  onEdit,
  ui,
  dark,
}: {
  entry: OrgEntry | null;
  summaryLabel: string;
  manageAccess: boolean;
  onEdit?: () => void;
  ui: ReturnType<typeof repoTheme>;
  dark: boolean;
}) {
  if (!entry) {
    return (
      <EmptySummaryCard
        title="No record assigned yet"
        subtitle="Personnel details will appear here once a record is added."
        ui={ui}
      />
    );
  }

  return (
    <div className={`${ui.panelSoft} rounded-[24px] border border-[var(--ui-border)] p-4 sm:p-5`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <Avatar name={entry.full_name} photoUrl={entry.photo_url} ui={ui} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>{summaryLabel}</p>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusTone(entry.status, dark)}`}>
              {formatStatus(entry.status)}
            </span>
          </div>
          <h3 className={`mt-2 text-2xl font-semibold ${ui.textMain}`}>{entry.full_name}</h3>
          <p className={`mt-1 text-sm ${ui.textMuted}`}>{entry.position_title}</p>

          <div className={`mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm ${ui.textMuted}`}>
            <span className="inline-flex items-center gap-2">
              <EnvelopeIcon className="h-4 w-4" />
              {entry.email || "No email provided"}
            </span>
            <span className="inline-flex items-center gap-2">
              <PhoneIcon className="h-4 w-4" />
              {entry.mobile || "No mobile provided"}
            </span>
          </div>

          <p className={`mt-3 text-sm leading-5 ${ui.textMuted}`}>{getNotesPreview(entry.notes, "No summary notes added yet.")}</p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ui-border)] pt-3">
            <div className="min-w-0">
              <p className={`truncate text-sm ${ui.textMain}`}>{entry.attachment_name || "No supporting file attached"}</p>
              <p className={`mt-1 text-xs ${ui.textMuted}`}>
                {entry.attachment_name
                  ? `${entry.attachment_type || "Supporting Document"}${entry.attachment_size ? ` | ${formatAttachmentSize(entry.attachment_size)}` : ""}`
                  : "PDF/SO status available here."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {manageAccess && onEdit ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className={`app-clickable ${ui.buttonPrimary} inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold`}
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Edit
                </button>
              ) : null}
              {entry.attachment_url ? (
                <Link
                  href={entry.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  className={`app-clickable ${ui.buttonSecondary} inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold`}
                >
                  <DocumentIcon className="h-4 w-4" />
                  Preview
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonnelFormCard({
  eyebrow,
  title,
  description,
  form,
  errors,
  onChange,
  onPhotoChange,
  onAttachmentChange,
  onSubmit,
  onCancel,
  submitting,
  canCancel,
  showStatus,
  ui,
}: {
  eyebrow: string;
  title: string;
  description: string;
  form: FormState;
  errors: FormErrors;
  onChange: (next: FormState) => void;
  onPhotoChange: (file: File | null) => void;
  onAttachmentChange: (file: File | null) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitting: boolean;
  canCancel?: boolean;
  showStatus?: boolean;
  ui: ReturnType<typeof repoTheme>;
}) {
  return (
    <section className={`${ui.cardSoft} border border-[var(--ui-border)] p-5 sm:p-6`}>
      <PanelHeader
        icon={<DocumentIcon className="h-6 w-6" />}
        eyebrow={eyebrow}
        title={title}
        description={description}
        ui={ui}
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FormField
          label="Full Name"
          value={form.full_name}
          onChange={(value) => onChange({ ...form, full_name: value })}
          placeholder="Enter full name"
          error={errors.full_name}
          ui={ui}
        />
        <FormField
          label="Position Title"
          value={form.position_title}
          onChange={(value) => onChange({ ...form, position_title: value })}
          placeholder="Enter position title"
          error={errors.position_title}
          ui={ui}
        />
        <FormField
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => onChange({ ...form, email: value })}
          placeholder="name@example.com"
          error={errors.email}
          ui={ui}
        />
        <FormField
          label="Mobile"
          value={form.mobile}
          onChange={(value) => onChange({ ...form, mobile: value })}
          placeholder="+63 9XX XXX XXXX"
          error={errors.mobile}
          ui={ui}
        />
      </div>

      {showStatus ? (
        <div className="mt-4">
          <label className="block">
            <span className={`mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] ${ui.textSoft}`}>
              Status
            </span>
            <select
              value={form.status}
              onChange={(event) => onChange({ ...form, status: event.target.value as OrgStatus })}
              className={`app-clickable ${ui.input.replace("pl-11", "pl-4")}`}
            >
              <option value="active">Active</option>
              {ARCHIVE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className={`mt-2 block text-xs ${ui.textMuted}`}>
              Active records stay in the current list. Archived statuses move the record into archives.
            </span>
          </label>
        </div>
      ) : null}

      <div className="mt-4">
        <PhotoWorkflowCard
          form={form}
          error={errors.photo}
          onFileChange={onPhotoChange}
          onRemoveSelected={() => onChange({ ...form, photoFile: null })}
          onToggleRemoveExisting={() => onChange({ ...form, removePhoto: !form.removePhoto })}
          ui={ui}
        />
      </div>

      <div className="mt-4">
        <AttachmentWorkflowCard
          form={form}
          error={errors.attachment}
          onTypeChange={(value) => onChange({ ...form, attachmentType: value })}
          onFileChange={onAttachmentChange}
          onRemoveSelected={() => onChange({ ...form, attachmentFile: null })}
          onToggleRemoveExisting={() => onChange({ ...form, removeAttachment: !form.removeAttachment })}
          ui={ui}
        />
      </div>

      <div className="mt-4">
        <TextareaField
          label="Notes"
          value={form.notes}
          onChange={(value) => onChange({ ...form, notes: value })}
          placeholder="Add summary notes, service context, or document remarks."
          helper="Keep notes concise and admin-facing."
          ui={ui}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSubmit}
          className={`${ui.buttonPrimary} inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold`}
        >
          {submitting ? "Saving..." : form.id ? "Save Changes" : "Create Record"}
        </button>
        {canCancel && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className={`${ui.buttonSecondary} inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold`}
          >
            Cancel Edit
          </button>
        ) : null}
      </div>
    </section>
  );
}

function PersonnelModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  ui,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
  ui: ReturnType<typeof repoTheme>;
}) {
  const { overlayMotion, panelMotion } = useEditModalMotion();

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={overlayMotion.initial}
        animate={overlayMotion.animate}
        exit={overlayMotion.exit}
        className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Close personnel modal"
        />
        <motion.div
          initial={panelMotion.initial}
          animate={panelMotion.animate}
          exit={panelMotion.exit}
          className={`${ui.modal} relative z-[131] flex max-h-[92vh] w-full max-w-4xl flex-col rounded-[30px] border shadow-[0_32px_90px_rgba(0,0,0,0.24)]`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--ui-border)] px-5 py-4 sm:px-6">
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>Personnel Form</p>
              <h2 className={`mt-1 text-2xl font-semibold ${ui.textMain}`}>{title}</h2>
              <p className={`mt-2 text-sm ${ui.textMuted}`}>{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`${ui.buttonSecondary} inline-flex min-h-10 items-center justify-center rounded-full px-3`}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-y-auto p-4 sm:p-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function RecordList({
  title,
  description,
  action,
  compactTable = false,
  entries,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  canEdit,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  archiveMode = false,
  ui,
  dark,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  compactTable?: boolean;
  entries: OrgEntry[];
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  canEdit: boolean;
  onEdit: (entry: OrgEntry) => void;
  onDelete: (entry: OrgEntry) => void;
  onArchive?: (entry: OrgEntry) => void;
  onRestore?: (entry: OrgEntry) => void;
  archiveMode?: boolean;
  ui: ReturnType<typeof repoTheme>;
  dark: boolean;
}) {
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const { dropdownMotion, actionPressMotion } = useModalMotion();

  useEffect(() => {
    if (openActionId === null) return;

    const handleDocumentClick = () => setOpenActionId(null);
    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [openActionId]);

  return (
    <section className={`${ui.card} p-5 sm:p-6`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>{title}</p>
          <p className={`mt-1.5 text-sm ${ui.textMuted}`}>{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {entries.length === 0 ? (
        <div className={`${ui.panelSoft} mt-4 rounded-[22px] border border-dashed border-[var(--ui-border)] px-5 py-7 text-center`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-[var(--ui-border)] bg-[var(--ui-bg)]/60">
            {archiveMode ? (
              <ArchiveBoxArrowDownIcon className="h-6 w-6 text-[var(--ui-text-main)]" />
            ) : (
              <UserGroupIcon className="h-6 w-6 text-[var(--ui-text-main)]" />
            )}
          </div>
          <h3 className={`mt-3 text-base font-semibold ${ui.textMain}`}>{emptyTitle}</h3>
          <p className={`mx-auto mt-1.5 max-w-xl text-sm leading-5 ${ui.textMuted}`}>{emptyDescription}</p>
          {emptyActionLabel && onEmptyAction ? (
            <button
              type="button"
              onClick={onEmptyAction}
              className={`${ui.buttonPrimary} mt-5 inline-flex min-h-10 items-center rounded-full px-4 text-xs font-semibold`}
            >
              {emptyActionLabel}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {compactTable ? (
            <div className={`hidden rounded-[18px] border border-[var(--ui-border)] bg-[var(--ui-bg)]/55 px-4 py-2 lg:grid lg:grid-cols-[2.5fr_2fr_2fr_1.2fr] lg:items-center lg:gap-4`}>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>Personnel</p>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>Contact</p>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>Record Details</p>
              <p className={`text-right text-[10px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>Actions</p>
            </div>
          ) : null}
          {entries.map((entry) => (
            <article
              key={entry.id}
              role={canEdit ? "button" : undefined}
              tabIndex={canEdit ? 0 : undefined}
              onClick={canEdit ? () => onEdit(entry) : undefined}
              onKeyDown={
                canEdit
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onEdit(entry);
                      }
                    }
                  : undefined
              }
              className={`${ui.panelSoft} rounded-[22px] border px-4 py-3 sm:px-4 ${
                archiveMode ? "border-[var(--ui-border)] bg-[var(--ui-bg)]/38 opacity-90" : "border-[var(--ui-border)] bg-[var(--ui-bg)]/62"
              } ${
                canEdit
                  ? "app-clickable-row transition duration-150 ease-out hover:-translate-y-[1px] hover:border-[rgba(57,92,122,0.32)] hover:bg-[var(--ui-bg)]/78 hover:shadow-[0_12px_24px_rgba(15,23,42,0.09)] focus:outline-none focus:ring-2 focus:ring-[#395C7A]/25"
                  : ""
              }`}
            >
              <div className={`${compactTable ? "grid gap-3 lg:grid-cols-[2.5fr_2fr_2fr_1.2fr] lg:items-center lg:gap-4" : "grid gap-3 xl:grid-cols-[1.5fr_auto] xl:items-start"}`}>
                <div className="min-w-0">
                  <div className="flex items-start gap-4">
                    <Avatar name={entry.full_name} photoUrl={entry.photo_url} size="sm" ui={ui} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`truncate text-base font-semibold ${ui.textMain}`}>{entry.full_name}</h3>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusTone(entry.status, dark)}`}>
                          {formatStatus(entry.status)}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm ${ui.textMuted}`}>{entry.position_title}</p>
                    </div>
                  </div>
                </div>

                {compactTable ? (
                  <>
                    <div className={`flex flex-col gap-1.5 text-sm ${ui.textMuted}`}>
                      <span className="inline-flex items-center gap-2">
                        <EnvelopeIcon className="h-4 w-4" />
                        {entry.email}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4" />
                        {entry.mobile}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className={`truncate text-sm ${ui.textMuted}`}>{getNotesPreview(entry.notes)}</p>
                      <div className={`mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${ui.textSoft}`}>
                        <span className="inline-flex items-center gap-1.5">
                          <DocumentIcon className="h-3.5 w-3.5" />
                          {entry.attachment_name
                            ? `${entry.attachment_type || "Supporting Document"}${entry.attachment_size ? ` | ${formatAttachmentSize(entry.attachment_size)}` : ""}`
                            : "No file attached"}
                        </span>
                        {entry.attachment_url ? (
                          <Link
                            href={entry.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="app-clickable inline-flex items-center gap-1.5 text-[var(--ui-text-main)] underline-offset-2 hover:underline"
                          >
                            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                            Preview file
                          </Link>
                        ) : null}
                        <span>Updated {formatDate(entry.updated_at)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="min-w-0">
                    <div className={`mt-3 flex flex-wrap gap-3 text-sm ${ui.textMuted}`}>
                        <span className="inline-flex items-center gap-2">
                          <EnvelopeIcon className="h-4 w-4" />
                          {entry.email}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <PhoneIcon className="h-4 w-4" />
                          {entry.mobile}
                        </span>
                    </div>
                    <div className={`mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs ${ui.textMuted}`}>
                        <span>{getNotesPreview(entry.notes)}</span>
                        <span className="inline-flex items-center gap-1.5">
                          <DocumentIcon className="h-3.5 w-3.5" />
                          {entry.attachment_name
                            ? `${entry.attachment_type || "Supporting Document"}${entry.attachment_size ? ` | ${formatAttachmentSize(entry.attachment_size)}` : ""}`
                            : "No file attached"}
                        </span>
                        <span>Updated {formatDate(entry.updated_at)}</span>
                    </div>
                  </div>
                )}

                <div className={`flex flex-wrap items-start gap-2 ${compactTable ? "lg:justify-end lg:justify-self-end" : "xl:max-w-[220px] xl:justify-end"}`}>
                  {(canEdit && (onArchive || onRestore || onDelete)) ? (
                    <div className="relative">
                      <motion.button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenActionId((current) => (current === entry.id ? null : entry.id));
                        }}
                        whileTap={actionPressMotion}
                        className={`app-clickable ${ui.buttonSecondary} inline-flex min-h-10 items-center justify-center rounded-full px-3`}
                        aria-haspopup="menu"
                        aria-expanded={openActionId === entry.id}
                        aria-label="More actions"
                      >
                        <EllipsisHorizontalIcon className="h-5 w-5" />
                      </motion.button>

                      <AnimatePresence>
                        {openActionId === entry.id ? (
                          <motion.div
                            role="menu"
                            initial={dropdownMotion.initial}
                            animate={dropdownMotion.animate}
                            exit={dropdownMotion.exit}
                            transition={dropdownMotion.transition}
                            className={`${ui.modal} absolute right-0 z-20 mt-2 min-w-[160px] origin-top-right rounded-[18px] border border-[var(--ui-border)] p-1.5 shadow-[0_16px_34px_rgba(15,23,42,0.14)]`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            {onArchive ? (
                              <motion.button
                                type="button"
                                role="menuitem"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenActionId(null);
                                  onArchive(entry);
                                }}
                                whileTap={actionPressMotion}
                                className="app-clickable flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left text-sm text-[var(--ui-text-main)] transition hover:bg-[var(--ui-bg)]/60"
                              >
                                <ArchiveBoxArrowDownIcon className="h-4 w-4" />
                                Archive
                              </motion.button>
                            ) : null}
                            {onRestore ? (
                              <motion.button
                                type="button"
                                role="menuitem"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenActionId(null);
                                  onRestore(entry);
                                }}
                                whileTap={actionPressMotion}
                                className="app-clickable flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left text-sm text-[var(--ui-text-main)] transition hover:bg-[var(--ui-bg)]/60"
                              >
                                <ArrowPathIcon className="h-4 w-4" />
                                Restore
                              </motion.button>
                            ) : null}
                            <motion.button
                              type="button"
                              role="menuitem"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenActionId(null);
                                onDelete(entry);
                              }}
                              whileTap={actionPressMotion}
                              className="app-clickable flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete
                            </motion.button>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function OrganizationalChartPage() {
  const { user } = useAuth();
  const { theme } = useProtectedTheme();
  const { overlayMotion, panelMotion } = useModalMotion();
  const ui = repoTheme(theme);
  const dark = theme === "dark";
  const manageAccess = canManage(user?.role);

  const [pageTab, setPageTab] = useState<PageTab>("current");
  const [entries, setEntries] = useState<OrgEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [pasuForm, setPasuForm] = useState(createFormState({ position_title: "Protected Area Superintendent" }));
  const [assistantForm, setAssistantForm] = useState(
    createFormState({ position_title: "Assistant Protected Area Superintendent" })
  );
  const [staffForm, setStaffForm] = useState(createFormState({ position_title: "PAMO Staff" }));
  const [formerPasuForm, setFormerPasuForm] = useState(
    createFormState({ position_title: "Former Protected Area Superintendent", status: "archived" })
  );

  const [pasuErrors, setPasuErrors] = useState<FormErrors>({});
  const [assistantErrors, setAssistantErrors] = useState<FormErrors>({});
  const [staffErrors, setStaffErrors] = useState<FormErrors>({});
  const [formerPasuErrors, setFormerPasuErrors] = useState<FormErrors>({});

  const [submittingSection, setSubmittingSection] = useState<OrgSection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgEntry | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<OrgEntry | null>(null);
  const [archiveStatus, setArchiveStatus] = useState<OrgStatus>("resigned");
  const [activeModal, setActiveModal] = useState<ModalKind>(null);

  const currentPasu = useMemo(
    () => entries.find((entry) => entry.section === "pasu" && entry.status === "active") || null,
    [entries]
  );
  const assistantEntries = useMemo(
    () => entries.filter((entry) => entry.section === "assistant_pasu"),
    [entries]
  );
  const activePamoEntries = useMemo(
    () => entries.filter((entry) => entry.section === "pamo_staff" && entry.status === "active"),
    [entries]
  );
  const archivedPamoEntries = useMemo(
    () => entries.filter((entry) => entry.section === "pamo_staff" && entry.status !== "active"),
    [entries]
  );
  const formerPasuEntries = useMemo(
    () => entries.filter((entry) => entry.section === "former_pasu"),
    [entries]
  );
  const featuredAssistant = useMemo(
    () => assistantEntries[0] || null,
    [assistantEntries]
  );

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setPageError("");
        const res = await fetch("/api/organizational-chart", {
          cache: "no-store",
          credentials: "include",
        });
        const data = (await res.json().catch(() => null)) as OrgEntry[] | { error?: string } | null;

        if (!active) return;
        if (!res.ok) {
          setEntries([]);
          setPageError((data as { error?: string } | null)?.error || "Failed to load personnel records.");
          return;
        }

        setEntries(Array.isArray(data) ? data : []);
      } catch {
        if (!active) return;
        setEntries([]);
        setPageError("Failed to load personnel records.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!currentPasu) {
      setPasuForm(createFormState({ position_title: "Protected Area Superintendent" }));
      return;
    }

    setPasuForm(
      createFormState({
        ...toFormState(currentPasu),
        status: "active",
      })
    );
  }, [currentPasu]);

  function resetPasuForm() {
    setPasuForm(
      currentPasu
        ? createFormState({
            ...toFormState(currentPasu),
            status: "active",
          })
        : createFormState({ position_title: "Protected Area Superintendent" })
    );
    setPasuErrors({});
  }

  function resetAssistantForm() {
    setAssistantForm(createFormState({ position_title: "Assistant Protected Area Superintendent" }));
    setAssistantErrors({});
  }

  function resetStaffForm() {
    setStaffForm(createFormState({ position_title: "PAMO Staff" }));
    setStaffErrors({});
  }

  function resetFormerPasuForm() {
    setFormerPasuForm(createFormState({ position_title: "Former Protected Area Superintendent", status: "archived" }));
    setFormerPasuErrors({});
  }

  function closePersonnelModal() {
    setActiveModal(null);
    resetPasuForm();
    resetAssistantForm();
    resetStaffForm();
    resetFormerPasuForm();
  }

  function openPasuModal(entry?: OrgEntry | null) {
    setPasuErrors({});
    setPasuForm(
      entry
        ? createFormState({
            ...toFormState(entry),
            status: "active",
          })
        : createFormState({ position_title: "Protected Area Superintendent" })
    );
    setActiveModal("pasu");
  }

  function openAssistantModal(entry?: OrgEntry | null) {
    setAssistantErrors({});
    setAssistantForm(
      entry ? createFormState(toFormState(entry)) : createFormState({ position_title: "Assistant Protected Area Superintendent" })
    );
    setActiveModal("assistant");
  }

  function openStaffModal(entry?: OrgEntry | null) {
    setStaffErrors({});
    setStaffForm(entry ? createFormState(toFormState(entry)) : createFormState({ position_title: "PAMO Staff" }));
    setActiveModal("staff");
  }

  function openFormerPasuModal(entry?: OrgEntry | null) {
    setFormerPasuErrors({});
    setFormerPasuForm(
      entry
        ? createFormState(toFormState(entry))
        : createFormState({ position_title: "Former Protected Area Superintendent", status: "archived" })
    );
    setActiveModal("former_pasu");
  }

  async function submitForm(
    section: OrgSection,
    form: FormState,
    setErrors: (errors: FormErrors) => void,
    onSuccess?: () => void
  ) {
    const errors = validateForm(form);
    setErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmittingSection(section);

    try {
      setPageError("");
      let attachmentUpload: TempAttachmentUpload | undefined;
      let photo: OrgPhotoPayload | undefined;

      if (form.attachmentFile) {
        attachmentUpload = await uploadAttachmentToTemp(form.attachmentFile, form.attachmentType);
      }

      if (form.photoFile) {
        photo = await uploadPhotoToCloudinary(section, form.photoFile);
      }

      const payload: OrgMutationPayload = {
        section,
        full_name: form.full_name.trim(),
        position_title: form.position_title.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        status: form.status,
        notes: form.notes.trim(),
        attachmentType: form.attachmentType,
        removeAttachment: form.removeAttachment,
        removePhoto: form.removePhoto,
        ...(form.id ? { id: form.id } : {}),
        ...(attachmentUpload ? { attachmentUpload } : {}),
        ...(photo ? { photo } : {}),
      };

      const res = await fetch("/api/organizational-chart", {
        method: form.id ? "PATCH" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as OrgEntry[] | { error?: string; field?: string } | null;

      if (!res.ok) {
        const serverError = data as { error?: string; field?: string } | null;
        if (serverError?.field) {
          setErrors({ [serverError.field as keyof FormErrors]: serverError.error || "Invalid value." });
        } else {
          setPageError(serverError?.error || "Failed to save personnel record.");
        }
        return;
      }

      setEntries(Array.isArray(data) ? data : []);
      setErrors({});
      onSuccess?.();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to save personnel record.");
    } finally {
      setSubmittingSection(null);
    }
  }

  async function patchEntry(entry: OrgEntry, overrides: Partial<OrgMutationPayload> = {}) {
    try {
      setPageError("");

      const payload: OrgMutationPayload = {
        id: entry.id,
        section: entry.section,
        full_name: entry.full_name,
        position_title: entry.position_title,
        email: entry.email,
        mobile: entry.mobile,
        status: entry.status,
        notes: entry.notes,
        attachmentType: entry.attachment_type || "Supporting Document",
        removeAttachment: false,
        removePhoto: false,
        ...overrides,
      };

      const res = await fetch("/api/organizational-chart", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as OrgEntry[] | { error?: string } | null;

      if (!res.ok) {
        setPageError((data as { error?: string } | null)?.error || "Failed to update personnel record.");
        return;
      }

      setEntries(Array.isArray(data) ? data : []);
    } catch {
      setPageError("Failed to update personnel record.");
    }
  }

  async function deleteEntry(id: number) {
    try {
      const res = await fetch(`/api/organizational-chart?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json().catch(() => null)) as OrgEntry[] | { error?: string } | null;

      if (!res.ok) {
        setPageError((data as { error?: string } | null)?.error || "Failed to delete entry.");
        return;
      }

      setEntries(Array.isArray(data) ? data : []);
      setDeleteTarget(null);
    } catch {
      setPageError("Failed to delete entry.");
    }
  }

  async function restorePamoEntry(entry: OrgEntry) {
    await patchEntry(entry, { status: "active" });
  }

  async function archivePamoEntry() {
    if (!archiveTarget) return;
    await patchEntry(archiveTarget, { status: archiveStatus });
    setArchiveTarget(null);
  }

  function handleFileChange(
    form: FormState,
    setForm: (value: FormState) => void,
    setErrors: (value: FormErrors) => void,
    file: File | null
  ) {
    setForm({
      ...form,
      attachmentFile: file,
      removeAttachment: false,
    });
    const attachmentError = validateAttachment(file);
    setErrors({ attachment: attachmentError || undefined });
  }

  function handlePhotoChange(
    form: FormState,
    setForm: (value: FormState) => void,
    setErrors: (value: FormErrors) => void,
    file: File | null
  ) {
    setForm({
      ...form,
      photoFile: file,
      removePhoto: false,
    });
    const photoError = validatePhoto(file);
    setErrors({ photo: photoError || undefined });
  }

  if (loading) {
    return (
      <section className={`min-h-full p-4 sm:p-6 md:p-8 ${ui.page}`}>
        <div className="mx-auto max-w-7xl">
          <div className={`${ui.card} p-6`}>Loading personnel module...</div>
        </div>
      </section>
    );
  }

  return (
    <section className={`min-h-full p-4 sm:p-6 md:p-8 ${ui.page}`}>
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete personnel record?"
        message="This permanently removes the selected personnel record, linked PDF or SO metadata, and uploaded files."
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={() => {
          if (deleteTarget) {
            void deleteEntry(deleteTarget.id);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <AnimatePresence>
        {archiveTarget ? (
          <motion.div
            initial={overlayMotion.initial}
            animate={overlayMotion.animate}
            exit={overlayMotion.exit}
            transition={overlayMotion.transition}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setArchiveTarget(null)}
              aria-label="Close archive dialog"
            />
            <motion.div
              initial={panelMotion.initial}
              animate={panelMotion.animate}
              exit={panelMotion.exit}
              transition={panelMotion.transition}
              className={`${ui.modal} relative z-[121] w-full max-w-md rounded-[28px] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)]`}
            >
              <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${ui.textSoft}`}>Archive Staff</p>
              <h2 className={`mt-2 text-2xl font-semibold ${ui.textMain}`}>{archiveTarget.full_name}</h2>
              <p className={`mt-3 text-sm ${ui.textMuted}`}>
                Select the archive reason. The record will move from active staff to the archive section.
              </p>
              <label className="mt-5 block">
                <span className={`mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] ${ui.textSoft}`}>
                  Archive Reason
                </span>
                <select
                  value={archiveStatus}
                  onChange={(event) => setArchiveStatus(event.target.value as OrgStatus)}
                  className={`app-clickable ${ui.input.replace("pl-11", "pl-4")}`}
                >
                  {ARCHIVE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setArchiveTarget(null)}
                  className={`${ui.buttonSecondary} inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void archivePamoEntry()}
                  className={`${ui.buttonPrimary} inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold`}
                >
                  Archive Record
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="mx-auto max-w-7xl space-y-4">
        <section className={`${ui.card} overflow-hidden p-5 sm:p-6`}>
          <div className="grid gap-5 xl:grid-cols-[1.2fr_auto] xl:items-end">
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${ui.textSoft}`}>Personnel Management Module</p>
              <h1 className={`mt-1.5 text-[2rem] font-semibold tracking-tight sm:text-[2.45rem] ${ui.textMain}`}>
                PAMO Personnel Information
              </h1>
              <p className={`mt-2 max-w-3xl text-sm leading-6 ${ui.textMuted}`}>
                View current leadership, active staff, archived personnel, profile photos, and supporting files in a cleaner PAMO personnel dashboard.
              </p>
            </div>
            <SectionTabs active={pageTab} onChange={setPageTab} ui={ui} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Current Leadership"
              value={String((currentPasu ? 1 : 0) + (featuredAssistant ? 1 : 0))}
              detail="PASU and assistant."
              ui={ui}
            />
            <MetricCard
              label="Active Staff"
              value={String(activePamoEntries.length)}
              detail="Current PAMO staff."
              ui={ui}
            />
            <MetricCard
              label="Archives"
              value={String(formerPasuEntries.length + archivedPamoEntries.length)}
              detail="Archived personnel."
              ui={ui}
            />
            <MetricCard
              label="Supporting Files"
              value={String(entries.filter((entry) => entry.attachment_drive_file_id).length)}
              detail="Linked files."
              ui={ui}
            />
          </div>

          {!manageAccess ? (
            <div className={`${ui.panelSoft} mt-5 flex items-start gap-3 px-4 py-4 text-sm ${ui.textMuted}`}>
              <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <span>You have read-only access to this personnel module. Editing, photo upload, and PDF / SO management are limited to admin and co-admin roles.</span>
            </div>
          ) : null}

          {pageError ? (
            <div className={`${ui.panelSoft} mt-5 rounded-[20px] border border-rose-400/30 px-4 py-4 text-sm text-rose-300`}>
              {pageError}
            </div>
          ) : null}
        </section>

        {pageTab === "current" ? (
          <div className="space-y-4">
            <section className={`${ui.card} p-5 sm:p-5`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>Current Leadership</p>
                  <h2 className={`mt-1.5 text-xl font-semibold ${ui.textMain}`}>Leadership Profiles</h2>
                  <p className={`mt-1.5 text-sm ${ui.textMuted}`}>Current superintendent and assistant records.</p>
                </div>
                {manageAccess ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openPasuModal(currentPasu)}
                      className={`${ui.buttonPrimary} inline-flex min-h-10 items-center rounded-full px-4 text-xs font-semibold`}
                    >
                      {currentPasu ? "Edit PASU" : "Add PASU"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openAssistantModal(featuredAssistant)}
                      className={`${ui.buttonSecondary} inline-flex min-h-10 items-center rounded-full px-4 text-xs font-semibold`}
                    >
                      {featuredAssistant ? "Edit Assistant" : "Add Assistant"}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                <PersonnelSummaryCard
                  entry={currentPasu}
                  summaryLabel="Protected Area Superintendent"
                  manageAccess={manageAccess}
                  onEdit={() => openPasuModal(currentPasu)}
                  ui={ui}
                  dark={dark}
                />
                <PersonnelSummaryCard
                  entry={featuredAssistant}
                  summaryLabel="Assistant Superintendent"
                  manageAccess={manageAccess}
                  onEdit={() => openAssistantModal(featuredAssistant)}
                  ui={ui}
                  dark={dark}
                />
              </div>
            </section>

            <RecordList
              title="Active Staff Records"
              description="Active PAMO personnel in a compact records view."
              compactTable
              action={
                manageAccess ? (
                  <button
                    type="button"
                    onClick={() => openStaffModal()}
                    className={`${ui.buttonPrimary} inline-flex min-h-10 items-center rounded-full px-4 text-xs font-semibold`}
                  >
                    Add Staff
                  </button>
                ) : null
              }
              entries={activePamoEntries}
              emptyTitle="No active staff records yet"
              emptyDescription="Start the personnel roster by adding the first active PAMO staff record."
              emptyActionLabel={manageAccess ? "Add Staff" : undefined}
              onEmptyAction={manageAccess ? () => openStaffModal() : undefined}
              canEdit={manageAccess}
              onEdit={(entry) => openStaffModal(entry)}
              onDelete={setDeleteTarget}
              onArchive={(entry) => {
                setArchiveTarget(entry);
                setArchiveStatus("resigned");
              }}
              ui={ui}
              dark={dark}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <section className={`${ui.card} p-5 sm:p-6`}>
              <PanelHeader
                icon={<ArchiveBoxArrowDownIcon className="h-6 w-6" />}
                eyebrow="Archives"
                title="Archived Personnel Records"
                description="Archived leadership and staff records remain readable and easy to review."
                ui={ui}
              />
            </section>

            <RecordList
              title="Former PASU"
              description="Archived PASU records."
              action={
                manageAccess ? (
                  <button
                    type="button"
                    onClick={() => openFormerPasuModal()}
                    className={`${ui.buttonPrimary} inline-flex min-h-10 items-center rounded-full px-4 text-xs font-semibold`}
                  >
                    Add Former PASU
                  </button>
                ) : null
              }
              entries={formerPasuEntries}
              emptyTitle="No former PASU records yet"
              emptyDescription="Add the first archived leadership record to start the historical list."
              emptyActionLabel={manageAccess ? "Add Former PASU" : undefined}
              onEmptyAction={manageAccess ? () => openFormerPasuModal() : undefined}
              canEdit={manageAccess}
              onEdit={(entry) => openFormerPasuModal(entry)}
              onDelete={setDeleteTarget}
              archiveMode
              ui={ui}
              dark={dark}
            />

            <RecordList
              title="Archived Staff"
              description="Archived staff records."
              entries={archivedPamoEntries}
              emptyTitle="No archived personnel records yet"
              emptyDescription="Archived staff records will appear here once active personnel are moved out of the current list."
              canEdit={manageAccess}
              onEdit={(entry) => openStaffModal(entry)}
              onDelete={setDeleteTarget}
              onRestore={(entry) => void restorePamoEntry(entry)}
              archiveMode
              ui={ui}
              dark={dark}
            />
          </div>
        )}
      </div>

      <PersonnelModal
        open={activeModal === "pasu"}
        title={pasuForm.id ? "Edit PASU Record" : "Add PASU Record"}
        subtitle="Manage the Protected Area Superintendent profile, photo, notes, and supporting file in one modal."
        onClose={closePersonnelModal}
        ui={ui}
      >
        <PersonnelFormCard
          eyebrow="PASU"
          title={pasuForm.id ? "Protected Area Superintendent" : "New Protected Area Superintendent"}
          description="Photos continue to upload through Cloudinary and supporting files continue through the existing Google Drive flow."
          form={pasuForm}
          errors={pasuErrors}
          onChange={setPasuForm}
          onPhotoChange={(file) => handlePhotoChange(pasuForm, setPasuForm, setPasuErrors, file)}
          onAttachmentChange={(file) => handleFileChange(pasuForm, setPasuForm, setPasuErrors, file)}
          onSubmit={() => void submitForm("pasu", pasuForm, setPasuErrors, closePersonnelModal)}
          onCancel={closePersonnelModal}
          submitting={submittingSection === "pasu"}
          canCancel
          ui={ui}
        />
      </PersonnelModal>

      <PersonnelModal
        open={activeModal === "assistant"}
        title={assistantForm.id ? "Edit Assistant Record" : "Add Assistant Record"}
        subtitle="Create or update the Assistant Protected Area Superintendent record in modal form."
        onClose={closePersonnelModal}
        ui={ui}
      >
        <PersonnelFormCard
          eyebrow="Assistant"
          title={assistantForm.id ? "Assistant Protected Area Superintendent" : "New Assistant Protected Area Superintendent"}
          description="Maintain assistant profile details, photo, notes, and supporting file metadata."
          form={assistantForm}
          errors={assistantErrors}
          onChange={setAssistantForm}
          onPhotoChange={(file) => handlePhotoChange(assistantForm, setAssistantForm, setAssistantErrors, file)}
          onAttachmentChange={(file) => handleFileChange(assistantForm, setAssistantForm, setAssistantErrors, file)}
          onSubmit={() => void submitForm("assistant_pasu", assistantForm, setAssistantErrors, closePersonnelModal)}
          onCancel={closePersonnelModal}
          submitting={submittingSection === "assistant_pasu"}
          canCancel
          ui={ui}
        />
      </PersonnelModal>

      <PersonnelModal
        open={activeModal === "staff"}
        title={staffForm.id ? "Edit Staff Record" : "Add Staff Record"}
        subtitle="Create or update PAMO staff records without leaving the personnel dashboard."
        onClose={closePersonnelModal}
        ui={ui}
      >
        <PersonnelFormCard
          eyebrow="Staff"
          title={staffForm.id ? "PAMO Staff Record" : "New PAMO Staff Record"}
          description="Maintain active or archived staff details, profile photo, notes, and supporting files."
          form={staffForm}
          errors={staffErrors}
          onChange={setStaffForm}
          onPhotoChange={(file) => handlePhotoChange(staffForm, setStaffForm, setStaffErrors, file)}
          onAttachmentChange={(file) => handleFileChange(staffForm, setStaffForm, setStaffErrors, file)}
          onSubmit={() => void submitForm("pamo_staff", staffForm, setStaffErrors, closePersonnelModal)}
          onCancel={closePersonnelModal}
          submitting={submittingSection === "pamo_staff"}
          canCancel
          showStatus
          ui={ui}
        />
      </PersonnelModal>

      <PersonnelModal
        open={activeModal === "former_pasu"}
        title={formerPasuForm.id ? "Edit Former PASU Record" : "Add Former PASU Record"}
        subtitle="Maintain archived PASU records in the same modal-based flow used for active personnel."
        onClose={closePersonnelModal}
        ui={ui}
      >
        <PersonnelFormCard
          eyebrow="Former PASU"
          title={formerPasuForm.id ? "Former Protected Area Superintendent" : "New Former Protected Area Superintendent"}
          description="Keep historical PASU records, supporting files, and photos accessible without inline page forms."
          form={formerPasuForm}
          errors={formerPasuErrors}
          onChange={setFormerPasuForm}
          onPhotoChange={(file) => handlePhotoChange(formerPasuForm, setFormerPasuForm, setFormerPasuErrors, file)}
          onAttachmentChange={(file) => handleFileChange(formerPasuForm, setFormerPasuForm, setFormerPasuErrors, file)}
          onSubmit={() => void submitForm("former_pasu", formerPasuForm, setFormerPasuErrors, closePersonnelModal)}
          onCancel={closePersonnelModal}
          submitting={submittingSection === "former_pasu"}
          canCancel
          ui={ui}
        />
      </PersonnelModal>
    </section>
  );
}
