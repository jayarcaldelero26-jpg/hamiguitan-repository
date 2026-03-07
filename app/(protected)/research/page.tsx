"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useAuth } from "@/app/components/AuthProvider";
import {
  MagnifyingGlassIcon,
  FolderIcon,
  CloudArrowDownIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

type DocRow = {
  id: number;
  fileId: string;
  name: string;
  type: string;
  category: string;
  year: string;
  uploadedAt: string;
  title?: string | null;
  dateReceived?: string | null;
  folder?: string | null;
};

type PageTheme = "dark" | "light";

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
  children: React.ReactNode;
  tone?: "gray" | "green" | "blue" | "amber";
  dark: boolean;
}) {
  const cls =
    tone === "green"
      ? dark
        ? "bg-emerald-400/12 text-emerald-200 border-emerald-300/20"
        : "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "blue"
      ? dark
        ? "bg-indigo-400/12 text-indigo-200 border-indigo-300/20"
        : "bg-indigo-50 text-indigo-700 border-indigo-200"
      : tone === "amber"
      ? dark
        ? "bg-amber-400/12 text-amber-200 border-amber-300/20"
        : "bg-amber-50 text-amber-700 border-amber-200"
      : dark
      ? "bg-cyan-400/8 text-cyan-100 border-cyan-300/15"
      : "bg-cyan-50 text-cyan-700 border-cyan-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cls}`}
    >
      {children}
    </span>
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
  groupedItems: Record<string, DocRow[]>;
  loading: boolean;
  isOpen: (folder: string) => boolean;
  toggleFolder: (folder: string) => void;
  docUrl: (d: DocRow) => string;
  onAskDelete: (id: number) => void;
  canDeleteDocs: boolean;
  dark: boolean;
}) {
  const cardCls = dark
    ? "bg-white/[0.04] border border-cyan-300/12 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-md"
    : "bg-white/85 border border-slate-200 shadow-[0_10px_28px_rgba(15,23,42,0.08)]";

  const headerCls =
    headerTone === "green"
      ? dark
        ? "bg-emerald-400/8 border-emerald-300/12"
        : "bg-emerald-50 border-emerald-200"
      : headerTone === "blue"
      ? dark
        ? "bg-indigo-400/8 border-indigo-300/12"
        : "bg-indigo-50 border-indigo-200"
      : dark
      ? "bg-amber-400/8 border-amber-300/12"
      : "bg-amber-50 border-amber-200";

  const titleCls =
    headerTone === "green"
      ? dark
        ? "text-emerald-200"
        : "text-emerald-700"
      : headerTone === "blue"
      ? dark
        ? "text-indigo-200"
        : "text-indigo-700"
      : dark
      ? "text-amber-200"
      : "text-amber-700";

  const folderIconCls =
    headerTone === "green"
      ? dark
        ? "text-emerald-200"
        : "text-emerald-600"
      : headerTone === "blue"
      ? dark
        ? "text-indigo-200"
        : "text-indigo-600"
      : dark
      ? "text-amber-200"
      : "text-amber-600";

  const actionBtnCls =
    headerTone === "green"
      ? dark
        ? "bg-emerald-500/90 hover:bg-emerald-400 text-slate-950"
        : "bg-emerald-600 hover:bg-emerald-500 text-white"
      : headerTone === "blue"
      ? dark
        ? "bg-indigo-500/90 hover:bg-indigo-400 text-white"
        : "bg-indigo-600 hover:bg-indigo-500 text-white"
      : dark
      ? "bg-amber-500/90 hover:bg-amber-400 text-slate-950"
      : "bg-amber-500 hover:bg-amber-400 text-slate-950";

  const textMain = dark ? "text-white" : "text-slate-900";
  const textMuted = dark ? "text-cyan-100/65" : "text-slate-600";
  const subBg = dark ? "bg-white/[0.03]" : "bg-slate-50";
  const subBorder = dark ? "border-cyan-300/10" : "border-slate-200";

  return (
    <div className={`${cardCls} rounded-3xl overflow-hidden`}>
      <div className={`px-5 py-5 border-b ${headerCls}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className={`text-2xl font-extrabold ${titleCls}`}>{title}</h2>
            <p className={`text-sm mt-1 ${textMuted}`}>{subtitle}</p>
          </div>
          <div
            className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold ${subBg} ${subBorder} ${textMain}`}
          >
            {folders.reduce((sum, folder) => sum + (groupedItems[folder]?.length || 0), 0)}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 min-h-[260px]">
        {loading ? (
          <div className={`${textMuted} px-2 py-6`}>Loading…</div>
        ) : folders.length === 0 ? (
          <div className={`${textMuted} px-2 py-6`}>No folders found.</div>
        ) : (
          folders.map((folder) => {
            const open = isOpen(folder);
            const items = groupedItems[folder] || [];

            return (
              <div
                key={folder}
                className={`border rounded-2xl overflow-hidden ${subBg} ${subBorder}`}
              >
                <button
                  onClick={() => toggleFolder(folder)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition ${
                    dark ? "hover:bg-white/[0.04]" : "hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FolderIcon className={`w-6 h-6 ${folderIconCls}`} />
                    <div className="min-w-0 text-left">
                      <div className={`font-extrabold truncate ${textMain}`}>{folder}</div>
                      <div className={`text-xs ${textMuted}`}>
                        {items.length} file{items.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>

                  {open ? (
                    <ChevronDownIcon className={`w-5 h-5 ${textMuted}`} />
                  ) : (
                    <ChevronRightIcon className={`w-5 h-5 ${textMuted}`} />
                  )}
                </button>

                {open && (
                  <div
                    className={`border-t p-3 space-y-3 ${
                      dark
                        ? "border-cyan-300/10 bg-black/10"
                        : "border-slate-200 bg-white/70"
                    }`}
                  >
                    {items.map((d) => (
                      <div
                        key={d.id}
                        className={`rounded-2xl border shadow-sm p-3 transition ${subBg} ${subBorder} ${
                          dark ? "hover:bg-white/[0.05]" : "hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`font-extrabold truncate ${textMain}`}>
                              {d.title?.trim() ? d.title : d.name}
                            </div>
                            <div className={`text-xs mt-0.5 truncate ${textMuted}`}>
                              {d.type || "Unknown"}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={docUrl(d)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition ${actionBtnCls}`}
                            >
                              <CloudArrowDownIcon className="w-4 h-4" />
                              <span className="hidden sm:inline">Download</span>
                            </a>

                            {canDeleteDocs && (
                              <button
                                onClick={() => onAskDelete(d.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm ${
                                  dark
                                    ? "bg-slate-800 text-white hover:bg-slate-700"
                                    : "bg-slate-800 text-white hover:bg-slate-700"
                                }`}
                              >
                                <TrashIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Delete</span>
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

                        <div className={`mt-2 text-xs break-words ${textMuted}`}>
                          <span className={`font-semibold ${textMain}`}>File:</span> {d.name}
                        </div>
                      </div>
                    ))}
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

export default function ResearchPage() {
  const router = useRouter();
  const { user: me, loading: loadingMe } = useAuth();

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"All" | "Academe" | "Stakeholder" | "PAMO Activity">("All");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("Done.");
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("Something went wrong.");
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
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

  useEffect(() => {
    let mounted = true;

    setLoadingDocs(true);

    fetch("/api/documents", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!mounted) return;
        setDocs(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!mounted) return;
        setDocs([]);
      })
      .finally(() => {
        if (mounted) setLoadingDocs(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredDocs = useMemo(() => {
    const query = q.trim().toLowerCase();

    return docs.filter((d) => {
      const ncat = normalizeCat(d.category);

      if (cat !== "All") {
        if (cat === "Academe" && ncat !== "academe") return false;
        if (cat === "Stakeholder" && ncat !== "stakeholder") return false;
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
    const out: Record<string, Record<string, DocRow[]>> = {
      Academe: {},
      Stakeholders: {},
      "PAMO Activity": {},
    };

    for (const d of filteredDocs) {
      const ncat = normalizeCat(d.category);
      const isAcademe = ncat === "academe";
      const isStake = ncat === "stakeholder";
      const isPamo = ncat === "pamo";

      const groupKey = isPamo
        ? "PAMO Activity"
        : isAcademe
        ? "Academe"
        : isStake
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

  const docUrl = (d: DocRow) => `/api/documents/download?id=${d.fileId}`;

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

      setDocs((prev) => prev.filter((x) => x.id !== id));
      setSuccessMsg("Document deleted successfully.");
      setSuccessOpen(true);
    } catch {
      setErrorMsg("Server unreachable.");
      setErrorOpen(true);
    }
  };

  const dark = pageTheme === "dark";
  const cardCls = dark
    ? "bg-white/[0.04] border border-cyan-300/12 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-md"
    : "bg-white/85 border border-slate-200 shadow-[0_10px_28px_rgba(15,23,42,0.08)]";
  const textMain = dark ? "text-white" : "text-slate-900";
  const textMuted = dark ? "text-cyan-100/65" : "text-slate-600";
  const inputCls = dark
    ? "w-full pl-10 pr-4 py-3 rounded-2xl border border-cyan-300/15 bg-white/[0.04] text-white placeholder-cyan-100/40 shadow-sm outline-none focus:ring-4 focus:ring-cyan-400/10 focus:border-cyan-300/30 caret-cyan-200"
    : "w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-400 caret-cyan-700";

  if (loadingMe || !me) {
    return (
      <div className="min-h-full grid place-items-center p-6">
        <div className={`${cardCls} rounded-2xl p-6 ${textMuted}`}>Loading…</div>
      </div>
    );
  }

  const academeFolders = Object.keys(grouped.Academe).sort((a, b) => a.localeCompare(b));
  const stakeFolders = Object.keys(grouped.Stakeholders).sort((a, b) => a.localeCompare(b));
  const pamoFolders = Object.keys(grouped["PAMO Activity"]).sort((a, b) => a.localeCompare(b));

  const isOpen = (group: string, folder: string) => !!openFolders[`${group}::${folder}`];

  const toggleFolder = (group: string, folder: string) => {
    const key = `${group}::${folder}`;
    setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={`min-h-full p-6 md:p-10 ${dark ? "text-slate-100" : "text-slate-900"}`}>
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Document?"
        message="This document will be permanently deleted and cannot be recovered."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          const id = deleteId!;
          setDeleteId(null);
          onDelete(id);
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
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className={`text-4xl md:text-5xl font-extrabold ${textMain}`}>
              Documents/Records
            </h1>
            <p className={`${textMuted} mt-2`}>
              Browse documents by <span className={`font-semibold ${textMain}`}>Academe</span>,{" "}
              <span className={`font-semibold ${textMain}`}>Stakeholders</span>, and{" "}
              <span className={`font-semibold ${textMain}`}>PAMO Activity</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canUpload(me.role) && (
              <button
                onClick={() => router.push("/upload")}
                className={`px-4 py-2.5 rounded-2xl transition font-extrabold ${
                  dark
                    ? "bg-cyan-500/90 text-slate-950 hover:bg-cyan-400"
                    : "bg-cyan-600 text-white hover:bg-cyan-500"
                }`}
              >
                Upload
              </button>
            )}
          </div>
        </div>

        <div className={`${cardCls} mt-6 rounded-3xl p-5`}>
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon
                  className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 ${
                    dark ? "text-cyan-100/45" : "text-slate-400"
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
                onChange={(e) => setCat(e.target.value as any)}
                className={`px-4 py-3 rounded-2xl border shadow-sm outline-none ${
                  dark
                    ? "border-cyan-300/15 bg-white/[0.04] text-white focus:ring-4 focus:ring-cyan-400/10"
                    : "border-slate-300 bg-white text-slate-900 focus:ring-4 focus:ring-cyan-100"
                }`}
              >
                <option className="text-slate-900" value="All">
                  All
                </option>
                <option className="text-slate-900" value="Academe">
                  Academe
                </option>
                <option className="text-slate-900" value="Stakeholder">
                  Stakeholders
                </option>
                <option className="text-slate-900" value="PAMO Activity">
                  PAMO Activity
                </option>
              </select>

              <button
                onClick={() => {
                  setQ("");
                  setCat("All");
                }}
                className={`px-4 py-3 rounded-2xl border transition font-semibold shadow-sm ${
                  dark
                    ? "border-cyan-300/15 bg-white/[0.05] text-white hover:bg-white/[0.08]"
                    : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                }`}
              >
                Clear
              </button>
            </div>
          </div>

          <div className={`text-sm mt-3 ${textMuted}`}>
            Showing <span className={`font-bold ${textMain}`}>{filteredDocs.length}</span> of{" "}
            <span className={`font-bold ${textMain}`}>{docs.length}</span> documents
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
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

          <GroupCard
            title="Stakeholders"
            subtitle="PAMB members, LGU, DENR reports, letters, assessments."
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
        </div>

        <div className={`mt-6 text-xs ${textMuted}`}>
          Tip: Upload documents with Category + Folder (School/Project, Stakeholder name, or
          Activity group) to keep this view organized.
        </div>
      </div>
    </div>
  );
}