"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { motion } from "framer-motion";
import { useAuth } from "@/app/components/AuthProvider";
import {
  HomeIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

type PageTheme = "dark" | "light";

function initials(name: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (a + b).toUpperCase();
}

function canAccessSettings(role?: string) {
  return role === "admin" || role === "co_admin";
}

function canViewRegisteredStaff(role?: string) {
  return role === "admin";
}

function canUpload(role?: string) {
  return role === "admin" || role === "co_admin";
}

function roleLabel(role?: string) {
  if (!role) return "USER";
  if (role === "co_admin") return "CO-ADMIN";
  return role.toUpperCase();
}

function darkButtonStyle() {
  return "bg-white/[0.05] text-white border-cyan-300/12 hover:bg-white/[0.08]";
}

export default function ProtectedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [pageTheme, setPageTheme] = useState<PageTheme>("dark");

  const [logoutSuccessOpen, setLogoutSuccessOpen] = useState(false);
  const [logoutErrorOpen, setLogoutErrorOpen] = useState(false);
  const [logoutErrorMsg, setLogoutErrorMsg] = useState("Please try again.");

  useEffect(() => {
    setConfirmLogout(false);
  }, [pathname]);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? (localStorage.getItem("page-theme") as PageTheme | null)
        : null;

    if (saved === "dark" || saved === "light") {
      setPageTheme(saved);
      if (typeof document !== "undefined") {
        document.documentElement.dataset.pageTheme = saved;
      }
    } else if (typeof document !== "undefined") {
      document.documentElement.dataset.pageTheme = "dark";
    }
  }, []);

  useEffect(() => {
    const onThemeChanged = () => {
      const saved =
        typeof window !== "undefined"
          ? (localStorage.getItem("page-theme") as PageTheme | null)
          : null;

      if (saved === "dark" || saved === "light") {
        setPageTheme(saved);
        if (typeof document !== "undefined") {
          document.documentElement.dataset.pageTheme = saved;
        }
      }
    };

    window.addEventListener("page-theme-changed", onThemeChanged);
    return () => window.removeEventListener("page-theme-changed", onThemeChanged);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const handleNavigate = (href: string) => {
    if (pathname === href) return;
    router.prefetch(href);
    router.push(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020817]">
        <div className="bg-[#071c2a] rounded-2xl border border-cyan-300/15 p-6 w-[360px] text-center">
          <div className="animate-pulse">
            <div className="h-10 w-10 rounded-full bg-cyan-300/20 mx-auto mb-4" />
            <div className="h-4 bg-cyan-300/10 rounded mb-2" />
            <div className="h-4 bg-cyan-300/10 rounded w-2/3 mx-auto" />
          </div>
          <p className="text-cyan-100/80 mt-4 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navBtn = (href: string, label: string, icon: React.ReactNode) => {
    const active = pathname === href;

    return (
      <button
        type="button"
        onClick={() => handleNavigate(href)}
        className={`group relative w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 border ${
          collapsed ? "justify-center" : ""
        } ${
          active
            ? "bg-cyan-400/12 text-white border-cyan-300/25"
            : "text-white border-transparent hover:bg-cyan-400/8 hover:border-cyan-300/15"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-300" />
        )}

        <span className="shrink-0 text-white">{icon}</span>

        {!collapsed && (
          <span className="font-semibold text-[14px] tracking-[0.01em] text-white">
            {label}
          </span>
        )}
      </button>
    );
  };

  const pageBg =
    pageTheme === "dark"
      ? "bg-[radial-gradient(circle_at_top_left,#0b2c3a_0%,#07131f_28%,#04101a_58%,#020817_100%)]"
      : "bg-[linear-gradient(180deg,#eef6f7_0%,#f7fbfc_48%,#edf5f6_100%)]";

  return (
    <>
      <div className="h-screen overflow-hidden bg-[#020817]">
        <div className="flex h-full">
          <motion.aside
            animate={{ width: collapsed ? 88 : 290 }}
            transition={{ type: "tween", duration: 0.18, ease: "easeOut" }}
            className="h-full shrink-0 overflow-hidden border-r p-5 flex flex-col bg-[linear-gradient(180deg,#03121d_0%,#071c2a_55%,#061724_100%)] border-cyan-400/15"
            style={{ willChange: "width" }}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="p-2.5 rounded-xl hover:bg-cyan-400/10 transition border border-transparent hover:border-cyan-300/15"
                title="Toggle sidebar"
              >
                <Bars3Icon className="w-6 h-6 text-white" />
              </button>

              {!collapsed && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-400/10 text-white font-semibold border border-cyan-300/15">
                  {roleLabel(user.role)}
                </span>
              )}
            </div>

            <div className={`mt-6 ${collapsed ? "text-center" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-cyan-400/12 text-white border border-cyan-300/15 grid place-items-center font-extrabold">
                  {initials(user.name)}
                </div>

                {!collapsed && (
                  <div className="min-w-0">
                    <div className="font-extrabold text-white text-[16px] leading-tight tracking-[0.02em]">
                      Hamiguitan
                    </div>
                    <div className="text-[12px] text-white/70 truncate">
                      Repository System
                    </div>
                  </div>
                )}
              </div>

              {!collapsed && (
                <div className="mt-4 rounded-2xl border border-cyan-300/12 bg-cyan-400/5 px-3 py-3">
                  <div className="flex items-center gap-2 text-white">
                    <ShieldCheckIcon className="w-4 h-4 text-white" />
                    <span className="text-[12px] font-semibold">Secure Access Panel</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-white/65">
                    Manage documents, uploads, settings, and staff records.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-7 mb-3 h-px bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent" />

            <nav className="space-y-2">
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
                className={`rounded-2xl border p-3.5 ${
                  collapsed ? "hidden" : ""
                } bg-cyan-400/6 border-cyan-300/12`}
              >
                <div className="text-[11px] text-white/60">Signed in as</div>
                <div className="font-semibold text-white truncate text-sm mt-1">
                  {user.email}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmLogout(true)}
                className={`mt-3 w-full flex items-center gap-2 px-3 py-3 rounded-2xl border transition ${
                  collapsed ? "justify-center" : ""
                } ${darkButtonStyle()}`}
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                {!collapsed && <span className="font-semibold text-sm">Logout</span>}
              </button>
            </div>
          </motion.aside>

          <main
            className={`flex-1 h-full overflow-y-auto transition-colors duration-300 ${pageBg}`}
          >
            <div className="min-h-full">{children}</div>
          </main>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Logout?"
        message="Are you sure you want to logout from the repository system?"
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={async () => {
          setConfirmLogout(false);

          const ok = await logout();

          if (!ok) {
            setLogoutErrorMsg("Please try again.");
            setLogoutErrorOpen(true);
            return;
          }

          setLogoutSuccessOpen(true);
        }}
      />

      <ConfirmDialog
        open={logoutSuccessOpen}
        title="Logged Out"
        message="You have been logged out successfully."
        confirmText="Go to Login"
        oneButton
        variant="success"
        onConfirm={() => {
          setLogoutSuccessOpen(false);
          window.location.replace("/login");
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