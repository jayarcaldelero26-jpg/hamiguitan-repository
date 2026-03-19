"use client";

import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useAuth } from "@/app/components/AuthProvider";

import {
  DocumentsProvider,
  useDocuments,
  type DocumentRow,
} from "@/app/components/DocumentsProvider";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrashIcon,
  CloudArrowDownIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilSquareIcon,
  XMarkIcon,
  Squares2X2Icon,
  ClockIcon,
  DocumentTextIcon,
  FolderIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { repoTheme } from "@/app/lib/repoTheme";
import { useProtectedTheme } from "@/app/components/ProtectedThemeProvider";

function initials(name: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (a + b).toUpperCase();
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toISOString().slice(0, 10);
}

function viewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

function downloadUrl(fileId: string) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

function normalizeCat(cat?: string | null) {
  const c = (cat || "").toLowerCase().trim();
  if (c === "stakeholders" || c === "stakeholder") return "stakeholder";
  if (c === "academe") return "academe";
  if (
    c === "pamo activity" ||
    c === "pamo" ||
    c === "activity" ||
    c === "activities"
  ) {
    return "pamo";
  }
  return c || "other";
}

function typeLabel(mime?: string | null) {
  const t = (mime || "").toLowerCase();
  if (!t) return "File";
  if (t.includes("pdf")) return "PDF";
  if (t.includes("spreadsheet") || t.includes("excel")) return "Spreadsheet";
  if (t.includes("word")) return "Word";
  if (t.includes("presentation") || t.includes("powerpoint")) return "Slides";
  if (t.includes("image/")) return "Image";
  return "File";
}

function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const ms = d.getTime();
  if (isNaN(ms)) return "—";

  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;

  return fmtDate(iso);
}

function canDeleteDocuments(role?: string) {
  return role === "admin";
}

function canManageDocuments(role?: string) {
  return role === "admin" || role === "co_admin";
}

function categoryLabel(value?: string | null) {
  const c = normalizeCat(value);
  if (c === "stakeholder") return "Stakeholders";
  if (c === "pamo") return "PAMO Activity";
  return "Academe";
}

function SkeletonBlock({
  className,
  dark,
}: {
  className: string;
  dark: boolean;
}) {
  return (
    <div
      className={`animate-pulse rounded-2xl ${
        dark ? "bg-white/10" : "bg-[#235347]/10"
      } ${className}`}
    />
  );
}

function StatSkeleton({ dark }: { dark: boolean }) {
  const ui = repoTheme(dark ? "dark" : "light");

  return (
    <div className={`${ui.card} p-5 sm:p-6`}>
      <SkeletonBlock dark={dark} className="h-3 w-24 rounded-full" />
      <SkeletonBlock dark={dark} className="h-11 w-24 mt-4" />
      <div className="mt-5 flex flex-wrap gap-2">
        <SkeletonBlock dark={dark} className="h-7 w-24 rounded-full" />
        <SkeletonBlock dark={dark} className="h-7 w-24 rounded-full" />
        <SkeletonBlock dark={dark} className="h-7 w-24 rounded-full" />
      </div>
    </div>
  );
}

function RecentUploadsSkeleton({ dark }: { dark: boolean }) {
  const ui = repoTheme(dark ? "dark" : "light");

  return (
    <div className={`${ui.card} p-5 sm:p-6`}>
      <div className="flex items-center justify-between">
        <SkeletonBlock dark={dark} className="h-6 w-32" />
        <SkeletonBlock dark={dark} className="h-4 w-14 rounded-full" />
      </div>

      <div className="mt-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`rounded-[24px] px-4 py-4 ${
              dark
                ? "bg-white/[0.035]"
                : "bg-white/45"
            }`}
          >
            <SkeletonBlock dark={dark} className="h-4 w-2/3" />
            <div className="mt-3 flex flex-wrap gap-2">
              <SkeletonBlock dark={dark} className="h-6 w-20 rounded-full" />
              <SkeletonBlock dark={dark} className="h-6 w-16 rounded-full" />
              <SkeletonBlock dark={dark} className="h-6 w-20 rounded-full" />
            </div>
            <SkeletonBlock
              dark={dark}
              className="h-3 w-24 mt-4 rounded-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TableRowsSkeleton({ dark }: { dark: boolean }) {
  return (
    <div className={dark ? "divide-y divide-white/8" : "divide-y divide-white/50"}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="px-4 py-4 lg:px-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr_260px] gap-4 items-start">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <SkeletonBlock
                  dark={dark}
                  className="h-10 w-10 rounded-xl shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <SkeletonBlock dark={dark} className="h-4 w-2/3" />
                  <SkeletonBlock
                    dark={dark}
                    className="h-3 w-1/2 mt-2 rounded-full"
                  />
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="flex flex-wrap items-center gap-2">
                <SkeletonBlock dark={dark} className="h-6 w-20 rounded-full" />
                <SkeletonBlock dark={dark} className="h-6 w-24 rounded-full" />
                <SkeletonBlock dark={dark} className="h-6 w-14 rounded-full" />
              </div>
            </div>

            <div className="space-y-2">
              <SkeletonBlock dark={dark} className="h-3 w-28 rounded-full" />
              <SkeletonBlock dark={dark} className="h-3 w-36 rounded-full" />
            </div>

            <div className="flex lg:justify-end gap-2 flex-nowrap">
              <SkeletonBlock dark={dark} className="h-8 w-16 rounded-xl" />
              <SkeletonBlock dark={dark} className="h-8 w-24 rounded-xl" />
              <SkeletonBlock dark={dark} className="h-8 w-20 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Pill({
  children,
  dark,
  tone = "cyan",
}: {
  children: React.ReactNode;
  dark: boolean;
  tone?: "cyan" | "emerald" | "indigo" | "amber" | "slate";
}) {
  const ui = repoTheme(dark ? "dark" : "light");

  const cls =
    tone === "emerald"
      ? ui.pillGreen
      : tone === "indigo"
      ? ui.pillBlue
      : tone === "amber"
      ? ui.pillAmber
      : ui.pill;

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${cls}`}>
      {children}
    </span>
  );
}

