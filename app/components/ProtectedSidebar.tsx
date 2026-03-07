"use client";

import ConfirmDialog from "@/app/components/ConfirmDialog";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Cog6ToothIcon,
  HomeIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "co_admin" | "staff" | string;
  avatar?: string;
};

function initials(name: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (a + b).toUpperCase();
}

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function canAccessSettings(role?: string) {
  const r = normalizeRole(role);
  return r === "admin" || r === "co_admin";
}

function canViewRegisteredStaff(role?: string) {
  return normalizeRole(role) === "admin";
}

function canUpload(role?: string) {
  const r = normalizeRole(role);
  return r === "admin" || r === "co_admin";
}

function roleLabel(role?: string) {
  const r = normalizeRole(role);
  if (!r) return "USER";
  if (r === "co_admin") return "CO-ADMIN";
  return r.toUpperCase();
}

export default function ProtectedSidebar({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [logoutErrorOpen, setLogoutErrorOpen] = useState(false);
  const [logoutErrorMsg, setLogoutErrorMsg] = useState("Please try again.");

  useEffect(() => {
    setConfirmLogout(false);
  }, [pathname]);

  const navBtn = (href: string, label: string, icon: React.ReactNode) => {
    const active = pathname === href;

    return (
      <button
        type="button"
        onClick={() => {
          if (pathname === href) return;
          router.push(href);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
          collapsed ? "justify-center" : ""
        } ${
          active
            ? "bg-slate-900 text-white"
            : "hover:bg-slate-100 text-slate-700"
        }`}
      >
        {icon}
        {!collapsed && <span className="font-semibold text-sm">{label}</span>}
      </button>
    );
  };

  return (
    <>
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-white">
        <div className="flex h-full">
          <motion.aside
            animate={{ width: collapsed ? 84 : 272 }}
            transition={{ type: "tween", duration: 0.18, ease: "easeOut" }}
            className="h-full shrink-0 overflow-hidden bg-white/80 backdrop-blur shadow-xl border-r p-5 flex flex-col"
            style={{ willChange: "width" }}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 rounded-xl hover:bg-slate-100 transition"
                title="Toggle sidebar"
              >
                <Bars3Icon className="w-6 h-6 text-slate-700" />
              </button>

              {!collapsed && (
                <span className="text-[11px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                  {roleLabel(user.role)}
                </span>
              )}
            </div>

            <div className={`mt-6 ${collapsed ? "text-center" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-slate-900 text-white grid place-items-center font-extrabold">
                  {initials(user.name)}
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-900 text-[15px] leading-tight">
                      Hamiguitan
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Repository
                    </div>
                  </div>
                )}
              </div>
            </div>

            <nav className="mt-8 space-y-2">
              {navBtn("/dashboard", "Dashboard", <HomeIcon className="w-5 h-5" />)}
              {navBtn("/research", "Documents", <DocumentTextIcon className="w-5 h-5" />)}

              {canUpload(user?.role) &&
                navBtn("/upload", "Upload", <ArrowUpTrayIcon className="w-5 h-5" />)}

              {canViewRegisteredStaff(user?.role) &&
                navBtn("/admin/users", "Registered Staff", <UserGroupIcon className="w-5 h-5" />)}

              {canAccessSettings(user?.role) &&
                navBtn("/settings", "Settings", <Cog6ToothIcon className="w-5 h-5" />)}
            </nav>

            <div className="mt-auto pt-5">
              <div
                className={`rounded-2xl border bg-white p-3 ${collapsed ? "hidden" : ""}`}
              >
                <div className="text-[11px] text-slate-500">Signed in as</div>
                <div className="font-semibold text-slate-800 truncate text-sm">
                  {user.email}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmLogout(true)}
                className={`mt-3 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition ${
                  collapsed ? "justify-center" : ""
                }`}
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                {!collapsed && <span className="font-semibold text-sm">Logout</span>}
              </button>
            </div>
          </motion.aside>

          <main className="flex-1 h-full overflow-y-auto">{children}</main>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        danger
        onCancel={() => setConfirmLogout(false)}
        onConfirm={async () => {
          setConfirmLogout(false);

          try {
            const res = await fetch("/api/logout", {
              method: "POST",
              credentials: "include",
            });

            if (!res.ok) {
              setLogoutErrorMsg("Please try again.");
              setLogoutErrorOpen(true);
              return;
            }

            window.location.replace("/login");
          } catch {
            setLogoutErrorMsg("Server unreachable. Please try again.");
            setLogoutErrorOpen(true);
          }
        }}
      />

      <ConfirmDialog
        open={logoutErrorOpen}
        title="Logout Failed"
        message={logoutErrorMsg}
        confirmText="OK"
        oneButton
        variant="warning"
        onConfirm={() => setLogoutErrorOpen(false)}
      />
    </>
  );
}