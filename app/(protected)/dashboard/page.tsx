"use client";

import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useAuth } from "@/app/components/AuthProvider";
import {
  useDocuments,
  type DocumentRow,
} from "@/app/components/DocumentsProvider";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrashIcon,
  CloudArrowDownIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  XMarkIcon,
  Squares2X2Icon,
  ClockIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

type PageTheme = "dark" | "light";

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
  if (c === "pamo activity" || c === "pamo" || c === "activity" || c === "activities") {
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
        dark ? "bg-white/10" : "bg-slate-200"
      } ${className}`}
    />
  );
}

function StatSkeleton({ dark }: { dark: boolean }) {
  return (
    <div
      className={`rounded-3xl p-6 ${
        dark
          ? "bg-white/[0.04] border border-cyan-300/12 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-md"
          : "bg-white/85 border border-slate-200 shadow-[0_10px_28px_rgba(15,23,42,0.08)]"
      }`}
    >
      <SkeletonBlock dark={dark} className="h-3 w-28 rounded-full" />
      <SkeletonBlock dark={dark} className="h-12 w-24 mt-4" />
      <div className="mt-5 flex flex-wrap gap-2">
        <SkeletonBlock dark={dark} className="h-7 w-24 rounded-full" />
        <SkeletonBlock dark={dark} className="h-7 w-24 rounded-full" />
        <SkeletonBlock dark={dark} className="h-7 w-24 rounded-full" />
      </div>
    </div>
  );
}

function RecentUploadsSkeleton({ dark }: { dark: boolean }) {
  return (
    <div
      className={`rounded-3xl p-6 ${
        dark
          ? "bg-white/[0.04] border border-cyan-300/12 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-md"
          : "bg-white/85 border border-slate-200 shadow-[0_10px_28px_rgba(15,23,42,0.08)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <SkeletonBlock dark={dark} className="h-6 w-36" />
        <SkeletonBlock dark={dark} className="h-4 w-14 rounded-full" />
      </div>

      <div className="mt-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`rounded-2xl border px-4 py-4 ${
              dark ? "bg-white/[0.05] border-cyan-300/10" : "bg-slate-50 border-slate-200"
            }`}
          >
            <SkeletonBlock dark={dark} className="h-4 w-2/3" />
            <div className="mt-3 flex flex-wrap gap-2">
              <SkeletonBlock dark={dark} className="h-6 w-20 rounded-full" />
              <SkeletonBlock dark={dark} className="h-6 w-16 rounded-full" />
              <SkeletonBlock dark={dark} className="h-6 w-20 rounded-full" />
            </div>
            <SkeletonBlock dark={dark} className="h-3 w-24 mt-3 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TableRowsSkeleton({ dark }: { dark: boolean }) {
  return (
    <div className={dark ? "divide-y divide-cyan-300/8" : "divide-y divide-slate-200"}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="px-4 py-4 lg:px-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.9fr_0.9fr_260px] gap-4 items-start">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <SkeletonBlock dark={dark} className="h-9 w-9 rounded-xl shrink-0" />
                <div className="min-w-0 flex-1">
                  <SkeletonBlock dark={dark} className="h-4 w-2/3" />
                  <SkeletonBlock dark={dark} className="h-3 w-1/2 mt-2 rounded-full" />
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="flex flex-wrap items-center gap-2">
                <SkeletonBlock dark={dark} className="h-6 w-20 rounded-full" />
                <SkeletonBlock dark={dark} className="h-6 w-24 rounded-full" />
                <SkeletonBlock dark={dark} className="h-6 w-14 rounded-full" />
                <SkeletonBlock dark={dark} className="h-6 w-16 rounded-full" />
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

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 },
};

const fadeUpDelayed = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, delay },
});

export default function Dashboard() {
  const { user, loading: loadingUser } = useAuth();
  const { documents: docs = [], loading: loadingDocs, refreshDocuments } = useDocuments();

  const [pageTheme, setPageTheme] = useState<PageTheme>("dark");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "academe" | "stakeholder" | "pamo">(
    "all"
  );

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("Something went wrong.");
  const [previewDoc, setPreviewDoc] = useState<DocumentRow | null>(null);

  useEffect(() => {
    const syncTheme = () => {
      const saved =
        typeof window !== "undefined"
          ? (localStorage.getItem("page-theme") as PageTheme | null)
          : null;
      setPageTheme(saved === "light" ? "light" : "dark");
    };

    syncTheme();
    window.addEventListener("page-theme-changed", syncTheme);
    return () => window.removeEventListener("page-theme-changed", syncTheme);
  }, []);

  const stats = useMemo(() => {
    const total = docs.length;
    const byType: Record<string, number> = {};
    let academe = 0;
    let stake = 0;
    let pamo = 0;

    for (const d of docs) {
      const t = d.type || "Unknown";
      byType[t] = (byType[t] || 0) + 1;

      const c = normalizeCat(d.category);
      if (c === "academe") academe++;
      else if (c === "stakeholder") stake++;
      else if (c === "pamo") pamo++;
    }

    const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    return { total, topType, academe, stake, pamo };
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
      setSuccessOpen(true);
    } catch {
      setErrorMsg("Server unreachable.");
      setErrorOpen(true);
    }
  };

  const btnSm =
    "px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap";

  const dark = pageTheme === "dark";

  const cardCls = dark
    ? "bg-white/[0.04] border border-cyan-300/12 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-md rounded-3xl"
    : "bg-white/85 border border-slate-200 shadow-[0_10px_28px_rgba(15,23,42,0.08)] rounded-3xl";

  const textMain = dark ? "text-white" : "text-slate-900";
  const textMuted = dark ? "text-cyan-100/65" : "text-slate-600";
  const subBg = dark ? "bg-white/[0.05]" : "bg-slate-50";
  const subBorder = dark ? "border-cyan-300/10" : "border-slate-200";
  const inputCls = dark
    ? "w-full pl-10 pr-3 py-3 rounded-2xl border border-cyan-300/15 bg-white/[0.04] text-white placeholder-cyan-100/40 outline-none focus:ring-4 focus:ring-cyan-400/10 focus:border-cyan-300/30 caret-cyan-200 text-sm"
    : "w-full pl-10 pr-3 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-400 caret-cyan-700 text-sm";

  if (loadingUser || !user) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className={`${cardCls} p-6 w-[360px] text-center`}>
          <div className="animate-pulse">
            <div
              className={`h-10 w-10 rounded-full mx-auto mb-4 ${
                dark ? "bg-cyan-300/20" : "bg-slate-200"
              }`}
            />
            <div className={`h-4 rounded mb-2 ${dark ? "bg-cyan-300/10" : "bg-slate-200"}`} />
            <div
              className={`h-4 rounded w-2/3 mx-auto ${
                dark ? "bg-cyan-300/10" : "bg-slate-200"
              }`}
            />
          </div>
          <p className={`${textMuted} mt-4 text-sm`}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 md:p-10 ${dark ? "text-slate-100" : "text-slate-900"}`}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16 }}
        className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6"
      >
        <div>
          <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight ${textMain}`}>
            Dashboard
          </h1>
          <p className={`${textMuted} mt-2 text-sm md:text-base`}>
            Welcome, <span className={`font-semibold ${textMain}`}>{user.name}</span>{" "}
            <span className={dark ? "text-cyan-200/90" : "text-slate-500"}>({user.role})</span>
          </p>
        </div>

        <div className={`flex items-center gap-3 rounded-3xl border px-4 py-3 ${subBg} ${subBorder}`}>
          <div
            className={`h-11 w-11 rounded-full grid place-items-center font-bold ${
              dark
                ? "bg-cyan-400/15 border border-cyan-300/20 text-white"
                : "bg-cyan-100 text-cyan-700 border border-cyan-200"
            }`}
          >
            {initials(user.name)}
          </div>
          <div className="hidden sm:block">
            <div className={`text-sm font-semibold ${textMain}`}>{user.name}</div>
            <div className={`text-[11px] font-semibold ${textMuted}`}>{user.role.toUpperCase()}</div>
          </div>
        </div>
      </motion.div>

      {loadingDocs ? (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1.2fr] gap-4 mb-5">
            <StatSkeleton dark={dark} />
            <StatSkeleton dark={dark} />
            <RecentUploadsSkeleton dark={dark} />
          </div>

          <div className={`${cardCls} p-5 mb-5`}>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon
                  className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 ${
                    dark ? "text-cyan-100/45" : "text-slate-400"
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
                className={`px-5 py-3 rounded-2xl border font-semibold text-sm opacity-70 ${
                  dark
                    ? "border-cyan-300/15 bg-white/[0.05] text-white"
                    : "border-slate-300 bg-white text-slate-900"
                }`}
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
          </div>

          <div className={`${cardCls} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Squares2X2Icon className={`w-6 h-6 ${dark ? "text-cyan-200" : "text-cyan-600"}`} />
                <SkeletonBlock dark={dark} className="h-7 w-32" />
              </div>
              <SkeletonBlock dark={dark} className="h-4 w-16 rounded-full" />
            </div>

            <div
              className={`mt-2 max-h-[62vh] overflow-y-auto rounded-2xl border ${
                dark ? "border-cyan-300/10 bg-[#07131f]/70" : "border-slate-200 bg-white"
              }`}
            >
              <div
                className={`hidden lg:grid sticky top-0 z-30 backdrop-blur border-b grid-cols-[1.35fr_0.9fr_0.9fr_260px] gap-4 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.06em] ${
                  dark
                    ? "bg-[#0a1825]/95 border-cyan-300/10 text-cyan-100/55"
                    : "bg-slate-50/95 border-slate-200 text-slate-500"
                }`}
              >
                <div>Title / File</div>
                <div>Folder</div>
                <div>Dates</div>
                <div className="text-right">Actions</div>
              </div>

              <TableRowsSkeleton dark={dark} />
            </div>

            <SkeletonBlock dark={dark} className="h-4 w-60 mt-4 rounded-full" />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1.2fr] gap-4 mb-5">
            <motion.div {...fadeUpDelayed(0)}>
              <div className={`${cardCls} p-6 min-h-[220px]`}>
                <div className={`text-[12px] uppercase tracking-[0.08em] ${textMuted}`}>
                  Total Documents
                </div>
                <div className={`text-5xl font-extrabold mt-3 ${textMain}`}>{stats.total}</div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                      dark
                        ? "bg-emerald-400/12 text-emerald-200 border-emerald-300/20"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    Academe: {stats.academe}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                      dark
                        ? "bg-indigo-400/12 text-indigo-200 border-indigo-300/20"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                    }`}
                  >
                    Stake: {stats.stake}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                      dark
                        ? "bg-amber-400/12 text-amber-200 border-amber-300/20"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    PAMO: {stats.pamo}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div {...fadeUpDelayed(0.03)}>
              <div className={`${cardCls} p-6 min-h-[220px]`}>
                <div className={`text-[12px] uppercase tracking-[0.08em] ${textMuted}`}>
                  Most Common Type
                </div>
                <div className={`text-2xl font-extrabold mt-4 break-words ${textMain}`}>
                  {stats.topType}
                </div>
                <div className={`mt-5 text-[12px] flex items-center gap-2 ${textMuted}`}>
                  <ClockIcon className="w-4 h-4" />
                  Tip: PDFs + Sheets are easiest to preview.
                </div>
              </div>
            </motion.div>

            <motion.div {...fadeUpDelayed(0.06)}>
              <div className={`${cardCls} p-6`}>
                <div className="flex items-center justify-between">
                  <div className={`text-lg font-extrabold ${textMain}`}>Recent uploads</div>
                  <div className={`text-[12px] ${textMuted}`}>latest 3</div>
                </div>

                <div className="mt-4 space-y-3">
                  {recentUploads.length === 0 ? (
                    <div className={`text-sm ${textMuted}`}>No uploads yet.</div>
                  ) : (
                    recentUploads.map((d) => (
                      <div key={d.id} className={`rounded-2xl border px-4 py-4 ${subBg} ${subBorder}`}>
                        <div className={`font-bold text-sm truncate ${textMain}`}>
                          {d.title?.trim() ? d.title : d.name}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {d.folder && (
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                                dark
                                  ? "bg-cyan-400/8 text-cyan-100 border-cyan-300/20"
                                  : "bg-cyan-50 text-cyan-700 border-cyan-200"
                              }`}
                            >
                              {d.folder}
                            </span>
                          )}
                          {d.year && (
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                                dark
                                  ? "bg-cyan-400/8 text-cyan-100 border-cyan-300/20"
                                  : "bg-cyan-50 text-cyan-700 border-cyan-200"
                              }`}
                            >
                              {d.year}
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                              dark
                                ? "bg-cyan-400/8 text-cyan-100 border-cyan-300/20"
                                : "bg-cyan-50 text-cyan-700 border-cyan-200"
                            }`}
                          >
                            {typeLabel(d.type)}
                          </span>
                        </div>

                        <div className={`mt-3 text-[11px] flex items-center gap-2 ${textMuted}`}>
                          <ClockIcon className="w-4 h-4" />
                          {timeAgo(d.uploadedAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div {...fadeUpDelayed(0.08)} className={`${cardCls} p-5 mb-5`}>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon
                  className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 ${
                    dark ? "text-cyan-100/45" : "text-slate-400"
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
                className={`px-5 py-3 rounded-2xl border transition font-semibold text-sm ${
                  dark
                    ? "border-cyan-300/15 bg-white/[0.05] hover:bg-white/[0.08] text-white"
                    : "border-slate-300 bg-white hover:bg-slate-50 text-slate-900"
                }`}
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
                const style =
                  key === "academe"
                    ? active
                      ? dark
                        ? "bg-emerald-400/18 text-white border-emerald-300/30"
                        : "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : dark
                      ? "bg-white/[0.04] hover:bg-white/[0.08] text-cyan-100 border-cyan-300/10"
                      : "bg-white hover:bg-slate-50 text-slate-800 border-slate-300"
                    : key === "stakeholder"
                    ? active
                      ? dark
                        ? "bg-indigo-400/18 text-white border-indigo-300/30"
                        : "bg-indigo-100 text-indigo-800 border-indigo-300"
                      : dark
                      ? "bg-white/[0.04] hover:bg-white/[0.08] text-cyan-100 border-cyan-300/10"
                      : "bg-white hover:bg-slate-50 text-slate-800 border-slate-300"
                    : key === "pamo"
                    ? active
                      ? dark
                        ? "bg-amber-400/18 text-white border-amber-300/30"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                      : dark
                      ? "bg-white/[0.04] hover:bg-white/[0.08] text-cyan-100 border-cyan-300/10"
                      : "bg-white hover:bg-slate-50 text-slate-800 border-slate-300"
                    : active
                    ? dark
                      ? "bg-cyan-400/20 text-white border-cyan-300/30"
                      : "bg-cyan-100 text-cyan-800 border-cyan-300"
                    : dark
                    ? "bg-white/[0.04] hover:bg-white/[0.08] text-cyan-100 border-cyan-300/10"
                    : "bg-white hover:bg-slate-50 text-slate-800 border-slate-300";

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setActiveTab(key as "all" | "academe" | "stakeholder" | "pamo")
                    }
                    className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition ${style}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className={`mt-3 text-[12px] ${textMuted}`}>
              Showing <span className={`font-semibold ${textMain}`}>{filteredDocs.length}</span> of{" "}
              <span className={`font-semibold ${textMain}`}>{docs.length}</span> documents
            </div>
          </motion.div>

          <motion.div {...fadeUpDelayed(0.1)} className={`${cardCls} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-2xl font-extrabold flex items-center gap-2 ${textMain}`}>
                <Squares2X2Icon className={`w-6 h-6 ${dark ? "text-cyan-200" : "text-cyan-600"}`} />
                Documents
              </h2>
            </div>

            {filteredDocs.length === 0 && (
              <div className="text-center py-14">
                <div
                  className={`mx-auto h-12 w-12 rounded-2xl grid place-items-center mb-3 border ${subBg} ${subBorder}`}
                >
                  <DocumentTextIcon
                    className={`w-7 h-7 ${dark ? "text-cyan-200" : "text-cyan-600"}`}
                  />
                </div>
                <p className={`${textMain} font-semibold`}>No documents found.</p>
                <p className={`${textMuted} text-sm mt-1`}>Try another keyword.</p>
              </div>
            )}

            <div
              className={`mt-2 max-h-[62vh] overflow-y-auto rounded-2xl border ${
                dark ? "border-cyan-300/10 bg-[#07131f]/70" : "border-slate-200 bg-white"
              }`}
            >
              <div
                className={`hidden lg:grid sticky top-0 z-30 backdrop-blur border-b grid-cols-[1.35fr_0.9fr_0.9fr_260px] gap-4 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.06em] ${
                  dark
                    ? "bg-[#0a1825]/95 border-cyan-300/10 text-cyan-100/55"
                    : "bg-slate-50/95 border-slate-200 text-slate-500"
                }`}
              >
                <div>Title / File</div>
                <div>Folder</div>
                <div>Dates</div>
                <div className="text-right">Actions</div>
              </div>

              <div className={dark ? "divide-y divide-cyan-300/8" : "divide-y divide-slate-200"}>
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className={`px-4 py-4 lg:px-5 transition ${
                      dark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.9fr_0.9fr_260px] gap-4 items-start">
                      <div className="min-w-0">
                        <div className="flex items-start gap-3">
                          <div
                            className={`h-9 w-9 rounded-xl border grid place-items-center shrink-0 ${subBg} ${subBorder}`}
                          >
                            <DocumentTextIcon
                              className={`w-5 h-5 ${dark ? "text-cyan-200" : "text-cyan-600"}`}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className={`font-extrabold text-sm truncate ${textMain}`}>
                              {doc.title?.trim() ? doc.title : doc.name}
                            </p>
                            <p className={`text-[12px] truncate mt-0.5 ${textMuted}`}>{doc.name}</p>
                          </div>
                        </div>
                      </div>

                      <div className="hidden lg:block">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${
                              dark
                                ? "bg-cyan-400/8 text-cyan-100 border-cyan-300/20"
                                : "bg-cyan-50 text-cyan-700 border-cyan-200"
                            }`}
                          >
                            {doc.category || "—"}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${
                              dark
                                ? "bg-cyan-400/8 text-cyan-100 border-cyan-300/20"
                                : "bg-cyan-50 text-cyan-700 border-cyan-200"
                            }`}
                          >
                            {doc.folder ? doc.folder : "—"}
                          </span>
                          {doc.year && (
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${
                                dark
                                  ? "bg-cyan-400/8 text-cyan-100 border-cyan-300/20"
                                  : "bg-cyan-50 text-cyan-700 border-cyan-200"
                              }`}
                            >
                              {doc.year}
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${
                              dark
                                ? "bg-cyan-400/8 text-cyan-100 border-cyan-300/20"
                                : "bg-cyan-50 text-cyan-700 border-cyan-200"
                            }`}
                          >
                            {typeLabel(doc.type)}
                          </span>
                        </div>
                      </div>

                      <div className={`text-[12px] space-y-1 ${textMuted}`}>
                        <div>
                          <span className={dark ? "text-cyan-100/45" : "text-slate-500"}>
                            Received:
                          </span>{" "}
                          <span className={`font-semibold ${textMain}`}>
                            {fmtDate(doc.dateReceived)}
                          </span>
                        </div>
                        <div>
                          <span className={dark ? "text-cyan-100/45" : "text-slate-500"}>
                            Uploaded:
                          </span>{" "}
                          <span className={`font-semibold ${textMain}`}>
                            {fmtDate(doc.uploadedAt)}
                          </span>{" "}
                          <span className={dark ? "text-cyan-100/40" : "text-slate-400"}>
                            ({timeAgo(doc.uploadedAt)})
                          </span>
                        </div>
                      </div>

                      <div className="flex lg:justify-end gap-2 flex-nowrap">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className={`${btnSm} border ${
                            dark
                              ? "border-cyan-300/12 bg-white/[0.05] hover:bg-white/[0.08] text-white"
                              : "border-slate-300 bg-white hover:bg-slate-50 text-slate-900"
                          }`}
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          View
                        </button>

                        <a
                          href={downloadUrl(doc.fileId)}
                          className={`${btnSm} ${
                            dark
                              ? "bg-cyan-500/85 text-slate-950 hover:bg-cyan-400 font-bold"
                              : "bg-cyan-600 text-white hover:bg-cyan-500"
                          }`}
                        >
                          <CloudArrowDownIcon className="w-3.5 h-3.5" />
                          Download
                        </a>

                        {canDeleteDocuments(user?.role) && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(doc.id)}
                            className={`${btnSm} bg-slate-800 text-white hover:bg-slate-700`}
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

            <div className={`mt-4 text-[11px] ${textMuted}`}>
              Tip: Use tabs + search to filter quickly. Click{" "}
              <span className={`font-semibold ${textMain}`}>View</span> to preview.
            </div>
          </motion.div>
        </>
      )}

      <AnimatePresence>
        {previewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={`w-full max-w-5xl rounded-3xl shadow-2xl border overflow-hidden ${
                dark ? "bg-[#07131f] border-cyan-300/15" : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`flex items-center justify-between px-5 py-4 border-b ${
                  dark ? "border-cyan-300/10 bg-[#0a1825]" : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="min-w-0">
                  <div className={`font-extrabold truncate text-sm ${textMain}`}>
                    {previewDoc.title?.trim() ? previewDoc.title : previewDoc.name}
                  </div>
                  <div className={`text-[11px] mt-1 truncate ${textMuted}`}>
                    {previewDoc.name} • {typeLabel(previewDoc.type)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={downloadUrl(previewDoc.fileId)}
                    className={`${btnSm} ${
                      dark
                        ? "bg-cyan-500/90 text-slate-950 hover:bg-cyan-400 font-bold"
                        : "bg-cyan-600 text-white hover:bg-cyan-500"
                    }`}
                  >
                    <CloudArrowDownIcon className="w-3.5 h-3.5" />
                    Download
                  </a>

                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className={`p-2 rounded-xl transition border ${
                      dark
                        ? "hover:bg-white/[0.06] border-cyan-300/10 bg-white/[0.03]"
                        : "hover:bg-white border-slate-300 bg-white"
                    }`}
                  >
                    <XMarkIcon className={`w-5 h-5 ${dark ? "text-cyan-100" : "text-slate-700"}`} />
                  </button>
                </div>
              </div>

              <div className="h-[75vh] bg-white">
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
        title="Document Deleted"
        message="The selected file has been removed successfully from the repository."
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
  );
}