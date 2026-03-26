"use client";

import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import {
  DocumentsProvider,
  type DocumentRow,
  useDocuments,
} from "@/app/components/DocumentsProvider";
import { useProtectedTheme } from "@/app/components/ProtectedThemeProvider";
import { supabaseBrowser } from "@/app/lib/supabaseClient";
import { motion } from "framer-motion";
import { repoTheme } from "@/app/lib/repoTheme";
import {
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
  CalendarDaysIcon,
  TagIcon,
  FolderIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

type Category = "Academe" | "Stakeholder" | "PAMO Activity";
type FoldersState = { academe: string[]; stakeholders: string[]; pamo: string[] };

const TEMP_BUCKET = "temp-uploads";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const DIRECT_UPLOAD_THRESHOLD = 4 * 1024 * 1024; // 4 MB Vercel-safe threshold
const USE_DIRECT_UPLOAD = process.env.NEXT_PUBLIC_USE_DIRECT_UPLOAD !== "false";

function initials(name: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const v = bytes / Math.pow(k, i);
  return `${v.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function safeArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x) => typeof x === "string").map((x) => x.trim()).filter(Boolean)
    : [];
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-() ]+/g, "_");
}

function getFolderStateKey(category: string): keyof FoldersState {
  if (category === "Stakeholder" || category === "Stakeholders") {
    return "stakeholders";
  }

  if (category === "PAMO Activity") {
    return "pamo";
  }

  return "academe";
}

function shouldUseDirectUpload(fileSize: number) {
  return USE_DIRECT_UPLOAD && fileSize <= DIRECT_UPLOAD_THRESHOLD;
}

function emptyFoldersState(): FoldersState {
  return {
    academe: [],
    stakeholders: [],
    pamo: [],
  };
}

function Skeleton({
  className,
  dark,
}: {
  className: string;
  dark: boolean;
}) {
  return (
    <div
      className={`animate-pulse rounded-2xl ${
        dark ? "bg-white/10" : "bg-slate-200"
      } ${className}`}
    />
  );
}

function UploadPageContent() {
  const router = useRouter();
  const { user: me, loading: loadingMe } = useAuth();
  const { refreshDocuments, upsertDocument } = useDocuments();

  const { theme: pageTheme } = useProtectedTheme();

  const [category, setCategory] = useState<Category>("Academe");
  const [title, setTitle] = useState("");
  const [dateReceived, setDateReceived] = useState("");

  const [folders, setFolders] = useState<FoldersState>(emptyFoldersState);
  const [loadedFolderGroups, setLoadedFolderGroups] = useState<
    Record<keyof FoldersState, boolean>
  >({
    academe: false,
    stakeholders: false,
    pamo: false,
  });
  const [loadingFolders, setLoadingFolders] = useState(true);

  const [selectedFolder, setSelectedFolder] = useState("");
  const [newFolder, setNewFolder] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadDetail, setUploadDetail] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);

  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("Something went wrong.");

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (loadingMe) return;

    if (!me) {
      router.replace("/login");
      return;
    }

    if (me.role !== "admin" && me.role !== "co_admin") {
      router.replace("/dashboard");
    }
  }, [loadingMe, me, router]);

  const fetchFolders = useCallback(async (
    requestedCategory?: string,
    signal?: AbortSignal
  ) => {
    const query = requestedCategory
      ? `?category=${encodeURIComponent(requestedCategory)}`
      : "";

    const r = await fetch(`/api/folders${query}`, {
      credentials: "include",
      cache: "no-store",
      signal,
    });

    const data = r.ok ? await r.json() : null;

    if (requestedCategory) {
      const folderKey = getFolderStateKey(requestedCategory);

      setFolders((current) => ({
        ...current,
        [folderKey]: safeArray(
          folderKey === "stakeholders"
            ? data?.stakeholders ?? data?.stakeholder
            : data?.[folderKey]
        ),
      }));

      setLoadedFolderGroups((current) => ({
        ...current,
        [folderKey]: true,
      }));

      return;
    }

    setFolders({
      academe: safeArray(data?.academe),
      stakeholders: safeArray(data?.stakeholders ?? data?.stakeholder),
      pamo: safeArray(data?.pamo),
    });
    setLoadedFolderGroups({
      academe: true,
      stakeholders: true,
      pamo: true,
    });
  }, []);

  useEffect(() => {
    if (loadingMe) return;
    if (!me) return;
    if (me.role !== "admin" && me.role !== "co_admin") return;

    const folderKey = getFolderStateKey(category);
    if (loadedFolderGroups[folderKey]) {
      setLoadingFolders(false);
      return;
    }

    const controller = new AbortController();

    async function loadFolders() {
      try {
        setLoadingFolders(true);
        await fetchFolders(category, controller.signal);
      } catch (err: unknown) {
        if (isAbortError(err)) return;

        setFolders((current) => ({
          ...current,
          [folderKey]: [],
        }));
      } finally {
        if (!controller.signal.aborted) {
          setLoadingFolders(false);
        }
      }
    }

    loadFolders();

    return () => controller.abort();
  }, [loadingMe, me, fetchFolders, category, loadedFolderGroups]);

  useEffect(() => {
    setSelectedFolder("");
    setNewFolder("");
  }, [category]);

  const year = useMemo(() => {
    if (!dateReceived) return "";
    const d = new Date(dateReceived);
    if (isNaN(d.getTime())) return "";
    return String(d.getFullYear());
  }, [dateReceived]);

  const finalFolder = useMemo(
    () => (newFolder.trim() || selectedFolder).trim(),
    [newFolder, selectedFolder]
  );

  const folderLabel = useMemo(() => {
    if (category === "Stakeholder") return "Stakeholder Name";
    if (category === "PAMO Activity") return "Activity Group";
    return "School / Project";
  }, [category]);

  const folderPlaceholder = useMemo(() => {
    if (category === "Stakeholder") return "Example: PAMB / LGU / DENR / NGO";
    if (category === "PAMO Activity") return "Example: BMS / Patrol / Monitoring / Training";
    return "Example: University of Mindanao";
  }, [category]);

  const folderOptions = useMemo(() => {
    if (category === "Stakeholder") return folders.stakeholders;
    if (category === "PAMO Activity") return folders.pamo;
    return folders.academe;
  }, [category, folders]);

  const folderRequired = category === "Stakeholder" || category === "PAMO Activity";
  const fileSize = file?.size ?? 0;
  const fileType = file?.type || "unknown";
  const useDirectUploadForSelectedFile = file
    ? shouldUseDirectUpload(file.size)
    : false;

  const requiredOk = useMemo(() => {
    if (!title.trim()) return false;
    if (!dateReceived) return false;
    if (!file) return false;
    if (folderRequired && !finalFolder) return false;
    return true;
  }, [title, dateReceived, file, folderRequired, finalFolder]);

  function pickFile() {
    inputRef.current?.click();
  }

  function clearFile() {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function resetForm() {
    setTitle("");
    setDateReceived("");
    setSelectedFolder("");
    setNewFolder("");
    setFile(null);
    setUploadStage("");
    setUploadDetail("");
    setUploadPercent(0);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function onFileSelected(f: File | null) {
    if (!f) {
      setFile(null);
      return;
    }

    if (f.size > MAX_FILE_SIZE) {
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setErrorMsg("File is too large. Maximum allowed file size is 50 MB.");
      setErrorOpen(true);
      return;
    }

    setFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFileSelected(f);
  }

  function addFolderOption(categoryName: string, folderName: string) {
    const cleanFolder = folderName.trim();
    if (!cleanFolder) return;

    const folderKey = getFolderStateKey(categoryName);

    setFolders((current) => {
      const nextFolders = current[folderKey];
      if (nextFolders.includes(cleanFolder)) {
        return current;
      }

      return {
        ...current,
        [folderKey]: [...nextFolders, cleanFolder].sort((a, b) =>
          a.localeCompare(b)
        ),
      };
    });

    setLoadedFolderGroups((current) => ({
      ...current,
      [folderKey]: true,
    }));
  }

  async function finalizeSuccessfulUpload({
    document,
    resolvedCategory,
    resolvedFolder,
    refreshAfterSuccess,
  }: {
    document?: DocumentRow | null;
    resolvedCategory: string;
    resolvedFolder: string;
    refreshAfterSuccess: boolean;
  }) {
    setUploadPercent(97);
    setUploadStage("Finalizing upload");
    setUploadDetail("Refreshing repository data and preparing success response.");

    if (refreshAfterSuccess) {
      try {
        setLoadingFolders(true);
        await Promise.all([fetchFolders(resolvedCategory), refreshDocuments()]);
      } catch (refreshErr) {
        console.error("POST-UPLOAD REFRESH ERROR:", refreshErr);
      } finally {
        setLoadingFolders(false);
      }
    } else {
      if (document) {
        upsertDocument(document);
      } else {
        await refreshDocuments();
      }

      if (resolvedFolder) {
        addFolderOption(resolvedCategory, resolvedFolder);
      }
    }

    await wait(250);

    setUploadPercent(100);
    setUploadStage("Upload complete");
    setUploadDetail("Your document has been uploaded successfully.");

    await wait(300);

    setSuccessOpen(true);
  }

  async function uploadViaDirectRoute(fileToUpload: File, folderValue: string) {
    setUploadPercent(15);
    setUploadStage("Uploading to server");
    setUploadDetail("Sending file to the server for direct Google Drive upload.");

    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("category", category);
    formData.append("title", title.trim());
    formData.append("dateReceived", dateReceived);
    formData.append("folder", folderValue);
    formData.append("year", year || new Date().getFullYear().toString());

    setUploadPercent(38);
    setUploadStage("Processing upload...");
    setUploadDetail("Uploading and saving file...");

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const uploadData = await uploadRes.json().catch(() => null);

    if (!uploadRes.ok) {
      throw new Error(uploadData?.error || "Failed to upload document.");
    }

    await finalizeSuccessfulUpload({
      document: uploadData?.document ?? null,
      resolvedCategory: uploadData?.category || category,
      resolvedFolder: uploadData?.folder || folderValue,
      refreshAfterSuccess: false,
    });
  }

  async function uploadViaLegacyTransfer(fileToUpload: File, folderValue: string) {
    const safeFileName = sanitizeFileName(fileToUpload.name);
    const uniqueId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const tempPath = `${me?.id || "user"}/${uniqueId}-${safeFileName}`;

    console.log("DIRECT TEMP UPLOAD:", {
      tempPath,
      fileName: fileToUpload.name,
      size: fileToUpload.size,
      type: fileToUpload.type,
    });

    await wait(200);

    setUploadPercent(15);
    setUploadStage("Uploading to temporary storage");
    setUploadDetail("Sending file directly to Supabase temporary storage.");

    const rotatingStages = [
      {
        percent: 30,
        title: "Staging upload",
        detail: "Temporary file is being prepared for transfer.",
      },
      {
        percent: 55,
        title: "Transferring to Google Drive",
        detail: "Moving the uploaded file to permanent cloud storage.",
      },
      {
        percent: 80,
        title: "Saving repository record",
        detail: "Saving file details to the repository database.",
      },
      {
        percent: 92,
        title: "Cleaning temporary storage",
        detail: "Removing the staged file after transfer.",
      },
    ];

    let idx = 0;
    const applyStage = () => {
      const s = rotatingStages[Math.min(idx, rotatingStages.length - 1)];
      setUploadPercent(s.percent);
      setUploadStage(s.title);
      setUploadDetail(s.detail);
      idx += 1;
    };

    const { error: tempUploadError } = await supabaseBrowser.storage
      .from(TEMP_BUCKET)
      .upload(tempPath, fileToUpload, {
        cacheControl: "3600",
        upsert: false,
        contentType: fileToUpload.type || "application/octet-stream",
      });

    if (tempUploadError) {
      console.error("DIRECT TEMP UPLOAD ERROR:", tempUploadError);
      throw new Error(
        tempUploadError.message || "Failed to upload temporary file."
      );
    }

    applyStage();
    const stageTimer = setInterval(() => {
      if (idx < rotatingStages.length) {
        applyStage();
      }
    }, 1100);

    try {
      const transferRes = await fetch("/api/transfer-to-drive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          tempPath,
          originalName: fileToUpload.name,
          mimeType: fileToUpload.type || "application/octet-stream",
          fileSize: fileToUpload.size,
          category,
          title: title.trim(),
          dateReceived,
          folder: folderValue,
          year: year || new Date().getFullYear().toString(),
        }),
      });

      const transferData = await transferRes.json().catch(() => null);

      if (!transferRes.ok) {
        throw new Error(
          transferData?.error || "Failed to transfer file to Google Drive."
        );
      }

      await finalizeSuccessfulUpload({
        resolvedCategory: transferData?.category || category,
        resolvedFolder: transferData?.folder || folderValue,
        refreshAfterSuccess: true,
      });
    } finally {
      clearInterval(stageTimer);
    }
  }

  async function handleUpload() {
    if (uploading) return;

    if (!file) {
      setErrorMsg("Please select a file.");
      setErrorOpen(true);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg("File is too large. Maximum allowed file size is 50 MB.");
      setErrorOpen(true);
      return;
    }

    if (!title.trim()) {
      setErrorMsg("Document title is required.");
      setErrorOpen(true);
      return;
    }

    if (!dateReceived) {
      setErrorMsg("Date received is required.");
      setErrorOpen(true);
      return;
    }

    if (folderRequired && !finalFolder) {
      setErrorMsg(
        category === "Stakeholder"
          ? "Please enter stakeholder name."
          : "Please enter activity group."
      );
      setErrorOpen(true);
      return;
    }

    setUploading(true);
    setUploadPercent(5);
    setUploadStage("Preparing upload");
    setUploadDetail(
      useDirectUploadForSelectedFile
        ? "Checking required fields and preparing direct server upload."
        : "Checking required fields and preparing temporary storage."
    );

    try {
      if (shouldUseDirectUpload(file.size)) {
        await uploadViaDirectRoute(file, finalFolder);
      } else {
        await uploadViaLegacyTransfer(file, finalFolder);
      }
    } catch (err: unknown) {
      console.error("UPLOAD PAGE ERROR:", err);

      setUploadPercent(0);
      setUploadStage("Upload failed");
      const message = getErrorMessage(err, "Upload failed. Please try again.");
      setUploadDetail(message);
      setErrorMsg(message);
      setErrorOpen(true);
    } finally {
      setUploading(false);
    }
  }

  const dark = pageTheme === "dark";
  const ui = repoTheme(pageTheme);
  const inputBase = `${ui.input} mt-2 pl-4`;
  const sectionCard = `${ui.card} overflow-hidden`;

  if (loadingMe) {
    return (
      <div className={`${ui.page} p-4 sm:p-6 md:p-10 min-h-full`}>
        <div className="max-w-[1250px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`h-14 w-14 rounded-3xl grid place-items-center ${
                  dark
                    ? "bg-cyan-400/12 border border-cyan-300/20 text-cyan-100"
                    : "bg-cyan-50 border border-cyan-200 text-cyan-700"
                }`}
              >
                <ArrowUpTrayIcon className="w-7 h-7" />
              </div>

              <div>
                <Skeleton className="h-10 w-64" dark={dark} />
                <Skeleton className="h-4 w-80 mt-3 rounded-full" dark={dark} />
              </div>
            </div>

            <div
              className={`hidden md:flex items-center gap-3 rounded-3xl px-4 py-3 ${
                dark
                  ? "bg-white/[0.05] border border-cyan-300/12"
                  : "bg-white border border-slate-200"
              }`}
            >
              <Skeleton className="h-11 w-11 rounded-full" dark={dark} />
              <div className="min-w-0">
                <Skeleton className="h-4 w-28" dark={dark} />
                <Skeleton className="h-3 w-40 mt-2 rounded-full" dark={dark} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 mt-6">
            <div className={`lg:col-span-3 ${sectionCard}`}>
              <div
                className={`p-4 sm:p-5 border-b ${
                  dark ? "border-cyan-300/12 bg-white/[0.03]" : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-11 w-11 rounded-2xl grid place-items-center ${
                      dark
                        ? "bg-cyan-400/10 border border-cyan-300/15 text-cyan-100"
                        : "bg-cyan-50 border border-cyan-200 text-cyan-700"
                    }`}
                  >
                    <DocumentArrowUpIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <Skeleton className="h-5 w-40" dark={dark} />
                    <Skeleton className="h-3 w-56 mt-2 rounded-full" dark={dark} />
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <Skeleton className="h-24 w-full" dark={dark} />
                  <Skeleton className="h-24 w-full" dark={dark} />
                </div>

                <Skeleton className="h-20 w-full" dark={dark} />
                <Skeleton className="h-28 w-full" dark={dark} />
                <Skeleton className="h-48 w-full" dark={dark} />
                <Skeleton className="h-14 w-full rounded-2xl" dark={dark} />
                <Skeleton className="h-4 w-44 rounded-full" dark={dark} />
              </div>
            </div>

            <div className={`lg:col-span-2 ${sectionCard}`}>
              <div
                className={`p-4 sm:p-5 border-b ${
                  dark ? "border-cyan-300/12 bg-white/[0.03]" : "border-slate-200 bg-slate-50"
                }`}
              >
                <Skeleton className="h-5 w-36" dark={dark} />
                <Skeleton className="h-3 w-52 mt-2 rounded-full" dark={dark} />
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <Skeleton className="h-20 w-full" dark={dark} />
                <Skeleton className="h-20 w-full" dark={dark} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Skeleton className="h-20 w-full" dark={dark} />
                  <Skeleton className="h-20 w-full" dark={dark} />
                </div>
                <Skeleton className="h-20 w-full" dark={dark} />
                <Skeleton className="h-24 w-full" dark={dark} />
                <Skeleton className="h-28 w-full" dark={dark} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!me) return null;
  if (me.role !== "admin" && me.role !== "co_admin") return null;

  return (
    <div className={`${ui.page} p-4 sm:p-6 md:p-10 min-h-full`}>
      <ConfirmDialog
        open={successOpen}
        title="Upload Complete"
        message="Your document has been saved successfully to the repository."
        confirmText="Go to Dashboard"
        oneButton
        variant="success"
        details={[
          { label: "Category", value: category },
          { label: "Year", value: year || "—" },
          { label: folderLabel, value: finalFolder || "—" },
        ]}
        onConfirm={() => {
          setSuccessOpen(false);
          resetForm();
          router.push("/dashboard");
        }}
      />

      <ConfirmDialog
        open={errorOpen}
        title="Upload Failed"
        message={errorMsg}
        confirmText="OK"
        oneButton
        variant="warning"
        onConfirm={() => setErrorOpen(false)}
      />

      <div className="max-w-[1250px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`h-14 w-14 rounded-3xl grid place-items-center shadow-[0_12px_28px_rgba(0,0,0,0.08)] ${
                dark
                  ? "bg-[#d7aa6b]/12 border border-[#d7aa6b]/20 text-[#f0cf97] shadow-[0_0_18px_rgba(215,170,107,0.14)]"
                  : "bg-[#fff3e3] border border-[#f3d6ac] text-[#9d6c26]"
              }`}
            >
              <ArrowUpTrayIcon className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className={`text-3xl md:text-4xl font-bold tracking-tight ${
                    dark
                      ? "text-white drop-shadow-[0_0_12px_rgba(34,211,238,0.12)]"
                      : "text-slate-900"
                  }`}
                >
                  Upload Document
                </h1>
                <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                      dark
                        ? "bg-white/[0.05] text-[#DAF1DE] border-white/10"
                        : "bg-white/55 text-[#235347] border-white/60"
                    }`}
                >
                  Admin Only
                </span>
              </div>
              <p
                className={`mt-2 text-sm ${
                  dark ? "text-cyan-100/70" : "text-slate-600"
                }`}
              >
                Add Academe, Stakeholder, or PAMO Activity records with title and date received.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`hidden md:flex items-center gap-3 rounded-3xl px-4 py-3 ${
                dark
                  ? "bg-white/[0.05] border border-cyan-300/12 shadow-[0_0_20px_rgba(34,211,238,0.08)] backdrop-blur-md"
                  : "bg-white border border-slate-200 shadow-sm"
              }`}
            >
              <div
                className={`h-11 w-11 rounded-full grid place-items-center font-bold ${
                  dark
                    ? "bg-cyan-400/15 border border-cyan-300/20 text-white"
                    : "bg-cyan-100 text-cyan-700 border border-cyan-200"
                }`}
              >
                {initials(me.name)}
              </div>
              <div className="min-w-0">
                <div
                  className={`text-sm font-medium truncate ${
                    dark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {me.name}
                </div>
                <div
                  className={`text-[11px] truncate ${
                    dark ? "text-cyan-100/70" : "text-slate-500"
                  }`}
                >
                  {me.email}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16 }}
            className={`lg:col-span-3 relative ${sectionCard}`}
          >
            <div className={`absolute inset-x-0 top-0 h-2 ${dark ? "bg-[#d7aa6b]/68" : "bg-[#ddb16f]/82"}`} />
            <div
              className={`p-4 sm:p-5 border-b ${
                dark
                  ? "border-white/8 bg-[linear-gradient(90deg,rgba(142,182,155,0.12)_0%,rgba(11,43,38,0.18)_45%,rgba(142,182,155,0.08)_100%)]"
                  : "border-white/50 bg-gradient-to-r from-[#edf6f0] to-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-11 w-11 rounded-2xl grid place-items-center shadow-[0_10px_24px_rgba(0,0,0,0.08)] ${
                    dark
                      ? "bg-[#7ea8d9]/10 border border-[#97bbe4]/18 text-[#c8d8f0]"
                      : "bg-[#edf4fb] border border-[#d7e4f0] text-[#4d6f99]"
                    }`}
                >
                  <DocumentArrowUpIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className={`text-lg font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                    Document Details
                  </div>
                  <div className={`text-[12px] ${dark ? "text-cyan-100/65" : "text-slate-500"}`}>
                    {formatBytes(fileSize)} • {fileType}
                    {fileSize > 20 * 1024 * 1024 && (
                      <span className="block mt-1">
                        Large files may take longer to upload.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`text-sm font-medium flex items-center gap-2 ${
                      dark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    <TagIcon className={`w-4 h-4 ${dark ? "text-[#8EB69B]" : "text-[#235347]"}`} />
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className={`app-clickable-trigger ${inputBase}`}
                  >
                    <option value="Academe">
                      Academe
                    </option>
                    <option value="Stakeholder">
                      Stakeholder
                    </option>
                    <option value="PAMO Activity">
                      PAMO Activity
                    </option>
                  </select>

                  <p className={`mt-2 text-[12px] ${dark ? "text-cyan-100/60" : "text-slate-500"}`}>
                    {category === "Academe"
                      ? "For research studies about Hamiguitan."
                      : category === "Stakeholder"
                      ? "For PAMB/LGU/DENR/NGO letters, reports, assessments."
                      : "For internal PAMO activities, reports, photos, monitoring files."}
                  </p>
                </div>

                <div>
                  <label
                    className={`text-sm font-medium flex items-center gap-2 ${
                      dark ? "text-white" : "text-slate-800"
                    }`}
                  >
                    <CalendarDaysIcon
                      className={`w-4 h-4 ${dark ? "text-[#d7aa6b]" : "text-[#9d6c26]"}`}
                    />
                    Date Received <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateReceived}
                    onChange={(e) => setDateReceived(e.target.value)}
                    className={`app-clickable-trigger ${inputBase}`}
                  />
                  <div className={`mt-2 text-[12px] ${dark ? "text-cyan-100/60" : "text-slate-500"}`}>
                    Auto Year:{" "}
                    <span className={`font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                      {year || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label
                  className={`text-sm font-medium flex items-center gap-2 ${
                    dark ? "text-white" : "text-slate-800"
                  }`}
                >
                    <DocumentTextIcon
                      className={`w-4 h-4 ${dark ? "text-[#c8d8f0]" : "text-[#4d6f99]"}`}
                    />
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputBase}
                  placeholder="Example: Biodiversity Assessment Study / Monitoring Report / Resolution"
                />
              </div>

              <div>
                <label
                  className={`text-sm font-medium flex items-center gap-2 ${
                    dark ? "text-white" : "text-slate-800"
                  }`}
                >
                  <FolderIcon className={`w-4 h-4 ${dark ? "text-[#8EB69B]" : "text-[#235347]"}`} />
                  {folderLabel} {folderRequired && <span className="text-rose-500">*</span>}
                </label>

                <select
                  value={selectedFolder}
                  onChange={(e) => {
                    setSelectedFolder(e.target.value);
                    if (e.target.value) setNewFolder("");
                  }}
                  className={inputBase}
                  disabled={loadingFolders}
                >
                  <option value="">
                    {loadingFolders ? "Loading folders..." : "Select existing folder (optional)"}
                  </option>
                  {folderOptions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>

                <input
                  value={newFolder}
                  onChange={(e) => {
                    setNewFolder(e.target.value);
                    if (e.target.value.trim()) setSelectedFolder("");
                  }}
                  className={classNames(inputBase, "mt-3")}
                  placeholder={`Or type new folder name. ${folderPlaceholder}`}
                />

                <p className={`mt-2 text-[12px] ${dark ? "text-cyan-100/60" : "text-slate-500"}`}>
                  If you type a new folder, it will override the dropdown.
                </p>
              </div>

              <div>
                <label className={`text-sm font-medium ${dark ? "text-white" : "text-slate-800"}`}>
                  Upload File <span className="text-rose-500">*</span>
                </label>

                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOver(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOver(false);
                  }}
                  onDrop={onDrop}
                  className={classNames(
                    "mt-2 rounded-3xl border-2 border-dashed p-6 transition",
                    dark
                      ? dragOver
                        ? "border-cyan-300/40 bg-cyan-400/8 shadow-[0_0_25px_rgba(34,211,238,0.10)]"
                        : "border-cyan-300/18 bg-white/[0.03]"
                      : dragOver
                      ? "border-cyan-400 bg-cyan-50 shadow-sm"
                      : "border-slate-300 bg-slate-50"
                  )}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => onFileSelected(e.target.files?.[0] || null)}
                  />

                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div
                        className={`h-14 w-14 rounded-2xl grid place-items-center shadow-[0_10px_24px_rgba(0,0,0,0.08)] ${
                          dark
                            ? "bg-[#d7aa6b]/12 border border-[#d7aa6b]/18 text-[#f0cf97]"
                            : "bg-[#fff3e3] border border-[#f3d6ac] text-[#9d6c26]"
                        }`}
                    >
                      <ArrowUpTrayIcon className="w-7 h-7" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-semibold text-lg sm:text-xl leading-tight ${
                          dark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        Drag & drop your file here
                      </div>
                      <div className={`text-sm mt-1 ${dark ? "text-cyan-100/70" : "text-slate-600"}`}>
                        or{" "}
                        <button
                          type="button"
                          onClick={pickFile}
                          className={`app-clickable font-semibold underline underline-offset-4 ${
                            dark ? "text-[#f0cf97] hover:text-[#f6ddb0]" : "text-[#9d6c26] hover:text-[#83581d]"
                          }`}
                        >
                          browse
                        </button>{" "}
                        to choose a file.
                      </div>

                      {file && (
                        <div
                          className={`mt-4 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${
                            dark
                              ? "bg-white/[0.05] border border-white/10"
                              : "bg-white border border-white/60"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className={`font-medium truncate ${dark ? "text-white" : "text-slate-900"}`}>
                              {file.name}
                            </div>
                            <div className={`text-[12px] ${dark ? "text-cyan-100/65" : "text-slate-500"}`}>
                              {formatBytes(file.size)} • {file.type || "unknown"}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={clearFile}
                            className={`app-clickable-icon h-11 w-11 rounded-xl grid place-items-center ${
                              dark
                                ? "border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-[#DAF1DE]"
                                : "border border-white/60 bg-white/75 hover:bg-white text-[#5d6c80]"
                            }`}
                            title="Remove file"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <p className={`mt-3 text-[12px] ${dark ? "text-cyan-100/65" : "text-slate-500"}`}>
                  Files up to 4 MB use direct server upload. Larger files use the compatibility upload path.
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || !requiredOk}
                  className={classNames(
                    "w-full min-h-11 inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl transition-all duration-200 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none",
                    ui.buttonPrimary
                  )}
                >
                  <DocumentArrowUpIcon className="w-5 h-5" />
                  {uploading ? uploadStage || "Uploading..." : "Upload Document"}
                </button>

                {uploading && (
                  <div
                    className={`mt-4 rounded-3xl p-4 ${
                      dark
                        ? "border border-[#d7aa6b]/20 bg-[#d7aa6b]/8"
                        : "border border-[#f3d6ac] bg-[#fff3e3]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 h-4 w-4 rounded-full border-2 animate-spin ${
                          dark
                            ? "border-[#f0cf97] border-t-transparent"
                            : "border-[#9d6c26] border-t-transparent"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                            {uploadStage || "Uploading document"}
                          </p>
                          <span className={`text-[11px] font-semibold ${dark ? "text-[#f0cf97]/85" : "text-[#9d6c26]"}`}>
                            {uploadPercent}%
                          </span>
                        </div>

                        <p className={`mt-1 text-[12px] leading-5 ${dark ? "text-[#f6ddb0]/80" : "text-[#8a6a33]"}`}>
                          {uploadDetail || "Please wait while your document is being processed."}
                        </p>

                        <div className={`mt-3 h-2 w-full overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-[#f7e9cf]"}`}>
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              dark ? "bg-[#f0cf97]" : "bg-[#9d6c26]"
                            }`}
                            style={{ width: `${uploadPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`text-[12px] ${dark ? "text-cyan-100/60" : "text-slate-500"}`}>
                Fields with <span className="text-rose-500 font-bold">*</span> are required.
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, delay: 0.02 }}
            className={`lg:col-span-2 relative ${sectionCard}`}
          >
            <div className={`absolute inset-x-0 top-0 h-2 ${dark ? "bg-[#7ea8d9]/58" : "bg-[#97bbe4]/72"}`} />
            <div
              className={`p-4 sm:p-5 border-b ${
                dark ? "border-cyan-300/12 bg-white/[0.03]" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className={`text-lg font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                Preview Summary
              </div>
              <div className={`text-[12px] mt-1 ${dark ? "text-cyan-100/65" : "text-slate-500"}`}>
                This is what will be saved in the repository.
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div
                className={`rounded-3xl p-4 ${
                  dark ? "border border-cyan-300/10 bg-white/[0.03]" : "border border-slate-200 bg-slate-50"
                }`}
              >
                <div className={`text-[12px] ${dark ? "text-cyan-100/60" : "text-slate-500"}`}>
                  Category
                </div>
                <div
                  className={`mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    dark
                      ? "bg-cyan-400/10 text-cyan-100 border-cyan-300/18"
                      : "bg-cyan-50 text-cyan-700 border-cyan-200"
                  }`}
                >
                  {category}
                </div>
              </div>

              <div
                className={`rounded-3xl p-4 ${
                  dark ? "border border-cyan-300/10 bg-white/[0.03]" : "border border-slate-200 bg-slate-50"
                }`}
              >
                <div className={`text-[12px] ${dark ? "text-cyan-100/60" : "text-slate-500"}`}>
                  Title
                </div>
                <div className={`mt-2 text-sm font-medium break-words ${dark ? "text-white" : "text-slate-900"}`}>
                  {title.trim() || "—"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className={`rounded-3xl p-4 ${
                    dark ? "border border-cyan-300/10 bg-white/[0.03]" : "border border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className={`text-[12px] ${dark ? "text-cyan-100/60" : "text-slate-500"}`}>
                    Date Received
                  </div>
                  <div className={`mt-2 text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                    {dateReceived || "—"}
                  </div>
                </div>
                <div
                  className={`rounded-3xl p-4 ${
                    dark ? "border border-cyan-300/10 bg-white/[0.03]" : "border border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className={`text-[12px] ${dark ? "text-cyan-100/60" : "text-slate-500"}`}>
                    Year
                  </div>
                  <div className={`mt-2 text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                    {year || "—"}
                  </div>
                </div>
              </div>

              <div
                className={`rounded-3xl p-4 ${
                  dark ? "border border-cyan-300/10 bg-white/[0.03]" : "border border-slate-200 bg-slate-50"
                }`}
              >
                <div className={`text-[12px] ${dark ? "text-cyan-100/60" : "text-slate-500"}`}>
                  {folderLabel}
                </div>
                <div className={`mt-2 text-sm font-medium break-words ${dark ? "text-white" : "text-slate-900"}`}>
                  {finalFolder || "—"}
                </div>
              </div>

              <div
                className={`rounded-3xl p-4 ${
                  dark ? "border border-cyan-300/10 bg-white/[0.03]" : "border border-slate-200 bg-slate-50"
                }`}
              >
                <div className={`text-[12px] ${dark ? "text-cyan-100/60" : "text-slate-500"}`}>
                  File
                </div>
                <div className={`mt-2 text-sm font-medium break-words ${dark ? "text-white" : "text-slate-900"}`}>
                  {file?.name || "—"}
                </div>
                {file && (
                  <div className={`text-[12px] mt-1 ${dark ? "text-cyan-100/65" : "text-slate-500"}`}>
                    {formatBytes(file.size)} • {file.type || "unknown"}
                  </div>
                )}
              </div>

              <div
                className={`rounded-3xl p-4 ${
                  dark
                    ? "border border-emerald-300/15 bg-emerald-400/8"
                    : "border border-emerald-200 bg-emerald-50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <CheckCircleIcon
                    className={`w-5 h-5 mt-0.5 ${dark ? "text-emerald-300" : "text-emerald-600"}`}
                  />
                  <div>
                    <div className={`text-base font-semibold ${dark ? "text-emerald-200" : "text-emerald-700"}`}>
                      Tip
                    </div>
                    <div
                      className={`text-[12px] mt-1 leading-6 ${
                        dark ? "text-emerald-100/85" : "text-emerald-700/90"
                      }`}
                    >
                      Use consistent folder names (e.g., <b>PAMB</b>, <b>DENR</b>, <b>LGU</b>, <b>UM</b>, <b>BMS</b>) so the Documents page groups files nicely.
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`rounded-3xl p-4 ${
                  dark
                    ? "border border-amber-300/15 bg-amber-400/8"
                    : "border border-amber-200 bg-amber-50"
                }`}
              >
                <div className={`text-[12px] ${dark ? "text-amber-100/85" : "text-amber-700"}`}>
                  Upload limit: <span className="font-semibold">50 MB maximum per file</span>
                </div>
              </div>

              {!requiredOk && (
                <div
                  className={`text-[12px] rounded-2xl p-3 ${
                    dark
                      ? "text-rose-200 bg-rose-500/10 border border-rose-300/15"
                      : "text-rose-700 bg-rose-50 border border-rose-200"
                  }`}
                >
                  Please complete required fields before uploading.
                </div>
              )}

              {loadingFolders && (
                <div
                  className={`text-[12px] rounded-2xl p-3 ${
                    dark
                      ? "text-cyan-100/80 bg-cyan-400/10 border border-cyan-300/15"
                      : "text-cyan-700 bg-cyan-50 border border-cyan-200"
                  }`}
                >
                  Loading folder list...
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <DocumentsProvider>
      <UploadPageContent />
    </DocumentsProvider>
  );
}
