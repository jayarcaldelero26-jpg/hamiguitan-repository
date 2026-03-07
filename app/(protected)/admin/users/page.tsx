"use client";

import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useAuth } from "@/app/components/AuthProvider";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type UserRole = "admin" | "co_admin" | "staff";
type EmploymentType = "Job Order" | "Contract of Service" | "Casual" | "Permanent" | "";
type PageTheme = "dark" | "light";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  userCode?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  suffix?: string | null;
  birthdate?: string | null;
  position?: string | null;
  department?: string | null;
  employmentType?: EmploymentType | null;
  contact?: string | null;
  createdAt?: string | null;
};

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
  if (isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
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
  const cls = dark
    ? tone === "green"
      ? "bg-emerald-400/12 text-emerald-200 border-emerald-300/20"
      : tone === "blue"
      ? "bg-cyan-400/12 text-cyan-100 border-cyan-300/20"
      : tone === "purple"
      ? "bg-violet-400/12 text-violet-200 border-violet-300/20"
      : tone === "amber"
      ? "bg-amber-400/12 text-amber-200 border-amber-300/20"
      : "bg-white/[0.06] text-cyan-100 border-cyan-300/10"
    : tone === "green"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : tone === "blue"
    ? "bg-cyan-50 text-cyan-700 border-cyan-200"
    : tone === "purple"
    ? "bg-violet-50 text-violet-700 border-violet-200"
    : tone === "amber"
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={`inline-flex w-fit max-w-full items-center whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-semibold leading-none ${cls}`}
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
  const valueCls =
    tone === "green"
      ? dark
        ? "text-emerald-200"
        : "text-emerald-700"
      : tone === "blue"
      ? dark
        ? "text-cyan-100"
        : "text-cyan-700"
      : dark
      ? "text-white"
      : "text-slate-900";

  return (
    <div
      className={
        dark
          ? "rounded-3xl border border-cyan-300/12 bg-white/[0.04] px-5 py-5 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-md"
          : "rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
      }
    >
      <div
        className={
          dark
            ? "text-xs font-semibold uppercase tracking-[0.08em] text-cyan-100/55"
            : "text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
        }
      >
        {label}
      </div>
      <div className={`mt-2 text-4xl font-extrabold tracking-tight ${valueCls}`}>{value}</div>
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
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={
        dark
          ? "h-10 w-10 rounded-xl border border-cyan-300/10 bg-white/[0.05] text-cyan-100/70 hover:text-white hover:bg-white/[0.09] transition shadow-sm grid place-items-center"
          : "h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm grid place-items-center"
      }
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

function normalizeValue(v: any) {
  return (v ?? "").toString().trim();
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
    normalizeValue(original.birthdate) !== normalizeValue(draft.birthdate)
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

export default function RegisteredUsersPage() {
  const router = useRouter();
  const { user: me, loading: loadingMe } = useAuth();

  const [pageTheme, setPageTheme] = useState<PageTheme>("dark");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

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

  const fetchUsers = () => {
    setLoadingUsers(true);
    fetch("/api/admin/users", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUsers(Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : []);
      })
      .finally(() => setLoadingUsers(false));
  };

  useEffect(() => {
    if (loadingMe || !me) return;
    fetchUsers();
  }, [loadingMe, me]);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const coAdmins = users.filter((u) => u.role === "co_admin").length;
    const staff = users.filter((u) => u.role === "staff").length;
    return { total, admins, coAdmins, staff };
  }, [users]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return users
      .filter((u) => {
        if (empFilter !== "all" && (u.employmentType || "") !== empFilter) return false;
        if (roleFilter !== "all" && (u.role || "") !== roleFilter) return false;

        if (!query) return true;

        const hay = [
          u.name,
          u.email,
          u.role,
          u.userCode ?? "",
          u.firstName ?? "",
          u.middleName ?? "",
          u.lastName ?? "",
          u.suffix ?? "",
          u.birthdate ?? "",
          u.employmentType ?? "",
          u.contact ?? "",
          u.position ?? "",
          u.department ?? "",
          u.createdAt ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return hay.includes(query);
      })
      .sort((a, b) => (a.id < b.id ? 1 : -1));
  }, [users, q, empFilter, roleFilter]);

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
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
      employmentType: (u.employmentType ?? "") as EmploymentType,
    });
    setEditMode(false);
  };

  const closeUser = () => {
    setSelectedUser(null);
    setDraftUser(EMPTY_USER);
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
        body: JSON.stringify(draftUser),
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
      fetchUsers();
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
      fetchUsers();
    } catch {
      setErrorMsg("Server unreachable.");
      setErrorOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const dark = pageTheme === "dark";

  const inputCls = dark
    ? "w-full h-12 rounded-2xl border border-cyan-300/12 bg-white/[0.04] px-4 text-[15px] text-white placeholder:text-cyan-100/35 shadow-sm outline-none focus:ring-4 focus:ring-cyan-400/10 focus:border-cyan-300/25"
    : "w-full h-12 rounded-2xl border border-slate-300 bg-white px-4 text-[15px] text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-400";

  const modalInputCls = dark
    ? "mt-1 w-full h-11 rounded-xl border border-cyan-300/12 bg-white/[0.04] px-3 text-sm text-white outline-none focus:ring-4 focus:ring-cyan-400/10 focus:border-cyan-300/25 disabled:bg-white/[0.03] disabled:text-cyan-100/60"
    : "mt-1 w-full h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-400 disabled:bg-slate-50 disabled:text-slate-500";

  if (loadingMe || !me) {
    return (
      <div className="min-h-full grid place-items-center">
        <div
          className={`rounded-2xl px-6 py-5 shadow-sm ${
            dark
              ? "border border-cyan-300/12 bg-white/[0.05] text-cyan-100/80"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full ${dark ? "text-slate-100" : "text-slate-900"}`}>
      <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-4">
        <div
          className={`rounded-[30px] px-6 py-6 ${
            dark
              ? "border border-cyan-300/12 bg-white/[0.04] backdrop-blur-md shadow-[0_18px_50px_rgba(0,0,0,0.20)]"
              : "border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
          }`}
        >
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={
                  dark
                    ? "h-16 w-16 rounded-3xl bg-cyan-400/12 border border-cyan-300/20 text-cyan-100 grid place-items-center shadow-[0_0_20px_rgba(34,211,238,0.12)]"
                    : "h-16 w-16 rounded-3xl bg-cyan-50 border border-cyan-200 text-cyan-700 grid place-items-center"
                }
              >
                <HeaderUsersIcon />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1
                    className={`text-[2.5rem] leading-none tracking-tight font-extrabold ${
                      dark
                        ? "text-white drop-shadow-[0_0_12px_rgba(34,211,238,0.12)]"
                        : "text-slate-900"
                    }`}
                  >
                    Registered Users
                  </h1>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-wide border ${
                      dark
                        ? "bg-cyan-400/10 border-cyan-300/18 text-cyan-100"
                        : "bg-cyan-50 border-cyan-200 text-cyan-700"
                    }`}
                  >
                    {isAdmin ? "ADMIN ACCESS" : "CO-ADMIN VIEW ONLY"}
                  </span>
                </div>
                <p className={`mt-2 text-[15px] ${dark ? "text-cyan-100/70" : "text-slate-600"}`}>
                  {isAdmin
                    ? "Click a user row to view, edit, update, delete, or assign co-admin."
                    : "View-only mode. Co-admin can inspect user information but cannot edit, delete, or assign roles."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  fetchUsers();
                  setInfoMsg("Updating user list…");
                  setInfoOpen(true);
                }}
                className={`h-12 px-6 rounded-2xl transition font-extrabold ${
                  dark
                    ? "bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.18)]"
                    : "bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm"
                }`}
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={stats.total} dark={dark} />
            <StatCard label="Staff" value={stats.staff} tone="green" dark={dark} />
            <StatCard label="Co-Admins" value={stats.coAdmins} tone="slate" dark={dark} />
            <StatCard label="Admins" value={stats.admins} tone="blue" dark={dark} />
          </div>

          <div
            className={`mt-5 rounded-[26px] p-4 ${
              dark
                ? "border border-cyan-300/12 bg-white/[0.03] shadow-inner"
                : "border border-slate-200 bg-slate-50"
            }`}
          >
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
                    placeholder="Search name, email, position, department…"
                    className={`w-full h-12 rounded-2xl pl-11 pr-4 text-[15px] shadow-sm outline-none ${
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
                  onChange={(e) => setRoleFilter(e.target.value as any)}
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
                  onChange={(e) => setEmpFilter(e.target.value as any)}
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
                  onClick={clear}
                  className={`h-12 px-5 rounded-2xl border transition font-semibold shadow-sm ${
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
              <span className={`font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className={`font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                {users.length}
              </span>{" "}
              users
            </div>
          </div>
        </div>

        <div
          className={`flex-1 min-h-0 rounded-[30px] overflow-hidden flex flex-col ${
            dark
              ? "border border-cyan-300/12 bg-white/[0.04] shadow-[0_18px_50px_rgba(0,0,0,0.20)] backdrop-blur-md"
              : "border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
          }`}
        >
          <div className="flex-1 overflow-auto">
            <table className="min-w-[1180px] w-full text-sm">
              <thead
                className={`sticky top-0 z-10 backdrop-blur border-b ${
                  dark ? "bg-[#0a1825]/95 border-cyan-300/10" : "bg-white/95 border-slate-200"
                }`}
              >
                <tr
                  className={`text-left text-[12px] uppercase tracking-[0.08em] ${
                    dark ? "text-cyan-100/55" : "text-slate-500"
                  }`}
                >
                  <th className="px-5 py-4 font-bold">User</th>
                  <th className="px-5 py-4 font-bold">Email</th>
                  <th className="px-5 py-4 font-bold">Role</th>
                  <th className="px-5 py-4 font-bold">Employment</th>
                  <th className="px-5 py-4 font-bold">Position</th>
                  <th className="px-5 py-4 font-bold">Department</th>
                  <th className="px-5 py-4 font-bold">Created</th>
                  <th className="px-5 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>

              <tbody className={dark ? "divide-y divide-cyan-300/8" : "divide-y divide-slate-200"}>
                {loadingUsers ? (
                  <tr>
                    <td
                      colSpan={8}
                      className={`px-5 py-10 ${dark ? "text-cyan-100/60" : "text-slate-500"}`}
                    >
                      Loading users…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className={`px-5 py-12 ${dark ? "text-cyan-100/60" : "text-slate-500"}`}
                    >
                      No users found. Try changing search/filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => openUser(u)}
                      className={`transition-colors cursor-pointer ${
                        dark ? "hover:bg-white/[0.035]" : "hover:bg-slate-50"
                      }`}
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
                              className={`truncate text-[16px] font-semibold ${
                                dark ? "text-white" : "text-slate-900"
                              }`}
                            >
                              {u.name}
                            </div>
                            <div
                              className={`mt-0.5 text-xs ${
                                dark ? "text-cyan-100/45" : "text-slate-400"
                              }`}
                            >
                              ID: {u.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <div
                          className={`max-w-[290px] truncate text-[15px] ${
                            dark ? "text-cyan-100" : "text-slate-700"
                          }`}
                        >
                          {u.email}
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
                            {u.employmentType ?? "—"}
                          </Pill>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <div
                          className={`max-w-[220px] truncate text-[15px] ${
                            dark ? "text-cyan-100/85" : "text-slate-700"
                          }`}
                          title={u.position ?? ""}
                        >
                          {u.position ?? "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <div
                          className={`max-w-[300px] truncate text-[15px] ${
                            dark ? "text-cyan-100/85" : "text-slate-700"
                          }`}
                          title={u.department ?? ""}
                        >
                          {u.department ?? "—"}
                        </div>
                      </td>

                      <td
                        className={`px-5 py-4 align-middle whitespace-nowrap text-[15px] ${
                          dark ? "text-cyan-100/75" : "text-slate-500"
                        }`}
                      >
                        {fmtDate(u.createdAt)}
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <IconButton onClick={() => copyEmail(u.email)} title="Copy Email" dark={dark}>
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
            className={`border-t px-5 py-3 text-xs ${
              dark
                ? "border-cyan-300/10 bg-white/[0.03] text-cyan-100/50"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            Note: Passwords are not shown for security. Only admin can manage users and assign co-admin.
          </div>
        </div>

        <div className={`text-center text-xs ${dark ? "text-cyan-100/35" : "text-slate-400"}`}>
          © {new Date().getFullYear()} MHRWS Repository • Admin Panel
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-3xl rounded-[30px] overflow-hidden ${
              dark
                ? "border border-cyan-300/12 bg-[#07131f] shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
                : "border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
            }`}
          >
            <div
              className={`px-6 py-5 flex items-start justify-between gap-4 border-b ${
                dark ? "border-cyan-300/10 bg-[#0a1825]" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={
                    dark
                      ? "h-14 w-14 rounded-full bg-cyan-400/12 border border-cyan-300/18 text-white grid place-items-center text-lg font-bold shadow-sm"
                      : "h-14 w-14 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 grid place-items-center text-lg font-bold shadow-sm"
                  }
                >
                  {initials(draftUser.name || "U")}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className={`text-xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                      User Manager
                    </h2>
                    <Pill tone={roleTone(draftUser.role)} dark={dark}>
                      {roleLabel(draftUser.role)}
                    </Pill>
                  </div>
                  <p className={`mt-1 text-sm ${dark ? "text-cyan-100/65" : "text-slate-500"}`}>
                    View full information, edit details, delete account, or assign co-admin.
                  </p>
                </div>
              </div>

              <button
                onClick={closeUser}
                className={
                  dark
                    ? "h-10 w-10 rounded-xl border border-cyan-300/10 bg-white/[0.04] hover:bg-white/[0.08] text-cyan-100/70 hover:text-white transition grid place-items-center"
                    : "h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition grid place-items-center"
                }
                title="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="p-6 max-h-[78vh] overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={
                      dark ? "text-xs font-semibold text-cyan-100/55" : "text-xs font-semibold text-slate-500"
                    }
                  >
                    Full Name
                  </label>
                  <input
                    value={draftUser.name}
                    disabled={!editMode || !canManage}
                    onChange={(e) => setDraftUser((p) => ({ ...p, name: e.target.value }))}
                    className={modalInputCls}
                  />
                </div>

                <div>
                  <label
                    className={
                      dark ? "text-xs font-semibold text-cyan-100/55" : "text-xs font-semibold text-slate-500"
                    }
                  >
                    Email
                  </label>
                  <input
                    value={draftUser.email}
                    disabled={!editMode || !canManage}
                    onChange={(e) => setDraftUser((p) => ({ ...p, email: e.target.value }))}
                    className={modalInputCls}
                  />
                </div>

                <div>
                  <label
                    className={
                      dark ? "text-xs font-semibold text-cyan-100/55" : "text-xs font-semibold text-slate-500"
                    }
                  >
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
                  <label
                    className={
                      dark ? "text-xs font-semibold text-cyan-100/55" : "text-xs font-semibold text-slate-500"
                    }
                  >
                    Employment Type
                  </label>
                  <select
                    value={draftUser.employmentType ?? ""}
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
                  <label
                    className={
                      dark ? "text-xs font-semibold text-cyan-100/55" : "text-xs font-semibold text-slate-500"
                    }
                  >
                    Position
                  </label>
                  <input
                    value={draftUser.position ?? ""}
                    disabled={!editMode || !canManage}
                    onChange={(e) => setDraftUser((p) => ({ ...p, position: e.target.value }))}
                    className={modalInputCls}
                  />
                </div>

                <div>
                  <label
                    className={
                      dark ? "text-xs font-semibold text-cyan-100/55" : "text-xs font-semibold text-slate-500"
                    }
                  >
                    Department
                  </label>
                  <input
                    value={draftUser.department ?? ""}
                    disabled={!editMode || !canManage}
                    onChange={(e) => setDraftUser((p) => ({ ...p, department: e.target.value }))}
                    className={modalInputCls}
                  />
                </div>

                <div>
                  <label
                    className={
                      dark ? "text-xs font-semibold text-cyan-100/55" : "text-xs font-semibold text-slate-500"
                    }
                  >
                    Contact
                  </label>
                  <input
                    value={draftUser.contact ?? ""}
                    disabled={!editMode || !canManage}
                    onChange={(e) => setDraftUser((p) => ({ ...p, contact: e.target.value }))}
                    className={modalInputCls}
                  />
                </div>

                <div>
                  <label
                    className={
                      dark ? "text-xs font-semibold text-cyan-100/55" : "text-xs font-semibold text-slate-500"
                    }
                  >
                    Birthdate
                  </label>
                  <input
                    type="date"
                    value={draftUser.birthdate ?? ""}
                    disabled={!editMode || !canManage}
                    onChange={(e) => setDraftUser((p) => ({ ...p, birthdate: e.target.value }))}
                    className={modalInputCls}
                  />
                </div>

                <div>
                  <label
                    className={
                      dark ? "text-xs font-semibold text-cyan-100/55" : "text-xs font-semibold text-slate-500"
                    }
                  >
                    User Code
                  </label>
                  <input
                    value={draftUser.userCode ?? ""}
                    disabled
                    className={
                      dark
                        ? "mt-1 w-full h-11 rounded-xl border border-cyan-300/12 bg-white/[0.03] px-3 text-sm text-cyan-100/55"
                        : "mt-1 w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
                    }
                  />
                </div>

                <div>
                  <label
                    className={
                      dark ? "text-xs font-semibold text-cyan-100/55" : "text-xs font-semibold text-slate-500"
                    }
                  >
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
                        ? "h-11 px-5 rounded-2xl border border-cyan-300/12 bg-white/[0.05] text-white hover:bg-white/[0.08] transition font-semibold"
                        : "h-11 px-5 rounded-2xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition font-semibold"
                    }
                  >
                    Delete User
                  </button>
                ) : (
                  <div className={dark ? "text-sm text-cyan-100/55" : "text-sm text-slate-500"}>
                    View-only access
                  </div>
                )}

                <div className="flex items-center gap-3 justify-end">
                  {canManage ? (
                    !editMode ? (
                      <button
                        type="button"
                        onClick={() => setEditMode(true)}
                        className={
                          dark
                            ? "h-11 px-5 rounded-2xl border border-cyan-300/12 bg-white/[0.05] text-white hover:bg-white/[0.08] transition font-semibold"
                            : "h-11 px-5 rounded-2xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition font-semibold"
                        }
                      >
                        Edit
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setDraftUser({ ...selectedUser });
                            setEditMode(false);
                          }}
                          className={
                            dark
                              ? "h-11 px-5 rounded-2xl border border-cyan-300/12 bg-white/[0.05] text-white hover:bg-white/[0.08] transition font-semibold"
                              : "h-11 px-5 rounded-2xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition font-semibold"
                          }
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={saveUser}
                          disabled={saving || !hasChanges}
                          className={
                            dark
                              ? "h-11 px-5 rounded-2xl bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 transition font-extrabold shadow-[0_0_18px_rgba(34,211,238,0.18)] disabled:opacity-70"
                              : "h-11 px-5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white transition font-extrabold shadow-sm disabled:opacity-70"
                          }
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
                          ? "h-11 px-5 rounded-2xl border border-cyan-300/12 bg-white/[0.05] text-white hover:bg-white/[0.08] transition font-semibold"
                          : "h-11 px-5 rounded-2xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition font-semibold"
                      }
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete User?"
        message={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.`
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