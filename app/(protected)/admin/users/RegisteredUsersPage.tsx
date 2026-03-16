"use client";

import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useAuth } from "@/app/components/AuthProvider";
import {
  useUsers,
  type UserRow,
  type UserRole,
  type EmploymentType,
} from "@/app/components/UsersProvider";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { repoTheme } from "@/app/lib/repoTheme";

type PageTheme = "dark" | "light";

function initials(name: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toISOString().slice(0, 10);
}

function safeText(value: unknown, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  const s = String(value).trim();
  return s === "" ? fallback : s;
}

function HeaderUsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16 21v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="9.5" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M22 21v-1a4 4 0 00-3-3.87"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 3.13a4 4 0 010 7.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M15 9V7a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2h2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4 12.5-12.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Pill({
  tone,
  children,
  dark,
}: {
  tone: "green" | "blue" | "purple" | "slate" | "amber";
  children: React.ReactNode;
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
      : tone === "purple"
      ? dark
        ? "bg-[#235347]/55 text-[#DAF1DE] border border-white/8"
        : "bg-[#edf5ef] text-[#235347] border border-white/50"
      : ui.pill;

  return (
    <span
      className={`inline-flex w-fit max-w-full items-center whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-semibold leading-none ${cls}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  tone = "slate",
  dark,
}: {
  label: string;
  value: number;
  tone?: "slate" | "green" | "blue";
  dark: boolean;
}) {
  const ui = repoTheme(dark ? "dark" : "light");
  const accentCls =
    tone === "green"
      ? dark
        ? "bg-[#8EB69B]/55"
        : "bg-[#8EB69B]/70"
      : tone === "blue"
      ? dark
        ? "bg-[#8fb0d7]/50"
        : "bg-[#9fc0e6]/70"
      : dark
      ? "bg-[#7c8798]/60"
      : "bg-[#a7b0bd]/78";
  const valueCls =
    tone === "green"
      ? dark
        ? "text-[#DAF1DE]"
        : "text-[#235347]"
      : tone === "blue"
      ? dark
        ? "text-[#DAF1DE]"
        : "text-[#163832]"
      : dark
      ? "text-[#DAF1DE]"
      : "text-[#163832]";

  return (
    <div className={`${ui.card} relative overflow-hidden px-5 py-5`}>
      <div className={`absolute inset-x-0 top-0 h-2 ${accentCls}`} />
      <div
        className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${ui.textSoft}`}
      >
        {label}
      </div>
      <div className={`mt-2 text-4xl font-bold tracking-tight ${valueCls}`}>{value}</div>
    </div>
  );
}

function IconButton({
  onClick,
  title,
  children,
  dark,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  dark: boolean;
}) {
  const ui = repoTheme(dark ? "dark" : "light");
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`h-10 w-10 rounded-xl transition shadow-sm grid place-items-center ${ui.buttonSecondary}`}
    >
      {children}
    </button>
  );
}

function roleTone(role: UserRole) {
  if (role === "admin") return "blue";
  if (role === "co_admin") return "amber";
  return "green";
}

function roleLabel(role: UserRole) {
  if (role === "co_admin") return "co_admin";
  return role;
}

function normalizeValue(v: unknown) {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v.trim();
  return String(v);
}

function hasUserChanges(original: UserRow, draft: UserRow) {
  return (
    normalizeValue(original.name) !== normalizeValue(draft.name) ||
    normalizeValue(original.email).toLowerCase() !== normalizeValue(draft.email).toLowerCase() ||
    normalizeValue(original.role) !== normalizeValue(draft.role) ||
    normalizeValue(original.position) !== normalizeValue(draft.position) ||
    normalizeValue(original.department) !== normalizeValue(draft.department) ||
    normalizeValue(original.employmentType) !== normalizeValue(draft.employmentType) ||
    normalizeValue(original.contact) !== normalizeValue(draft.contact) ||
    normalizeValue(original.birthdate) !== normalizeValue(draft.birthdate) ||
    normalizeValue(original.userCode) !== normalizeValue(draft.userCode)
  );
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

const EMPTY_USER: UserRow = {
  id: 0,
  name: "",
  email: "",
  role: "staff",
  userCode: "",
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  birthdate: "",
  employmentType: "",
  contact: "",
  position: "",
  department: "",
  createdAt: "",
};

const fadeUpDelayed = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, delay },
});