function DashboardStatCard({
  eyebrow,
  value,
  description,
  accent,
  iconTone,
  iconCapsule,
  icon,
  meta,
  dark,
}: {
  eyebrow: string;
  value: string;
  description: string;
  accent: string;
  iconTone: string;
  iconCapsule: string;
  icon: React.ReactNode;
  meta?: React.ReactNode;
  dark: boolean;
}) {
  const ui = repoTheme(dark ? "dark" : "light");
  const textMain = ui.textMain;
  const textMuted = ui.textMuted;
  const textSoft = ui.textSoft;

  return (
    <div className={`${ui.card} relative overflow-hidden p-5 sm:p-6 md:p-7`}>
      <div className={`absolute inset-x-0 top-0 h-2 ${accent}`} />
      <div
        className={`pointer-events-none absolute inset-x-6 top-0 h-20 rounded-b-[32px] blur-xl md:blur-2xl ${
          dark ? "opacity-35" : "opacity-60"
        } ${accent}`}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className={`text-[11px] uppercase tracking-[0.18em] font-semibold ${textSoft}`}>
              {eyebrow}
            </div>
            <div className={`mt-3 text-3xl md:text-[2.6rem] font-semibold tracking-tight ${textMain}`}>
              {value}
            </div>
            <div className={`mt-2 text-sm leading-6 ${textMuted}`}>{description}</div>
          </div>

          <div
            className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${iconCapsule}`}
          >
            <span className={iconTone}>{icon}</span>
          </div>
        </div>

        {meta ? <div className="mt-5 flex flex-wrap gap-2">{meta}</div> : null}
      </div>
    </div>
  );
}

const fadeUpDelayed = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, delay },
});

function DashboardContent() {
  const { user, loading: loadingUser } = useAuth();
  const {
    documents: docs = [],
    loading: loadingDocs,
    refreshDocuments,
  } = useDocuments();

  const { theme: pageTheme } = useProtectedTheme();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "academe" | "stakeholder" | "pamo"
  >("all");

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState("Success");
  const [successMsg, setSuccessMsg] = useState("Action completed successfully.");
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("Something went wrong.");
  const [previewDoc, setPreviewDoc] = useState<DocumentRow | null>(null);
  const [editDoc, setEditDoc] = useState<DocumentRow | null>(null);
  const [editCategory, setEditCategory] = useState("Academe");
  const [editTitle, setEditTitle] = useState("");
  const [editDateReceived, setEditDateReceived] = useState("");
  const [editSelectedFolder, setEditSelectedFolder] = useState("");
  const [editNewFolder, setEditNewFolder] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const stats = useMemo(() => {
    const total = docs.length;
    const byType: Record<string, number> = {};
    let academe = 0;
    let stake = 0;
    let pamo = 0;

    for (const d of docs) {
      const label = typeLabel(d.type);
      byType[label] = (byType[label] || 0) + 1;

      const c = normalizeCat(d.category);
      if (c === "academe") academe++;
      else if (c === "stakeholder") stake++;
      else if (c === "pamo") pamo++;
    }

    const topEntry = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
    const topType = topEntry?.[0] || "—";
    const topTypeCount = topEntry?.[1] || 0;

    return { total, topType, topTypeCount, academe, stake, pamo };
  }, [docs]);

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();

    return docs.filter((d) => {
      const c = normalizeCat(d.category);
      if (activeTab !== "all" && c !== activeTab) return false;

      if (!q) return true;

      const hay = [
        d.title ?? "",
        d.name ?? "",
        d.type ?? "",
        d.category ?? "",
        d.year ?? "",
        d.folder ?? "",
        d.dateReceived ?? "",
        d.uploadedAt ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [docs, query, activeTab]);

  const recentUploads = useMemo(() => {
    const arr = [...docs];
    arr.sort((a, b) => {
      const da = new Date(a.uploadedAt || 0).getTime();
      const db = new Date(b.uploadedAt || 0).getTime();
      return db - da;
    });
    return arr.slice(0, 3);
  }, [docs]);

  const overview = useMemo(() => {
    const folders = new Set<string>();
    let latestUpload: string | null = null;
    const categoryCounts = [
      { label: "Academe", value: stats.academe },
      { label: "Stakeholders", value: stats.stake },
      { label: "PAMO Activity", value: stats.pamo },
    ];

    for (const d of docs) {
      if (d.folder?.trim()) folders.add(d.folder.trim());

      if (d.uploadedAt) {
        const current = new Date(d.uploadedAt).getTime();
        const latest = latestUpload ? new Date(latestUpload).getTime() : 0;
        if (!latestUpload || current > latest) latestUpload = d.uploadedAt;
      }
    }

    const leadCategory = [...categoryCounts].sort((a, b) => b.value - a.value)[0];

    return {
      folderCount: folders.size,
      leadCategory,
      latestUploadLabel: latestUpload ? timeAgo(latestUpload) : "No recent uploads",
    };
  }, [docs, stats.academe, stats.pamo, stats.stake]);

  const folderOptionsByCategory = useMemo(() => {
    const grouped = {
      Academe: new Set<string>(),
      Stakeholders: new Set<string>(),
      "PAMO Activity": new Set<string>(),
    };

    for (const doc of docs) {
      const folder = (doc.folder || "").trim();
      if (!folder) continue;
      grouped[categoryLabel(doc.category)].add(folder);
    }

    return {
      Academe: Array.from(grouped.Academe).sort((a, b) => a.localeCompare(b)),
      Stakeholders: Array.from(grouped.Stakeholders).sort((a, b) => a.localeCompare(b)),
      "PAMO Activity": Array.from(grouped["PAMO Activity"]).sort((a, b) => a.localeCompare(b)),
    };
  }, [docs]);

  const editFolderOptions = folderOptionsByCategory[editCategory as keyof typeof folderOptionsByCategory] || [];
  const finalEditFolder = (editNewFolder.trim() || editSelectedFolder).trim();

  const deleteDoc = async (id: number) => {
    try {
      const res = await fetch(`/api/delete-documents?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMsg(data?.error || "Unable to delete document.");
        setErrorOpen(true);
        return;
      }

      await refreshDocuments();
      setSuccessTitle("Document Deleted");
      setSuccessMsg("The selected file has been removed successfully from the repository.");
      setSuccessOpen(true);
    } catch {
      setErrorMsg("Server unreachable.");
      setErrorOpen(true);
    }
  };

  const openEditDialog = (doc: DocumentRow) => {
    setEditDoc(doc);
    setEditCategory(categoryLabel(doc.category));
    setEditTitle(doc.title?.trim() ? doc.title : doc.name);
    setEditDateReceived(doc.dateReceived || "");
    setEditSelectedFolder((doc.folder || "").trim());
    setEditNewFolder("");
  };

  const saveDocumentEdit = async () => {
    if (!editDoc) return;

    const title = editTitle.trim();
    const folder = finalEditFolder;
    const folderRequired = editCategory === "Stakeholders" || editCategory === "PAMO Activity";

    if (!title) {
      setErrorMsg("Document title is required.");
      setErrorOpen(true);
      return;
    }

    if (!editDateReceived) {
      setErrorMsg("Date received is required.");
      setErrorOpen(true);
      return;
    }

    if (folderRequired && !folder) {
      setErrorMsg("Folder is required for the selected category.");
      setErrorOpen(true);
      return;
    }

    setSavingEdit(true);

    try {
      const res = await fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: editDoc.id,
          category: editCategory,
          title,
          dateReceived: editDateReceived,
          folder,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMsg(data?.error || "Unable to update document.");
        setErrorOpen(true);
        return;
      }

      await refreshDocuments();
      setEditDoc(null);
      setSuccessTitle("Document Updated");
      setSuccessMsg("Document details were updated successfully.");
      setSuccessOpen(true);
    } catch {
      setErrorMsg("Server unreachable.");
      setErrorOpen(true);
    } finally {
      setSavingEdit(false);
    }
  };

  const btnSm =
    "app-glass-button app-protected-action-button inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold transition";

  const dark = pageTheme === "dark";
  const ui = repoTheme(pageTheme);
  const rowActionNeutralClassName = dark
    ? "border-white/10 bg-[rgba(255,255,255,0.08)] text-[#E6EDF3] [&_svg]:text-inherit"
    : "border-slate-200/80 bg-[#F3F4F6] text-[#1F2937] [&_svg]:text-inherit";
  const rowActionDownloadClassName = dark
    ? "border-[#5E7D9C]/28 bg-[rgba(57,92,122,0.28)] text-[#E6EDF3] [&_svg]:text-inherit"
    : "border-[#395C7A]/18 bg-[rgba(57,92,122,0.12)] text-[#1E3A5F] [&_svg]:text-inherit";
  const rowActionDeleteClassName = dark
    ? "border-[rgba(220,38,38,0.26)] bg-[rgba(220,38,38,0.22)] text-[#FEE2E2] [&_svg]:text-inherit"
    : "border-[rgba(220,38,38,0.18)] bg-[rgba(220,38,38,0.12)] text-[#991B1B] [&_svg]:text-inherit";

  const cardCls = ui.card;
  const textMain = ui.textMain;
  const textMuted = ui.textMuted;
  const textSoft = ui.textSoft;
  const subBg = dark ? "bg-white/[0.03]" : "bg-white/45";
  const subBorder = dark ? "border-transparent" : "border-slate-200/60";
  const modalOverlayClassName = dark
    ? "fixed inset-0 bg-black/28 backdrop-blur-[2px] flex items-center justify-center p-4"
    : "fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center p-4";
  const inputCls = `${ui.input} text-sm`;

  if (loadingUser || !user) {
    return (
      <div className={`${ui.page} min-h-full flex items-center justify-center p-6`}>
        <div className={`${ui.card} p-6 w-[360px] text-center`}>
          <div className="animate-pulse">
            <div
              className={`h-10 w-10 rounded-full mx-auto mb-4 ${
                dark ? "bg-white/12" : "bg-[#235347]/10"
              }`}
            />
            <div
              className={`h-4 rounded mb-2 ${
                dark ? "bg-white/10" : "bg-[#235347]/10"
              }`}
            />
            <div
              className={`h-4 rounded w-2/3 mx-auto ${
                dark ? "bg-white/10" : "bg-[#235347]/10"
              }`}
            />
          </div>
          <p className={`${textMuted} mt-4 text-sm`}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${ui.page} relative overflow-hidden p-4 sm:p-6 md:p-10`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden"
      >
        <div
          className={`absolute left-[-8%] top-[-12%] h-64 w-64 rounded-full blur-3xl ${
            dark ? "bg-[#8EB69B]/12" : "bg-white/50"
          }`}
        />
        <div
          className={`absolute right-[6%] top-[8%] h-72 w-72 rounded-full blur-3xl ${
            dark ? "bg-[#235347]/20" : "bg-[#8EB69B]/22"
          }`}
        />
        <div
          className={`absolute left-[28%] top-[18%] h-48 w-48 rounded-full blur-3xl ${
            dark ? "bg-white/[0.05]" : "bg-[#DAF1DE]/55"
          }`}
        />
      </div>

      <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16 }}
        className={`${ui.shell} relative mb-6 overflow-hidden px-4 py-5 sm:px-6 md:px-8 md:py-7`}
      >
        <div
          className={`pointer-events-none absolute inset-x-10 top-0 h-24 rounded-b-[40px] blur-2xl ${
            dark ? "bg-white/[0.03]" : "bg-white/70"
          }`}
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[760px]">
            <div className={`text-[11px] uppercase tracking-[0.22em] font-semibold ${textSoft}`}>
              Repository Overview
            </div>

            <h1 className={`mt-3 text-4xl md:text-[46px] leading-tight font-semibold tracking-tight ${textMain}`}>
              Dashboard
            </h1>

            <p className={`${textMuted} mt-3 max-w-[640px] text-[15px] leading-7`}>
              Welcome back, <span className={`font-semibold ${textMain}`}>{user.name}</span>.
              Monitor synced Google Drive files, review recent uploads, and manage your
              repository from a cleaner overview built around live repository data.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <div
                className={`rounded-full border px-3.5 py-2 text-[12px] font-medium ${
                  dark ? "border-white/10 bg-white/[0.05]" : "border-white/70 bg-white/70"
                } ${textMain}`}
              >
                {stats.total} total documents
              </div>
              <div
                className={`rounded-full border px-3.5 py-2 text-[12px] font-medium ${
                  dark ? "border-white/10 bg-white/[0.05]" : "border-white/70 bg-white/70"
                } ${textMain}`}
              >
                {overview.folderCount} active folders
              </div>
              <div
                className={`rounded-full border px-3.5 py-2 text-[12px] font-medium ${
                  dark ? "border-white/10 bg-white/[0.05]" : "border-white/70 bg-white/70"
                } ${textMain}`}
              >
                Latest upload {overview.latestUploadLabel}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
            <div className={`${ui.card} p-4`}>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full grid place-items-center font-bold bg-[#235347] text-[#DAF1DE] border border-white/20 shadow-inner">
                  {initials(user.name)}
                </div>
                <div className="min-w-0">
                  <div className={`truncate text-sm font-medium ${textMain}`}>{user.name}</div>
                  <div className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${textMuted}`}>
                    {user.role}
                  </div>
                </div>
              </div>
            </div>

            <div className={`${ui.card} p-4`}>
              <div className={`text-[11px] uppercase tracking-[0.16em] font-semibold ${textSoft}`}>
                Lead Category
              </div>
              <div className={`mt-2 text-lg font-semibold ${textMain}`}>
                {overview.leadCategory.label}
              </div>
              <div className={`mt-1 text-[12px] ${textMuted}`}>
                {overview.leadCategory.value} document
                {overview.leadCategory.value === 1 ? "" : "s"} currently lead the repository mix.
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {loadingDocs ? (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1.25fr] gap-5 mb-6">
            <StatSkeleton dark={dark} />
            <StatSkeleton dark={dark} />
            <RecentUploadsSkeleton dark={dark} />
          </div>

          <motion.div
            {...fadeUpDelayed(0.08)}
            className={`${ui.shell} mb-5 overflow-hidden p-4 sm:p-5 shadow-none`}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className={`text-[11px] uppercase tracking-[0.18em] font-semibold ${textSoft}`}>
                  Repository Filters
                </div>
                <div className={`mt-2 text-xl font-semibold tracking-tight ${textMain}`}>
                  Search and refine document results
                </div>
                <div className={`mt-1 text-[12px] ${textMuted}`}>
                  Showing <span className={`font-medium ${textMain}`}>{filteredDocs.length}</span> of{" "}
                  <span className={`font-medium ${textMain}`}>{docs.length}</span> documents
                </div>
              </div>

              <div className="flex-1 relative max-w-[760px]">
                <MagnifyingGlassIcon
                  className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 ${
                    dark ? "text-[#8EB69B]/65" : "text-[#235347]/45"
                  }`}
                />
                <input
                  value=""
                  readOnly
                  disabled
                  placeholder="Search title, filename, folder, year…"
                  className={`${inputCls} opacity-80`}
                />
              </div>

              <button
                type="button"
                disabled
                className={`px-5 py-3 rounded-[20px] font-medium text-sm opacity-70 ${ui.buttonSecondary}`}
              >
                Clear
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SkeletonBlock dark={dark} className="h-8 w-20 rounded-full" />
              <SkeletonBlock dark={dark} className="h-8 w-28 rounded-full" />
              <SkeletonBlock dark={dark} className="h-8 w-32 rounded-full" />
              <SkeletonBlock dark={dark} className="h-8 w-36 rounded-full" />
            </div>

            <SkeletonBlock dark={dark} className="h-4 w-44 mt-4 rounded-full" />
          </motion.div>

          <div className={`${ui.card} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Squares2X2Icon
                  className={`w-6 h-6 ${dark ? "text-[#8EB69B]" : "text-[#235347]"}`}
                />
                <SkeletonBlock dark={dark} className="h-7 w-32" />
              </div>
              <SkeletonBlock dark={dark} className="h-4 w-16 rounded-full" />
            </div>

            <div className={ui.tableWrap}>
              <div
                className={`hidden lg:grid grid-cols-[1.4fr_1fr_1fr_260px] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] ${ui.tableHead}`}
              >
                <div>Title / File</div>
                <div>Folder / Type</div>
                <div>Dates</div>
                <div className="text-right">Actions</div>
              </div>

              <div className="max-h-[430px] overflow-y-auto scroll-docs">
                <TableRowsSkeleton dark={dark} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <motion.div {...fadeUpDelayed(0)}>
                <DashboardStatCard
                  dark={dark}
                  eyebrow="Total Documents"
                  value={String(stats.total)}
                  description="Current repository volume across all categories and synced document types."
                  accent={dark ? "bg-[#8EB69B]/50" : "bg-[#8EB69B]/65"}
                  iconTone={dark ? "text-[#8EB69B]" : "text-[#235347]"}
                  iconCapsule={
                    dark
                      ? "border-[#8EB69B]/16 bg-[#8EB69B]/10"
                      : "border-[#cfe0d6] bg-[#eef6f0]"
                  }
                  icon={<FolderIcon className="w-6 h-6" />}
                meta={
                  <>
                    <Pill dark={dark} tone="emerald">
                      Academe: {stats.academe}
                    </Pill>
                    <Pill dark={dark} tone="indigo">
                      Stakeholders: {stats.stake}
                    </Pill>
                    <Pill dark={dark} tone="amber">
                      PAMO: {stats.pamo}
                    </Pill>
                  </>
                }
              />
            </motion.div>

            <motion.div {...fadeUpDelayed(0.03)}>
                <DashboardStatCard
                  dark={dark}
                  eyebrow="Most Common Type"
                  value={stats.topType}
                  description={`${stats.topTypeCount} file${stats.topTypeCount === 1 ? "" : "s"} currently lead the format mix in the repository.`}
                  accent={dark ? "bg-[#7c83d7]/60" : "bg-[#8b92de]/75"}
                  iconTone={dark ? "text-[#c7cbff]" : "text-[#5d64b8]"}
                  iconCapsule={
                    dark
                      ? "border-[#8b92de]/18 bg-[#8b92de]/12"
                      : "border-[#d8dcfb] bg-[#eef0ff]"
                  }
                  icon={<ChartBarIcon className="w-6 h-6" />}
                meta={
                  <div className={`text-[12px] flex items-center gap-2 ${textMuted}`}>
                    <ClockIcon className="w-4 h-4" />
                    PDF and spreadsheet files still dominate quick review workflows.
                  </div>
                }
              />
            </motion.div>

            <motion.div {...fadeUpDelayed(0.05)} className="md:col-span-2">
              <div className={`${cardCls} relative overflow-hidden p-6 md:p-7`}>
                <div className={`absolute inset-x-0 top-0 h-2 ${dark ? "bg-[#7c83d7]/60" : "bg-[#8b92de]/75"}`} />
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-[460px]">
                    <div className={`text-[11px] uppercase tracking-[0.18em] font-semibold ${textSoft}`}>
                      Repository Snapshot
                    </div>
                    <h2 className={`mt-3 text-2xl font-semibold tracking-tight ${textMain}`}>
                      Cleaner oversight across folders and categories
                    </h2>
                    <p className={`mt-2 text-sm leading-6 ${textMuted}`}>
                      Use this overview to see where files are concentrated, which category is
                      leading, and how recently the repository changed.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 md:min-w-[360px]">
                    <div className={`${ui.cardSoft} p-4`}>
                      <div className={`text-[11px] uppercase tracking-[0.14em] ${textSoft}`}>
                        Folders
                      </div>
                      <div className={`mt-2 text-2xl font-semibold ${textMain}`}>
                        {overview.folderCount}
                      </div>
                      <div className={`mt-1 text-[12px] ${textMuted}`}>Named repositories in use</div>
                    </div>
                    <div className={`${ui.cardSoft} p-4`}>
                      <div className={`text-[11px] uppercase tracking-[0.14em] ${textSoft}`}>
                        Lead Category
                      </div>
                      <div className={`mt-2 text-lg font-semibold leading-6 ${textMain}`}>
                        {overview.leadCategory.label}
                      </div>
                      <div className={`mt-1 text-[12px] ${textMuted}`}>
                        {overview.leadCategory.value} documents
                      </div>
                    </div>
                    <div className={`${ui.cardSoft} p-4`}>
                      <div className={`text-[11px] uppercase tracking-[0.14em] ${textSoft}`}>
                        Last Upload
                      </div>
                      <div className={`mt-2 text-lg font-semibold leading-6 ${textMain}`}>
                        {overview.latestUploadLabel}
                      </div>
                      <div className={`mt-1 text-[12px] ${textMuted}`}>Live activity signal</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            </div>

            <motion.div {...fadeUpDelayed(0.06)}>
              <div className={`${cardCls} relative h-full overflow-hidden p-6 md:p-7`}>
                <div
                  className={`absolute inset-x-0 top-0 h-2 ${
                    dark ? "bg-[#c89a52]/65" : "bg-[#d9aa63]/78"
                  }`}
                />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className={`text-[11px] uppercase tracking-[0.18em] font-semibold ${textSoft}`}>
                      Activity
                    </div>
                    <div className={`mt-2 text-2xl font-semibold tracking-tight ${textMain}`}>
                      Recent uploads
                    </div>
                    <div className={`mt-1 text-[12px] ${textMuted}`}>
                      Latest 3 uploaded documents
                    </div>
                  </div>
                  <div
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                      dark ? "border-white/10 bg-white/[0.05]" : "border-white/70 bg-white/75"
                    } ${textMain}`}
                  >
                    Live
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {recentUploads.length === 0 ? (
                    <div className={`rounded-[22px] px-4 py-6 text-sm ${subBg} ${textMuted}`}>
                      No uploads yet.
                    </div>
                  ) : (
                    recentUploads.map((d, index) => (
                      <div
                        key={d.id}
                        className={`rounded-[24px] p-4 transition ${subBg} ${
                          dark
                            ? "hover:bg-white/[0.05]"
                            : "hover:bg-white/68"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] ${
                              dark
                                ? "bg-[#9fb5ff]/10 text-[#c7cbff]"
                                : "bg-[#eef0ff] text-[#5d64b8]"
                            }`}
                          >
                            <DocumentTextIcon className="w-5 h-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                  dark ? "border-white/10 bg-white/[0.05]" : "border-white/70 bg-white/72"
                                } ${textMuted}`}
                              >
                                {index === 0 ? "Newest" : `Recent ${index + 1}`}
                              </div>
                              <div className={`text-[11px] ${textMuted}`}>{timeAgo(d.uploadedAt)}</div>
                            </div>

                            <div
                              title={d.title?.trim() ? d.title : d.name}
                              className={`mt-3 overflow-hidden font-semibold text-[15px] leading-6 ${textMain}`}
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {d.title?.trim() ? d.title : d.name}
                            </div>

                            <div className={`mt-1 truncate text-[12px] ${textMuted}`}>{d.name}</div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {d.folder && <Pill dark={dark}>{d.folder}</Pill>}
                              {d.year && <Pill dark={dark} tone="slate">{d.year}</Pill>}
                              <Pill dark={dark} tone="slate">
                                {typeLabel(d.type)}
                              </Pill>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            {...fadeUpDelayed(0.08)}
            className={`${ui.shell} mb-5 overflow-hidden p-4 sm:p-5 shadow-none`}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className={`text-[11px] uppercase tracking-[0.18em] font-semibold ${textSoft}`}>
                  Repository Filters
                </div>
                <div className={`mt-2 text-xl font-semibold tracking-tight ${textMain}`}>
                  Search and refine document results
                </div>
                <div className={`mt-1 text-[12px] ${textMuted}`}>
                  Showing <span className={`font-medium ${textMain}`}>{filteredDocs.length}</span> of{" "}
                  <span className={`font-medium ${textMain}`}>{docs.length}</span> documents
                </div>
              </div>

              <div className="flex-1 relative max-w-[760px]">
                <MagnifyingGlassIcon
                  className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 ${
                    dark ? "text-[#8EB69B]/65" : "text-[#235347]/45"
                  }`}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search title, filename, folder, year…"
                  className={inputCls}
                />
              </div>

              <button
                type="button"
                onClick={() => setQuery("")}
                className={`min-h-11 px-5 py-3 rounded-[20px] transition font-medium text-sm ${ui.buttonSecondary}`}
              >
                Clear
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {[
                ["all", `All (${docs.length})`],
                ["academe", `Academe (${stats.academe})`],
                ["stakeholder", `Stakeholders (${stats.stake})`],
                ["pamo", `PAMO Activity (${stats.pamo})`],
              ].map(([key, label]) => {
                const active = activeTab === key;
                const style = active ? ui.buttonPrimary : ui.buttonSecondary;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setActiveTab(key as "all" | "academe" | "stakeholder" | "pamo")
                    }
                    className={`min-h-11 px-3.5 py-2 rounded-full text-[12px] font-semibold border transition ${style}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className={`text-[12px] ${textMuted}`}>Use tabs and search together for faster filtering.</div>
            </div>
          </motion.div>

          <motion.div {...fadeUpDelayed(0.1)} className={`${cardCls} relative overflow-hidden p-4 sm:p-6 md:p-7`}>
            <div className={`absolute inset-x-0 top-0 h-2 ${dark ? "bg-[#7ea8d9]/58" : "bg-[#97bbe4]/72"}`} />
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className={`text-[11px] uppercase tracking-[0.18em] font-semibold ${textSoft}`}>
                  Repository Table
                </div>
                <h2 className={`mt-2 flex items-center gap-2 text-xl md:text-2xl font-semibold ${textMain}`}>
                  <Squares2X2Icon
                    className={`w-6 h-6 ${dark ? "text-[#8EB69B]" : "text-[#235347]"}`}
                  />
                  Documents
                </h2>
                <div className={`mt-1 text-[12px] ${textMuted}`}>
                  Browse, preview, download, and manage repository files.
                </div>
              </div>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="text-center py-14">
                <div
                  className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] ${
                    dark
                      ? "bg-[#97bbe4]/10 text-[#c8d8f0]"
                      : "bg-[#edf4fb] text-[#4d6f99]"
                  }`}
                >
                  <DocumentTextIcon className="w-7 h-7" />
                </div>
                <p className={`${textMain} font-medium`}>No matching documents found.</p>
                <p className={`${textMuted} text-sm mt-1`}>
                  Adjust your search or category filters to browse repository files.
                </p>
              </div>
            ) : (
              <div className={`mt-2 ${ui.tableWrap}`}>
                <div
                  className={`hidden lg:grid grid-cols-[1.4fr_1fr_1fr_260px] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] ${ui.tableHead}`}
                >
                  <div>Title / File</div>
                  <div>Folder / Type</div>
                  <div>Dates</div>
                  <div className="text-right">Actions</div>
                </div>

                <div
                  className={`scroll-docs overflow-y-auto ${
                    filteredDocs.length > 4 ? "max-h-[430px]" : ""
                  }`}
                >
                  <div className={dark ? "divide-y divide-white/8" : "divide-y divide-white/50"}>
                    {filteredDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className={`px-4 py-4 lg:px-5 transition-all duration-200 ${ui.rowHover}`}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr_260px] gap-4 items-start">
                          <div className="min-w-0">
                            <div className="flex items-start gap-3">
                              <div
                                className={`h-10 w-10 rounded-[16px] border grid place-items-center shrink-0 ${subBg} ${subBorder}`}
                              >
                                <DocumentTextIcon
                                  className={`w-5 h-5 ${
                                    dark ? "text-[#8EB69B]" : "text-[#235347]"
                                  }`}
                                />
                              </div>

                              <div className="min-w-0">
                                <p className={`font-medium text-sm truncate ${textMain}`}>
                                  {doc.title?.trim() ? doc.title : doc.name}
                                </p>
                                <p className={`text-[12px] truncate mt-0.5 ${textMuted}`}>
                                  {doc.name}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="hidden lg:block">
                            <div className="flex flex-wrap items-center gap-2">
                              <Pill dark={dark}>{doc.category || "—"}</Pill>
                              <Pill dark={dark} tone="slate">
                                {doc.folder ? doc.folder : "—"}
                              </Pill>
                              {doc.year && (
                                <Pill dark={dark} tone="slate">
                                  {doc.year}
                                </Pill>
                              )}
                              <Pill dark={dark} tone="slate">
                                {typeLabel(doc.type)}
                              </Pill>
                            </div>
                          </div>

                          <div className={`text-[12px] space-y-1.5 ${textMuted}`}>
                            <div>
                              <span className={textSoft}>Received:</span>{" "}
                              <span className={`font-medium ${textMain}`}>
                                {fmtDate(doc.dateReceived)}
                              </span>
                            </div>
                            <div>
                              <span className={textSoft}>Uploaded:</span>{" "}
                              <span className={`font-medium ${textMain}`}>
                                {fmtDate(doc.uploadedAt)}
                              </span>{" "}
                              <span className={textSoft}>({timeAgo(doc.uploadedAt)})</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap lg:justify-end gap-2">
                            {canManageDocuments(user?.role) && (
                              <button
                                type="button"
                                onClick={() => openEditDialog(doc)}
                                className={`${btnSm} ${rowActionNeutralClassName}`}
                              >
                                <PencilSquareIcon className="w-3.5 h-3.5" />
                                Edit
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className={`${btnSm} ${rowActionNeutralClassName}`}
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                              View
                            </button>

                            <a
                              href={downloadUrl(doc.fileId)}
                              className={`${btnSm} ${rowActionDownloadClassName} font-semibold`}
                            >
                              <CloudArrowDownIcon className="w-3.5 h-3.5" />
                              Download
                            </a>

                            {canDeleteDocuments(user?.role) && (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(doc.id)}
                                className={`${btnSm} ${rowActionDeleteClassName}`}
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className={`mt-4 text-[11px] ${textMuted}`}>
              Tip: Use tabs and search together for faster filtering.
            </div>
          </motion.div>
        </>
      )}

      <AnimatePresence>
        {editDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className={`z-[65] ${modalOverlayClassName}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={`relative w-full max-w-2xl rounded-[28px] shadow-2xl overflow-hidden ${ui.modal}`}
            >
              <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b ${dark ? "border-white/8 bg-[#051F20]/45" : "border-white/55 bg-white/45"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`text-lg font-semibold ${textMain}`}>Edit Document</div>
                    <div className={`mt-1 text-[12px] ${textMuted}`}>Update category, title, received date, and project folder.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => !savingEdit && setEditDoc(null)}
                    className={`app-glass-skip min-h-11 min-w-11 p-2.5 rounded-full transition border shadow-sm ${ui.buttonSecondary}`}
                  >
                    <XMarkIcon className={`w-5 h-5 ${dark ? "text-[#DAF1DE]" : "text-[#163832]"}`} />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-[0.08em] ${textSoft}`}>Folder Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => {
                      setEditCategory(e.target.value);
                      setEditSelectedFolder("");
                      setEditNewFolder("");
                    }}
                    className={`${ui.input.replace("pl-11", "pl-4")} mt-2 text-sm`}
                    disabled={savingEdit}
                  >
                    <option value="Academe">Academe</option>
                    <option value="Stakeholders">Stakeholders</option>
                    <option value="PAMO Activity">PAMO Activity</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-[0.08em] ${textSoft}`}>Document Title</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={`${ui.input.replace("pl-11", "pl-4")} mt-2 text-sm`}
                    disabled={savingEdit}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[11px] font-semibold uppercase tracking-[0.08em] ${textSoft}`}>Date Received</label>
                    <input
                      type="date"
                      value={editDateReceived}
                      onChange={(e) => setEditDateReceived(e.target.value)}
                      className={`${ui.input.replace("pl-11", "pl-4")} mt-2 text-sm`}
                      disabled={savingEdit}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-semibold uppercase tracking-[0.08em] ${textSoft}`}>Existing Project Folder</label>
                    <select
                      value={editSelectedFolder}
                      onChange={(e) => {
                        setEditSelectedFolder(e.target.value);
                        if (e.target.value) setEditNewFolder("");
                      }}
                      className={`${ui.input.replace("pl-11", "pl-4")} mt-2 text-sm`}
                      disabled={savingEdit}
                    >
                      <option value="">Select existing folder</option>
                      {editFolderOptions.map((folder) => (
                        <option key={folder} value={folder}>
                          {folder}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-[0.08em] ${textSoft}`}>New Project Folder</label>
                  <input
                    value={editNewFolder}
                    onChange={(e) => {
                      setEditNewFolder(e.target.value);
                      if (e.target.value.trim()) setEditSelectedFolder("");
                    }}
                    placeholder="Type a new folder name to create or replace the existing one"
                    className={`${ui.input.replace("pl-11", "pl-4")} mt-2 text-sm`}
                    disabled={savingEdit}
                  />
                  <div className={`mt-2 text-[12px] ${textMuted}`}>
                    New folder text overrides the selected existing folder. Stakeholders and PAMO Activity require a folder.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setEditDoc(null)}
                    disabled={savingEdit}
                    className={`min-h-11 px-5 py-3 rounded-[20px] font-medium text-sm ${ui.buttonSecondary}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveDocumentEdit}
                    disabled={savingEdit}
                    className={`min-h-11 px-5 py-3 rounded-[20px] font-semibold text-sm ${ui.buttonPrimary}`}
                  >
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {previewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className={`z-[60] ${modalOverlayClassName}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={`relative w-full max-w-5xl max-h-[92dvh] rounded-[28px] shadow-2xl overflow-hidden ${ui.modal}`}
            >
              <div className={`absolute inset-x-6 top-0 h-1.5 rounded-b-full ${dark ? "bg-[#97bbe4]/55" : "bg-[#97bbe4]/72"}`} />
              <div
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b ${
                  dark ? "border-white/8 bg-[#051F20]/45" : "border-white/55 bg-white/45"
                }`}
              >
                <div className="min-w-0">
                  <div className={`font-medium truncate text-sm ${textMain}`}>
                    {previewDoc.title?.trim() ? previewDoc.title : previewDoc.name}
                  </div>
                  <div className={`text-[11px] mt-1 truncate ${textMuted}`}>
                    {previewDoc.name} • {typeLabel(previewDoc.type)}
                  </div>
                </div>

                <div className="flex w-full sm:w-auto items-center gap-2">
                  <a
                    href={downloadUrl(previewDoc.fileId)}
                    className={`${btnSm} ${ui.buttonPrimary} font-semibold flex-1 sm:flex-none justify-center`}
                  >
                    <CloudArrowDownIcon className="w-3.5 h-3.5" />
                    Download
                  </a>

                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className={`app-glass-skip min-h-11 min-w-11 p-2.5 rounded-full transition border shadow-sm ${ui.buttonSecondary}`}
                  >
                    <XMarkIcon
                      className={`w-5 h-5 ${dark ? "text-[#DAF1DE]" : "text-[#163832]"}`}
                    />
                  </button>
                </div>
              </div>

              <div className="h-[70dvh] sm:h-[75vh] bg-white">
                <iframe
                  key={previewDoc.fileId}
                  src={previewDoc ? viewUrl(previewDoc.fileId) : "about:blank"}
                  className="w-full h-full"
                  allow="autoplay"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete Document?"
        message="This document will be permanently deleted and cannot be recovered."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={async () => {
          const id = confirmDeleteId!;
          setConfirmDeleteId(null);
          await deleteDoc(id);
        }}
      />

      <ConfirmDialog
        open={successOpen}
        title={successTitle}
        message={successMsg}
        confirmText="Continue"
        oneButton
        variant="success"
        onConfirm={() => setSuccessOpen(false)}
      />

      <ConfirmDialog
        open={errorOpen}
        title="Action Failed"
        message={errorMsg}
        confirmText="OK"
        oneButton
        variant="warning"
        onConfirm={() => setErrorOpen(false)}
      />
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <DocumentsProvider>
      <DashboardContent />
    </DocumentsProvider>
  );
}
