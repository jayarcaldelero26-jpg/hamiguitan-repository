"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useAuth } from "@/app/components/AuthProvider";
import {
  useDocuments,
  type DocumentRow,
} from "@/app/components/DocumentsProvider";
import {
  MagnifyingGlassIcon,
  FolderIcon,
  CloudArrowDownIcon,
  TrashIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { repoTheme, type PageTheme } from "@/app/lib/repoTheme";

type CategoryFilter = "All" | "Academe" | "Stakeholders" | "PAMO Activity";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toISOString().slice(0, 10);
}

function cleanFolder(folder?: string | null) {
  const f = (folder || "").trim();
  return f || "Unsorted";
}

function normalizeCat(raw?: string | null) {
  const c = (raw || "").toLowerCase().trim();
  if (c === "stakeholders" || c === "stakeholder") return "stakeholder";
  if (c === "academe") return "academe";
  if (c === "pamo activity" || c === "pamo" || c === "activity" || c === "activities") {
    return "pamo";
  }
  return c;
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

function canUpload(role?: string) {
  return role === "admin" || role === "co_admin";
}

function canDelete(role?: string) {
  return role === "admin";
}

function Badge({
  children,
  tone = "gray",
  dark,
}: {
  children: ReactNode;
  tone?: "gray" | "green" | "blue" | "amber";
  dark: boolean;
}) {
  const ui = repoTheme(dark ? "dark" : "light");

  const cls =
    tone === "green"
      ? ui.pillGreen
      : tone === "blue"
      ? ui.pillBlue
      : tone === "amber"
      ? ui.pillAmber
      : ui.pill;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

function SkeletonLine({
  className = "",
  dark,
}: {
  className?: string;
  dark: boolean;
}) {
  return (
    <div
      className={`animate-pulse rounded-full ${
        dark ? "bg-white/10" : "bg-[#235347]/10"
      } ${className}`}
    />
  );
}

function GroupCard({
  title,
  subtitle,
  headerTone,
  folders,
  groupedItems,
  loading,
  isOpen,
  toggleFolder,
  docUrl,
  onAskDelete,
  canDeleteDocs,
  dark,
}: {
  title: string;
  subtitle: string;
  headerTone: "green" | "blue" | "amber";
  folders: string[];
  groupedItems: Record<string, DocumentRow[]>;
  loading: boolean;
  isOpen: (folder: string) => boolean;
  toggleFolder: (folder: string) => void;
  docUrl: (d: DocumentRow) => string;
  onAskDelete: (id: number) => void;
  canDeleteDocs: boolean;
  dark: boolean;
}) {
  const ui = repoTheme(dark ? "dark" : "light");

  const cardCls = ui.card;

  const headerCls =
    headerTone === "green"
      ? dark
        ? "bg-[#163832]/50 border-white/8"
        : "bg-[#edf6f0] border-white/50"
      : headerTone === "blue"
      ? dark
        ? "bg-[#0B2B26]/55 border-white/8"
        : "bg-[#f1f6f3] border-white/50"
      : dark
      ? "bg-[#235347]/45 border-white/8"
      : "bg-[#f0f6f2] border-white/50";

  const titleCls = dark ? "text-[#DAF1DE]" : "text-[#163832]";
  const folderIconCls =
    headerTone === "green"
      ? dark
        ? "text-[#8EB69B]"
        : "text-[#235347]"
      : headerTone === "blue"
      ? dark
        ? "text-[#c8d8f0]"
        : "text-[#4d6f99]"
      : dark
      ? "text-[#f0cf97]"
      : "text-[#9d6c26]";
  const actionBtnCls = ui.buttonPrimary;
  const textMain = ui.textMain;
  const textMuted = ui.textMuted;
  const textSoft = ui.textSoft;
  const subBg = dark ? "bg-white/[0.03]" : "bg-white/45";
  const subBorder = dark ? "border-white/8" : "border-white/50";
  const accentBar =
    headerTone === "green"
      ? dark
        ? "bg-[#8EB69B]/55"
        : "bg-[#8EB69B]/70"
      : headerTone === "blue"
      ? dark
        ? "bg-[#8fb0d7]/50"
        : "bg-[#9fc0e6]/70"
      : dark
      ? "bg-[#d7aa6b]/68"
      : "bg-[#ddb16f]/82";

  return (
    <div className={`${cardCls} relative overflow-hidden`}>
      <div className={`absolute inset-x-0 top-0 h-2 ${accentBar}`} />
      <div className={`px-5 py-4 border-b ${headerCls}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className={`text-xl md:text-2xl font-semibold ${titleCls}`}>{title}</h2>
            <p className={`text-[12px] mt-1 ${textMuted}`}>{subtitle}</p>
          </div>

          {loading ? (
            <SkeletonLine dark={dark} className="h-8 w-10 rounded-full" />
          ) : (
            <div
              className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold ${subBg} ${subBorder} ${textMain}`}
            >
              {folders.reduce((sum, folder) => sum + (groupedItems[folder]?.length || 0), 0)}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3 min-h-[280px]">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`border rounded-[22px] p-4 ${subBg} ${subBorder}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`h-10 w-10 rounded-[16px] animate-pulse ${
                        dark ? "bg-white/10" : "bg-[#235347]/10"
                      }`}
                    />
                    <div className="flex-1 space-y-2">
                      <SkeletonLine dark={dark} className="h-4 w-40" />
                      <SkeletonLine dark={dark} className="h-3 w-20" />
                    </div>
                  </div>
                  <SkeletonLine dark={dark} className="h-5 w-5 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : folders.length === 0 ? (
          <div className="px-2 py-6">
            <div
              className={`mx-auto max-w-[280px] rounded-[22px] border px-5 py-6 text-center ${
                dark ? "border-white/8 bg-white/[0.03]" : "border-white/50 bg-white/40"
              }`}
            >
              <div
                className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[18px] border shadow-[0_10px_24px_rgba(0,0,0,0.08)] ${
                  dark ? "border-white/10 bg-white/[0.06]" : "border-white/70 bg-white/78"
                }`}
              >
                <FolderIcon className={`w-6 h-6 ${folderIconCls}`} />
              </div>
              <div className={`font-medium ${textMain}`}>No folders found</div>
              <div className={`mt-1 text-sm ${textMuted}`}>
                This section will show grouped records once repository files are available.
              </div>
            </div>
          </div>
        ) : (
          folders.map((folder) => {
            const open = isOpen(folder);
            const items = groupedItems[folder] || [];

            return (
              <div
                key={folder}
                className={`border rounded-[22px] overflow-hidden transition ${subBg} ${subBorder} ${
                  open
                    ? dark
                      ? "shadow-[0_16px_40px_rgba(0,0,0,0.22)]"
                      : "shadow-[0_16px_36px_rgba(17,24,39,0.08)]"
                    : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFolder(folder)}
                  aria-expanded={open}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition ${
                    open
                      ? dark
                        ? "bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                        : "bg-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                      : dark
                      ? "hover:bg-white/[0.035]"
                      : "hover:bg-white/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border shadow-[0_10px_24px_rgba(0,0,0,0.08)] ${
                        open
                          ? dark
                            ? "border-white/10 bg-white/[0.06]"
                            : "border-white/70 bg-white/80"
                          : `${subBg} ${subBorder}`
                      }`}
                    >
                      <FolderIcon className={`w-5 h-5 ${folderIconCls}`} />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className={`font-medium truncate ${textMain}`}>{folder}</div>
                      <div className={`text-[11px] ${textMuted}`}>
                        {items.length} file{items.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
                      open
                        ? dark
                          ? "border-white/10 bg-white/[0.06]"
                          : "border-white/70 bg-white/75"
                        : `${subBg} ${subBorder}`
                    }`}
                  >
                    <ChevronRightIcon
                      className={`h-5 w-5 transition-transform duration-200 ${
                        open ? `rotate-90 ${textMain}` : textMuted
                      }`}
                    />
                  </div>
                </button>

                {open && (
                  <div
                    className={`border-t p-3 ${
                      dark
                        ? "border-white/8 bg-black/10"
                        : "border-white/50 bg-white/35"
                    }`}
                  >
                    <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                      {items.map((d) => (
                        <div
                          key={d.id}
                          className={`rounded-[20px] border shadow-sm p-3 transition-all duration-200 ${subBg} ${subBorder} ${
                            dark ? "hover:bg-white/[0.05]" : "hover:bg-white"
                          }`}
                        >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className={`font-medium truncate ${textMain}`}>
                              {d.title?.trim() ? d.title : d.name}
                            </div>
                            <div className={`text-[11px] mt-1 truncate ${textMuted}`}>
                              {d.name}
                            </div>
                            <div className={`text-[11px] mt-1 truncate ${textSoft}`}>
                              {typeLabel(d.type)}
                            </div>
                          </div>

                          <div className="mt-3 sm:mt-0 flex flex-wrap items-center gap-2 shrink-0">
                            <a
                              href={docUrl(d)}
                              target="_blank"
                              rel="noopener noreferrer"
                            className={`inline-flex min-h-11 items-center gap-1.5 px-3 py-2 rounded-[14px] text-[11px] font-medium shadow-sm transition ${actionBtnCls}`}
                            >
                              <CloudArrowDownIcon className="w-4 h-4" />
                              <span>Download</span>
                            </a>

                            {canDeleteDocs && (
                              <button
                                type="button"
                                onClick={() => onAskDelete(d.id)}
                                className={`inline-flex min-h-11 items-center gap-1.5 px-3 py-2 rounded-[14px] text-[11px] font-medium transition shadow-sm ${ui.buttonDanger}`}
                              >
                                <TrashIcon className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge tone={headerTone} dark={dark}>
                            {d.year || "—"}
                          </Badge>
                          <Badge tone="gray" dark={dark}>
                            Received: {fmtDate(d.dateReceived)}
                          </Badge>
                          <Badge tone="gray" dark={dark}>
                            Uploaded: {fmtDate(d.uploadedAt)}
                          </Badge>
                        </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const fadeUpDelayed = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, delay },
});

export default function ResearchPage() {
  const router = useRouter();
  const { user: me, loading: loadingMe } = useAuth();
  const { documents: docs = [], loading: loadingDocs, refreshDocuments } = useDocuments();

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryFilter>("All");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("Done.");
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("Something went wrong.");
  const [openFolderKey, setOpenFolderKey] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [pageTheme, setPageTheme] = useState<PageTheme>("dark");

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

  const filteredDocs = useMemo(() => {
    const query = q.trim().toLowerCase();

    return docs.filter((d) => {
      const ncat = normalizeCat(d.category);

      if (cat !== "All") {
        if (cat === "Academe" && ncat !== "academe") return false;
        if (cat === "Stakeholders" && ncat !== "stakeholder") return false;
        if (cat === "PAMO Activity" && ncat !== "pamo") return false;
      }

      if (!query) return true;

      const hay = [
        d.title ?? "",
        d.name ?? "",
        d.folder ?? "",
        d.category ?? "",
        d.year ?? "",
        d.type ?? "",
        d.dateReceived ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(query);
    });
  }, [docs, q, cat]);

  const grouped = useMemo(() => {
    const out: Record<string, Record<string, DocumentRow[]>> = {
      Academe: {},
      Stakeholders: {},
      "PAMO Activity": {},
    };

    for (const d of filteredDocs) {
      const ncat = normalizeCat(d.category);

      const groupKey =
        ncat === "pamo"
          ? "PAMO Activity"
          : ncat === "academe"
          ? "Academe"
          : ncat === "stakeholder"
          ? "Stakeholders"
          : "Academe";

      const folderKey = cleanFolder(d.folder);

      if (!out[groupKey][folderKey]) out[groupKey][folderKey] = [];
      out[groupKey][folderKey].push(d);
    }

    for (const gKey of Object.keys(out)) {
      for (const fKey of Object.keys(out[gKey])) {
        out[gKey][fKey].sort((a, b) => {
          const da = (a.dateReceived || a.uploadedAt || "").toString();
          const db = (b.dateReceived || b.uploadedAt || "").toString();
          return da < db ? 1 : -1;
        });
      }
    }

    return out;
  }, [filteredDocs]);

  const docUrl = (d: DocumentRow) => `/api/documents/download?id=${d.fileId}`;

  const onDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/delete-documents?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMsg(data?.error || "Unable to delete.");
        setErrorOpen(true);
        return;
      }

      await refreshDocuments();
      setSuccessMsg("Document deleted successfully.");
      setSuccessOpen(true);
    } catch {
      setErrorMsg("Server unreachable.");
      setErrorOpen(true);
    }
  };

  const dark = pageTheme === "dark";
  const ui = repoTheme(pageTheme);

  const textMain = ui.textMain;
  const textMuted = ui.textMuted;
  const textSoft = ui.textSoft;
  const inputCls = `${ui.input} shadow-sm text-sm`;

  if (loadingMe || !me) {
    return (
      <div className={`${ui.page} min-h-full grid place-items-center p-6`}>
        <div className={`${ui.card} rounded-[24px] p-6 ${textMuted}`}>Loading…</div>
      </div>
    );
  }

  const academeFolders = Object.keys(grouped.Academe).sort((a, b) => a.localeCompare(b));
  const stakeFolders = Object.keys(grouped.Stakeholders).sort((a, b) => a.localeCompare(b));
  const pamoFolders = Object.keys(grouped["PAMO Activity"]).sort((a, b) => a.localeCompare(b));

  const isOpen = (group: string, folder: string) => openFolderKey === `${group}::${folder}`;

  const toggleFolder = (group: string, folder: string) => {
    const key = `${group}::${folder}`;
    setOpenFolderKey((prev) => (prev === key ? null : key));
  };

  return (
    <div className={`${ui.page} min-h-full p-4 sm:p-6 md:p-10`}>
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Document?"
        message="This document will be permanently deleted and cannot be recovered."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          const id = deleteId!;
          setDeleteId(null);
          await onDelete(id);
        }}
      />

      <ConfirmDialog
        open={successOpen}
        title="Document Deleted"
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

      <div className="max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div>
            <div className={`text-[11px] uppercase tracking-[0.18em] font-semibold ${textSoft}`}>
              Repository Browser
            </div>
            <h1 className={`text-3xl md:text-4xl font-bold mt-2 ${textMain}`}>
              Documents & Records
            </h1>
            <p className={`${textMuted} mt-2 text-sm`}>
              Browse files by <span className={`font-medium ${textMain}`}>Academe</span>,{" "}
              <span className={`font-medium ${textMain}`}>Stakeholders</span>, and{" "}
              <span className={`font-medium ${textMain}`}>PAMO Activity</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canUpload(me.role) && (
              <button
                type="button"
                onClick={() => router.push("/upload")}
                className={`min-h-11 px-4 py-2.5 rounded-[18px] transition font-medium text-sm ${ui.buttonPrimary}`}
              >
                Upload Document
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          {...fadeUpDelayed(0.04)}
          className={`${ui.shell} mt-6 p-4 sm:p-5`}
        >
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon
                  className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 ${
                    dark ? "text-[#8EB69B]/65" : "text-[#235347]/45"
                  }`}
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search title, filename, folder, year…"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value as CategoryFilter)}
                className={`min-h-11 px-4 py-3 rounded-[20px] border shadow-sm outline-none text-sm ${
                  dark
                    ? "border-white/10 bg-white/[0.04] text-[#DAF1DE] focus:ring-4 focus:ring-[#8EB69B]/10"
                    : "border-white/55 bg-white/55 text-[#163832] focus:ring-4 focus:ring-[#8EB69B]/18"
                }`}
              >
                <option className="text-slate-900" value="All">
                  All
                </option>
                <option className="text-slate-900" value="Academe">
                  Academe
                </option>
                <option className="text-slate-900" value="Stakeholders">
                  Stakeholders
                </option>
                <option className="text-slate-900" value="PAMO Activity">
                  PAMO Activity
                </option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setCat("All");
                }}
                className={`min-h-11 px-4 py-3 rounded-[20px] transition font-medium shadow-sm text-sm ${ui.buttonSecondary}`}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="text-sm mt-3">
            {loadingDocs ? (
              <SkeletonLine dark={dark} className="h-5 w-44" />
            ) : (
              <span className={textMuted}>
                Showing <span className={`font-medium ${textMain}`}>{filteredDocs.length}</span> of{" "}
                <span className={`font-medium ${textMain}`}>{docs.length}</span> documents
              </span>
            )}
          </div>
        </motion.div>

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
          <motion.div {...fadeUpDelayed(0.06)}>
            <GroupCard
              title="Academe"
              subtitle="Research studies and academic documents."
              headerTone="green"
              folders={academeFolders}
              groupedItems={grouped.Academe}
              loading={loadingDocs}
              isOpen={(folder) => isOpen("Academe", folder)}
              toggleFolder={(folder) => toggleFolder("Academe", folder)}
              docUrl={docUrl}
              onAskDelete={(id) => setDeleteId(id)}
              canDeleteDocs={canDelete(me.role)}
              dark={dark}
            />
          </motion.div>

          <motion.div {...fadeUpDelayed(0.09)}>
            <GroupCard
              title="Stakeholders"
              subtitle="PAMB, LGU, DENR, NGO letters, reports, and assessments."
              headerTone="blue"
              folders={stakeFolders}
              groupedItems={grouped.Stakeholders}
              loading={loadingDocs}
              isOpen={(folder) => isOpen("Stakeholders", folder)}
              toggleFolder={(folder) => toggleFolder("Stakeholders", folder)}
              docUrl={docUrl}
              onAskDelete={(id) => setDeleteId(id)}
              canDeleteDocs={canDelete(me.role)}
              dark={dark}
            />
          </motion.div>

          <motion.div {...fadeUpDelayed(0.12)}>
            <GroupCard
              title="PAMO Activity"
              subtitle="Internal activities, reports, photos, and monitoring files."
              headerTone="amber"
              folders={pamoFolders}
              groupedItems={grouped["PAMO Activity"]}
              loading={loadingDocs}
              isOpen={(folder) => isOpen("PAMO Activity", folder)}
              toggleFolder={(folder) => toggleFolder("PAMO Activity", folder)}
              docUrl={docUrl}
              onAskDelete={(id) => setDeleteId(id)}
              canDeleteDocs={canDelete(me.role)}
              dark={dark}
            />
          </motion.div>
        </div>

        <div className={`mt-6 text-[12px] ${textMuted}`}>
          Tip: Keep folder names consistent so grouped records stay clean and easy to browse.
        </div>
      </div>
    </div>
  );
}