export default function RegisteredUsersPage() {
  const router = useRouter();
  const { user: me, loading: loadingMe } = useAuth();
  const { users, loading: loadingUsers, refreshing, refreshUsers } = useUsers();

  const [pageTheme, setPageTheme] = useState<PageTheme>("dark");

  const [q, setQ] = useState("");
  const [empFilter, setEmpFilter] = useState<
    "all" | "Job Order" | "Contract of Service" | "Casual" | "Permanent"
  >("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "co_admin" | "staff">("all");

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [draftUser, setDraftUser] = useState<UserRow>(EMPTY_USER);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("Done.");

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("Something went wrong.");

  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMsg, setInfoMsg] = useState("Done.");

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
    if (loadingMe) return;

    if (!me) {
      router.replace("/login");
      return;
    }

    if (me.role !== "admin" && me.role !== "co_admin") {
      router.replace("/dashboard");
    }
  }, [loadingMe, me, router]);

  const isAdmin = me?.role === "admin";
  const canManage = isAdmin;

  const stats = useMemo(() => {
    if (loadingUsers) {
      return { total: 0, admins: 0, coAdmins: 0, staff: 0 };
    }

    const total = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const coAdmins = users.filter((u) => u.role === "co_admin").length;
    const staff = users.filter((u) => u.role === "staff").length;
    return { total, admins, coAdmins, staff };
  }, [users, loadingUsers]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return users
      .filter((u) => {
        if (empFilter !== "all" && (u.employmentType || "") !== empFilter) return false;
        if (roleFilter !== "all" && (u.role || "") !== roleFilter) return false;

        if (!query) return true;

        const hay = [
          safeText(u.name, ""),
          safeText(u.email, ""),
          safeText(u.role, ""),
          safeText(u.userCode, ""),
          safeText(u.firstName, ""),
          safeText(u.middleName, ""),
          safeText(u.lastName, ""),
          safeText(u.suffix, ""),
          safeText(u.birthdate, ""),
          safeText(u.employmentType, ""),
          safeText(u.contact, ""),
          safeText(u.position, ""),
          safeText(u.department, ""),
          safeText(u.createdAt, ""),
          String(u.id),
        ]
          .join(" ")
          .toLowerCase();

        return hay.includes(query);
      })
      .sort((a, b) => (a.id < b.id ? 1 : -1));
  }, [users, q, empFilter, roleFilter]);

  const copyEmail = async (email: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(email);
      } else {
        const input = document.createElement("textarea");
        input.value = email;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }

      setInfoMsg("Email copied to clipboard.");
      setInfoOpen(true);
    } catch {
      setErrorMsg("Clipboard not allowed.");
      setErrorOpen(true);
    }
  };

  const clear = () => {
    setQ("");
    setEmpFilter("all");
    setRoleFilter("all");
  };

  const openUser = (u: UserRow) => {
    setSelectedUser(u);
    setDraftUser({
      ...EMPTY_USER,
      ...u,
      id: Number(u.id),
      userCode: safeText(u.userCode, ""),
      contact: safeText(u.contact, ""),
      employmentType: (safeText(u.employmentType, "") as EmploymentType) ?? "",
    });
    setEditMode(false);
  };

  const closeUser = () => {
    setSelectedUser(null);
    setEditMode(false);
  };

  const hasChanges = selectedUser ? hasUserChanges(selectedUser, draftUser) : false;

  const saveUser = async () => {
    if (!selectedUser) return;

    if (!hasUserChanges(selectedUser, draftUser)) {
      setEditMode(false);
      closeUser();
      setInfoMsg("No changes were made.");
      setInfoOpen(true);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draftUser,
          id: Number(draftUser.id),
          userCode: safeText(draftUser.userCode, ""),
          contact: safeText(draftUser.contact, ""),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMsg(data?.error || "Could not update user.");
        setErrorOpen(true);
        return;
      }

      setSelectedUser(data?.user || draftUser);
      setDraftUser((data?.user || draftUser) as UserRow);
      setEditMode(false);
      closeUser();

      setSuccessMsg(data?.message || "User information updated successfully.");
      setSuccessOpen(true);
      await refreshUsers({ silent: true });
    } catch {
      setErrorMsg("Server unreachable.");
      setErrorOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMsg(data?.error || "Could not delete user.");
        setErrorOpen(true);
        return;
      }

      setSuccessMsg("User deleted successfully.");
      setSuccessOpen(true);

      setDeleteTarget(null);
      if (selectedUser?.id === deleteTarget.id) closeUser();
      await refreshUsers({ silent: true });
    } catch {
      setErrorMsg("Server unreachable.");
      setErrorOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const dark = pageTheme === "dark";
  const ui = repoTheme(pageTheme);
  const inputCls = `${ui.input.replace("pl-11", "pl-4")} h-12`;
  const modalInputCls = dark
    ? "mt-1 w-full h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-[#DAF1DE] outline-none focus:ring-4 focus:ring-[#8EB69B]/10 focus:border-[#8EB69B]/25 disabled:bg-white/[0.03] disabled:text-[#DAF1DE]/60"
    : "mt-1 w-full h-11 rounded-xl border border-white/55 bg-white/60 px-3 text-sm text-[#163832] outline-none focus:ring-4 focus:ring-[#8EB69B]/18 focus:border-[#8EB69B]/55 disabled:bg-white/40 disabled:text-[#235347]/55";

  if (loadingMe || !me) {
    return (
      <div className={`${ui.page} h-full`}>
        <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col gap-4">
          <div
            className={`${ui.shell} px-4 sm:px-6 py-5 sm:py-6`}
          >
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={
                    dark
                      ? "h-16 w-16 rounded-3xl bg-cyan-400/12 border border-cyan-300/20 text-cyan-100 grid place-items-center"
                      : "h-16 w-16 rounded-3xl bg-cyan-50 border border-cyan-200 text-cyan-700 grid place-items-center"
                  }
                >
                  <HeaderUsersIcon />
                </div>

                <div>
                  <Skeleton className="h-11 w-72" dark={dark} />
                  <Skeleton className="h-4 w-80 mt-3 rounded-full" dark={dark} />
                </div>
              </div>

              <Skeleton className="h-12 w-28 rounded-2xl" dark={dark} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${ui.page} h-full`}>
      <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
          className={`${ui.shell} px-4 sm:px-6 py-5 sm:py-6`}
        >
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={
                  dark
                    ? "h-16 w-16 rounded-3xl bg-white/[0.06] border border-white/10 text-[#b8c4d6] grid place-items-center shadow-[0_12px_28px_rgba(0,0,0,0.10)]"
                    : "h-16 w-16 rounded-3xl bg-[#eff3f7] border border-white/60 text-[#5d6c80] grid place-items-center shadow-[0_12px_24px_rgba(17,24,39,0.06)]"
                }
              >
                <HeaderUsersIcon />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1
                    className={`text-3xl md:text-4xl leading-none tracking-tight font-bold ${
                      dark
                        ? "text-white drop-shadow-[0_0_12px_rgba(34,211,238,0.12)]"
                        : "text-slate-900"
                    }`}
                  >
                    Registered Users
                  </h1>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide border ${
                      dark
                        ? "bg-white/[0.05] border-white/10 text-[#DAF1DE]"
                        : "bg-white/55 border-white/60 text-[#235347]"
                    }`}
                  >
                    {isAdmin ? "ADMIN ACCESS" : "CO-ADMIN VIEW ONLY"}
                  </span>
                </div>
                <p className={`mt-2 text-sm ${dark ? "text-cyan-100/70" : "text-slate-600"}`}>
                  {isAdmin
                    ? "Click a user row to view, edit, update, delete, or assign co-admin."
                    : "View-only mode. Co-admin can inspect user information but cannot edit, delete, or assign roles."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={async () => {
                  await refreshUsers();
                  setInfoMsg("User list updated.");
                  setInfoOpen(true);
                }}
                disabled={refreshing}
                className={`min-h-11 h-12 px-6 rounded-2xl transition font-semibold ${ui.buttonSecondary} disabled:opacity-70`}
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <motion.div {...fadeUpDelayed(0)}>
              <StatCard label="Total Users" value={stats.total} dark={dark} />
            </motion.div>
            <motion.div {...fadeUpDelayed(0.03)}>
              <StatCard label="Staff" value={stats.staff} tone="green" dark={dark} />
            </motion.div>
            <motion.div {...fadeUpDelayed(0.06)}>
              <StatCard label="Co-Admins" value={stats.coAdmins} tone="slate" dark={dark} />
            </motion.div>
            <motion.div {...fadeUpDelayed(0.09)}>
              <StatCard label="Admins" value={stats.admins} tone="blue" dark={dark} />
            </motion.div>
          </div>

          <motion.div
            {...fadeUpDelayed(0.11)}
            className={`mt-5 rounded-[26px] p-4 relative overflow-hidden ${
              dark
                ? "border border-white/8 bg-white/[0.03] shadow-inner"
                : "border border-white/50 bg-white/38"
            }`}
          >
            <div className={`absolute inset-x-0 top-0 h-1.5 ${dark ? "bg-[#7c8798]/45" : "bg-[#a7b0bd]/65"}`} />
            <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
              <div className="flex-1">
                <div className="relative">
                  <span
                    className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      dark ? "text-cyan-100/45" : "text-slate-400"
                    }`}
                  >
                    🔎
                  </span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search name, email, position, department, code, contact…"
                    className={`w-full h-12 rounded-2xl pl-11 pr-4 text-sm shadow-sm outline-none ${
                      dark
                        ? "border border-cyan-300/12 bg-white/[0.04] text-white placeholder:text-cyan-100/35 focus:ring-4 focus:ring-cyan-400/10 focus:border-cyan-300/25"
                        : "border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-cyan-100 focus:border-cyan-400"
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "co_admin" | "staff")}
                  className={inputCls}
                >
                  <option className="text-slate-900" value="all">
                    All roles
                  </option>
                  <option className="text-slate-900" value="staff">
                    Staff
                  </option>
                  <option className="text-slate-900" value="co_admin">
                    Co-Admin
                  </option>
                  <option className="text-slate-900" value="admin">
                    Admin
                  </option>
                </select>

                <select
                  value={empFilter}
                  onChange={(e) =>
                    setEmpFilter(
                      e.target.value as "all" | "Job Order" | "Contract of Service" | "Casual" | "Permanent"
                    )
                  }
                  className={inputCls}
                >
                  <option className="text-slate-900" value="all">
                    All employment types
                  </option>
                  <option className="text-slate-900" value="Job Order">
                    Job Order
                  </option>
                  <option className="text-slate-900" value="Contract of Service">
                    Contract of Service
                  </option>
                  <option className="text-slate-900" value="Casual">
                    Casual
                  </option>
                  <option className="text-slate-900" value="Permanent">
                    Permanent
                  </option>
                </select>

                <button
                  type="button"
                  onClick={clear}
                  className={`h-12 px-5 rounded-2xl border transition font-medium shadow-sm text-sm ${
                    dark
                      ? "border-cyan-300/12 bg-white/[0.05] text-white hover:bg-white/[0.08]"
                      : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className={`mt-3 text-sm ${dark ? "text-cyan-100/60" : "text-slate-500"}`}>
              Showing{" "}
              <span className={`font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className={`font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                {users.length}
              </span>{" "}
              users
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          {...fadeUpDelayed(0.14)}
          className={`${ui.card} flex-1 min-h-0 overflow-hidden flex flex-col`}
        >
          <div className="md:hidden p-3 space-y-3 overflow-y-auto">
            {loadingUsers ? null : filtered.length === 0 ? (
              <div
                className={`rounded-[22px] border px-4 py-8 text-center ${
                  dark ? "border-white/8 bg-white/[0.03]" : "border-white/50 bg-white/40"
                }`}
              >
                <div className={`font-medium ${dark ? "text-[#DAF1DE]" : "text-[#163832]"}`}>
                  No users found
                </div>
                <div className={`mt-1 text-sm ${dark ? "text-[#DAF1DE]/60" : "text-[#235347]/70"}`}>
                  No users matched the current search or filters.
                </div>
              </div>
            ) : (
              filtered.map((u) => (
                <div
                  key={`mobile-user-${u.id}`}
                  onClick={() => openUser(u)}
                  className={`rounded-[22px] border p-4 transition ${ui.rowHover} ${
                    dark ? "border-white/8 bg-white/[0.03]" : "border-white/50 bg-white/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={
                          dark
                            ? "h-11 w-11 shrink-0 rounded-full bg-cyan-400/12 border border-cyan-300/18 text-white grid place-items-center text-sm font-bold shadow-sm"
                            : "h-11 w-11 shrink-0 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 grid place-items-center text-sm font-bold shadow-sm"
                        }
                      >
                        {initials(u.name || "U")}
                      </div>
                      <div className="min-w-0">
                        <div className={`truncate text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                          {safeText(u.name)}
                        </div>
                        <div className={`mt-0.5 text-xs truncate ${dark ? "text-cyan-100/75" : "text-slate-600"}`}>
                          {safeText(u.email)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <IconButton onClick={() => copyEmail(safeText(u.email, ""))} title="Copy Email" dark={dark}>
                        <CopyIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => openUser(u)}
                        title={isAdmin ? "Manage User" : "View User"}
                        dark={dark}
                      >
                        <EditIcon />
                      </IconButton>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill tone={roleTone(u.role)} dark={dark}>
                      {roleLabel(u.role)}
                    </Pill>
                    <Pill tone="purple" dark={dark}>
                      {safeText(u.employmentType)}
                    </Pill>
                  </div>

                  <div className={`mt-3 grid grid-cols-1 gap-2 text-[12px] ${dark ? "text-cyan-100/75" : "text-slate-600"}`}>
                    <div>
                      Code: <span className={dark ? "text-white" : "text-slate-900"}>{safeText(u.userCode)}</span>
                    </div>
                    <div>
                      Created: <span className={dark ? "text-white" : "text-slate-900"}>{fmtDate(u.createdAt)}</span>
                    </div>
                    <div>
                      Position: <span className={dark ? "text-white" : "text-slate-900"}>{safeText(u.position)}</span>
                    </div>
                    <div>
                      Department: <span className={dark ? "text-white" : "text-slate-900"}>{safeText(u.department)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block flex-1 overflow-auto">
            <table className="min-w-[1180px] w-full text-sm">
              <thead className={`sticky top-0 z-10 backdrop-blur border-b ${ui.tableHead}`}>
                <tr
                  className={`text-left text-[11px] uppercase tracking-[0.08em] ${
                    dark ? "text-cyan-100/55" : "text-slate-500"
                  }`}
                >
                  <th className="px-5 py-4 font-semibold">User</th>
                  <th className="px-5 py-4 font-semibold">Email</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Employment</th>
                  <th className="px-5 py-4 font-semibold">Position</th>
                  <th className="px-5 py-4 font-semibold">Department</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                  <th className="px-5 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>

              <tbody className={dark ? "divide-y divide-white/8" : "divide-y divide-white/50"}>
                {loadingUsers ? null : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12"
                    >
                      <div className="mx-auto max-w-[320px] text-center">
                        <div
                          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] border shadow-[0_10px_24px_rgba(0,0,0,0.08)] ${
                            dark
                              ? "border-white/10 bg-white/[0.06] text-[#b8c4d6]"
                              : "border-white/60 bg-[#eff3f7] text-[#5d6c80]"
                          }`}
                        >
                          <HeaderUsersIcon />
                        </div>
                        <div className={`font-medium ${dark ? "text-[#DAF1DE]" : "text-[#163832]"}`}>
                          No users found
                        </div>
                        <div className={`mt-1 text-sm ${dark ? "text-[#DAF1DE]/60" : "text-[#235347]/70"}`}>
                          Try adjusting the current search or filter settings.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr
                      key={`user-${u.id}`}
                      onClick={() => openUser(u)}
                      className={`cursor-pointer transition-all duration-200 ${ui.rowHover}`}
                    >
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-4 min-w-[260px]">
                          <div
                            className={
                              dark
                                ? "h-12 w-12 shrink-0 rounded-full bg-cyan-400/12 border border-cyan-300/18 text-white grid place-items-center text-sm font-bold shadow-sm"
                                : "h-12 w-12 shrink-0 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 grid place-items-center text-sm font-bold shadow-sm"
                            }
                          >
                            {initials(u.name || "U")}
                          </div>

                          <div className="min-w-0">
                            <div
                              className={`truncate text-[15px] font-medium ${
                                dark ? "text-white" : "text-slate-900"
                              }`}
                            >
                              {safeText(u.name)}
                            </div>
                            <div
                              className={`mt-0.5 text-[11px] ${
                                dark ? "text-cyan-100/45" : "text-slate-400"
                              }`}
                            >
                              ID: {String(u.id)}
                            </div>
                            <div
                              className={`mt-0.5 text-[11px] ${
                                dark ? "text-cyan-100/45" : "text-slate-400"
                              }`}
                            >
                              Code: {safeText(u.userCode)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <div
                          className={`max-w-[290px] truncate text-sm ${
                            dark ? "text-cyan-100" : "text-slate-700"
                          }`}
                        >
                          {safeText(u.email)}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <div className="flex">
                          <Pill tone={roleTone(u.role)} dark={dark}>
                            {roleLabel(u.role)}
                          </Pill>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <div className="flex">
                          <Pill tone="purple" dark={dark}>
                            {safeText(u.employmentType)}
                          </Pill>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <div
                          className={`max-w-[220px] truncate text-sm ${
                            dark ? "text-cyan-100/85" : "text-slate-700"
                          }`}
                          title={safeText(u.position)}
                        >
                          {safeText(u.position)}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <div
                          className={`max-w-[300px] truncate text-sm ${
                            dark ? "text-cyan-100/85" : "text-slate-700"
                          }`}
                          title={safeText(u.department)}
                        >
                          {safeText(u.department)}
                        </div>
                      </td>

                      <td
                        className={`px-5 py-4 align-middle whitespace-nowrap text-sm ${
                          dark ? "text-cyan-100/75" : "text-slate-500"
                        }`}
                      >
                        {fmtDate(u.createdAt)}
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <IconButton onClick={() => copyEmail(safeText(u.email, ""))} title="Copy Email" dark={dark}>
                            <CopyIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => openUser(u)}
                            title={isAdmin ? "Manage User" : "View User"}
                            dark={dark}
                          >
                            <EditIcon />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div
            className={`border-t px-5 py-3 text-[11px] ${
              dark
                ? "border-white/8 bg-white/[0.03] text-[#DAF1DE]/50"
                : "border-white/50 bg-white/35 text-[#235347]/70"
            }`}
          >
            Note: Passwords are not shown for security. Only admin can manage users and assign co-admin.
          </div>
        </motion.div>

        <div className={`text-center text-[11px] ${dark ? "text-cyan-100/35" : "text-slate-400"}`}>
          © {new Date().getFullYear()} MHRWS Repository • Admin Panel
        </div>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
                className={`relative w-full max-w-3xl max-h-[92dvh] rounded-[24px] sm:rounded-[30px] overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.28)] ${ui.modal}`}
              >
              <div className={`absolute inset-x-6 top-0 h-1.5 rounded-b-full ${dark ? "bg-[#7c8798]/55" : "bg-[#a7b0bd]/72"}`} />
              <div
                className={`px-4 sm:px-6 py-4 sm:py-5 flex items-start justify-between gap-4 border-b ${
                  dark ? "border-white/8 bg-[#051F20]/45" : "border-white/55 bg-white/45"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={
                      dark
                        ? "h-14 w-14 rounded-full bg-white/[0.06] border border-white/10 text-[#DAF1DE] grid place-items-center text-lg font-bold shadow-[0_10px_24px_rgba(0,0,0,0.10)]"
                        : "h-14 w-14 rounded-full bg-white/75 border border-white/60 text-[#5d6c80] grid place-items-center text-lg font-bold shadow-[0_10px_24px_rgba(17,24,39,0.06)]"
                    }
                  >
                    {initials(draftUser.name || "U")}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={`text-xl font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                        User Manager
                      </h2>
                      <Pill tone={roleTone(draftUser.role)} dark={dark}>
                        {roleLabel(draftUser.role)}
                      </Pill>
                    </div>
                    <p className={`mt-1 text-sm ${dark ? "text-[#DAF1DE]/65" : "text-[#235347]/70"}`}>
                      View full information, edit details, delete account, or assign co-admin.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeUser}
                  className={
                    dark
                      ? "h-10 w-10 rounded-[16px] border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-[#DAF1DE]/70 hover:text-white transition shadow-sm grid place-items-center"
                      : "h-10 w-10 rounded-[16px] border border-white/60 bg-white/75 hover:bg-white text-[#5d6c80] hover:text-[#163832] transition shadow-sm grid place-items-center"
                  }
                  title="Close"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="p-4 sm:p-6 max-h-[78dvh] overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={dark ? "text-[11px] font-semibold text-cyan-100/55" : "text-[11px] font-semibold text-slate-500"}>
                      Full Name
                    </label>
                    <input
                      value={String(draftUser.name ?? "")}
                      disabled={!editMode || !canManage}
                      onChange={(e) => setDraftUser((p) => ({ ...p, name: e.target.value }))}
                      className={modalInputCls}
                    />
                  </div>

                  <div>
                    <label className={dark ? "text-[11px] font-semibold text-cyan-100/55" : "text-[11px] font-semibold text-slate-500"}>
                      Email
                    </label>
                    <input
                      value={String(draftUser.email ?? "")}
                      disabled={!editMode || !canManage}
                      onChange={(e) => setDraftUser((p) => ({ ...p, email: e.target.value }))}
                      className={modalInputCls}
                    />
                  </div>

                  <div>
                    <label className={dark ? "text-[11px] font-semibold text-cyan-100/55" : "text-[11px] font-semibold text-slate-500"}>
                      Role
                    </label>
                    <select
                      value={draftUser.role}
                      disabled={!editMode || !canManage}
                      onChange={(e) => setDraftUser((p) => ({ ...p, role: e.target.value as UserRole }))}
                      className={modalInputCls}
                    >
                      <option className="text-slate-900" value="staff">
                        Staff
                      </option>
                      <option className="text-slate-900" value="co_admin">
                        Co-Admin
                      </option>
                      <option className="text-slate-900" value="admin">
                        Admin
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className={dark ? "text-[11px] font-semibold text-cyan-100/55" : "text-[11px] font-semibold text-slate-500"}>
                      Employment Type
                    </label>
                    <select
                      value={String(draftUser.employmentType ?? "")}
                      disabled={!editMode || !canManage}
                      onChange={(e) =>
                        setDraftUser((p) => ({
                          ...p,
                          employmentType: e.target.value as EmploymentType,
                        }))
                      }
                      className={modalInputCls}
                    >
                      <option className="text-slate-900" value="">
                        —
                      </option>
                      <option className="text-slate-900" value="Job Order">
                        Job Order
                      </option>
                      <option className="text-slate-900" value="Contract of Service">
                        Contract of Service
                      </option>
                      <option className="text-slate-900" value="Casual">
                        Casual
                      </option>
                      <option className="text-slate-900" value="Permanent">
                        Permanent
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className={dark ? "text-[11px] font-semibold text-cyan-100/55" : "text-[11px] font-semibold text-slate-500"}>
                      Position
                    </label>
                    <input
                      value={String(draftUser.position ?? "")}
                      disabled={!editMode || !canManage}
                      onChange={(e) => setDraftUser((p) => ({ ...p, position: e.target.value }))}
                      className={modalInputCls}
                    />
                  </div>

                  <div>
                    <label className={dark ? "text-[11px] font-semibold text-cyan-100/55" : "text-[11px] font-semibold text-slate-500"}>
                      Department
                    </label>
                    <input
                      value={String(draftUser.department ?? "")}
                      disabled={!editMode || !canManage}
                      onChange={(e) => setDraftUser((p) => ({ ...p, department: e.target.value }))}
                      className={modalInputCls}
                    />
                  </div>

                  <div>
                    <label className={dark ? "text-[11px] font-semibold text-cyan-100/55" : "text-[11px] font-semibold text-slate-500"}>
                      Contact
                    </label>
                    <input
                      value={String(draftUser.contact ?? "")}
                      disabled={!editMode || !canManage}
                      onChange={(e) => setDraftUser((p) => ({ ...p, contact: e.target.value }))}
                      className={modalInputCls}
                    />
                  </div>

                  <div>
                    <label className={dark ? "text-[11px] font-semibold text-cyan-100/55" : "text-[11px] font-semibold text-slate-500"}>
                      Birthdate
                    </label>
                    <input
                      type="date"
                      value={String(draftUser.birthdate ?? "")}
                      disabled={!editMode || !canManage}
                      onChange={(e) => setDraftUser((p) => ({ ...p, birthdate: e.target.value }))}
                      className={modalInputCls}
                    />
                  </div>

                  <div>
                    <label className={dark ? "text-[11px] font-semibold text-cyan-100/55" : "text-[11px] font-semibold text-slate-500"}>
                      User Code
                    </label>
                    <input
                      value={String(draftUser.userCode ?? "")}
                      disabled={!editMode || !canManage}
                      onChange={(e) => setDraftUser((p) => ({ ...p, userCode: e.target.value }))}
                      className={modalInputCls}
                    />
                  </div>

                  <div>
                    <label className={dark ? "text-[11px] font-semibold text-cyan-100/55" : "text-[11px] font-semibold text-slate-500"}>
                      Created
                    </label>
                    <input
                      value={fmtDate(draftUser.createdAt)}
                      disabled
                      className={
                        dark
                          ? "mt-1 w-full h-11 rounded-xl border border-cyan-300/12 bg-white/[0.03] px-3 text-sm text-cyan-100/55"
                          : "mt-1 w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
                      }
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(selectedUser)}
                      className={
                        dark
                          ? "h-11 px-5 rounded-2xl border border-cyan-300/12 bg-white/[0.05] text-white hover:bg-white/[0.08] transition font-medium"
                          : "h-11 px-5 rounded-2xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition font-medium"
                      }
                    >
                      Delete User
                    </button>
                  ) : (
                    <div className={dark ? "text-sm text-cyan-100/55" : "text-sm text-slate-500"}>
                      View-only access
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-end">
                    {canManage ? (
                      !editMode ? (
                        <button
                          type="button"
                          onClick={() => setEditMode(true)}
                          className={
                            dark
                              ? "h-11 px-5 rounded-2xl border border-cyan-300/12 bg-white/[0.05] text-white hover:bg-white/[0.08] transition font-medium"
                              : "h-11 px-5 rounded-2xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition font-medium"
                          }
                        >
                          Edit
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (!selectedUser) return;
                              setDraftUser({
                                ...EMPTY_USER,
                                ...selectedUser,
                                id: Number(selectedUser.id),
                                userCode: safeText(selectedUser.userCode, ""),
                                contact: safeText(selectedUser.contact, ""),
                                employmentType: (safeText(selectedUser.employmentType, "") as EmploymentType) ?? "",
                              });
                              setEditMode(false);
                            }}
                            className={
                              dark
                                ? "h-11 px-5 rounded-2xl border border-cyan-300/12 bg-white/[0.05] text-white hover:bg-white/[0.08] transition font-medium"
                                : "h-11 px-5 rounded-2xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition font-medium"
                            }
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={saveUser}
                            disabled={saving || !hasChanges}
                            className={`h-11 px-5 rounded-2xl transition font-semibold disabled:opacity-70 ${ui.buttonPrimary}`}
                          >
                            {saving ? "Saving..." : !hasChanges ? "No Changes" : "Save Changes"}
                          </button>
                        </>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={closeUser}
                        className={
                          dark
                            ? "h-11 px-5 rounded-2xl border border-cyan-300/12 bg-white/[0.05] text-white hover:bg-white/[0.08] transition font-medium"
                            : "h-11 px-5 rounded-2xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition font-medium"
                        }
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete User?"
        message={
          deleteTarget
            ? `Are you sure you want to delete ${safeText(deleteTarget.name)}? This action cannot be undone.`
            : "Are you sure?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={successOpen}
        title="Success"
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

      <ConfirmDialog
        open={infoOpen}
        title="Notice"
        message={infoMsg}
        confirmText="OK"
        oneButton
        variant="info"
        onConfirm={() => setInfoOpen(false)}
      />
    </div>
  );
}
