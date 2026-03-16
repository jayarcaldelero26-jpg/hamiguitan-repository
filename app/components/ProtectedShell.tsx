"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import ConfirmDialog from "@/app/components/ConfirmDialog";
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
import { useAuth } from "@/app/components/AuthProvider";
import { repoTheme } from "@/app/lib/repoTheme";

type PageTheme = "dark" | "light";

function getStoredPageTheme(): PageTheme {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem("page-theme") === "light" ? "light" : "dark";
}

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
  return r === "admin" || r === "co_admin" || r === "staff";
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

function darkButtonStyle() {
  return "bg-white/[0.05] text-[#DAF1DE] border-white/10 hover:bg-white/[0.08]";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [confirmLogoutPath, setConfirmLogoutPath] = useState<string | null>(null);
  const [pageTheme, setPageTheme] = useState<PageTheme>("dark");

  const [logoutSuccessOpen, setLogoutSuccessOpen] = useState(false);
  const [logoutErrorOpen, setLogoutErrorOpen] = useState(false);
  const [logoutErrorMsg, setLogoutErrorMsg] = useState("Please try again.");

  useEffect(() => {
    document.documentElement.dataset.pageTheme = pageTheme;
  }, [pageTheme]);

  useEffect(() => {
    const onThemeChanged = () => {
      setPageTheme(getStoredPageTheme());
    };

    onThemeChanged();
    window.addEventListener("page-theme-changed", onThemeChanged);
    return () =>
      window.removeEventListener("page-theme-changed", onThemeChanged);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    router.prefetch("/dashboard");
    router.prefetch("/research");

    if (canUpload(user.role)) router.prefetch("/upload");
    if (canAccessSettings(user.role)) router.prefetch("/settings");
    if (canViewRegisteredStaff(user.role)) router.prefetch("/admin/users");
  }, [router, user]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleNavigate = useCallback(
    (href: string) => {
      setMobileNavOpen(false);
      if (pathname === href) return;
      router.push(href);
    },
    [pathname, router]
  );

  const pageBg =
    pageTheme === "dark"
      ? "bg-[radial-gradient(circle_at_top_left,#163832_0%,#0B2B26_30%,#051F20_58%,#03171A_100%)]"
      : "bg-[linear-gradient(180deg,#edf6f0_0%,#f6fbf8_48%,#e6efe9_100%)]";

  const ui = repoTheme(pageTheme);

  const navBtn = useCallback(
    (href: string, label: string, icon: React.ReactNode) => {
      const active = pathname === href;
      const showLabel = !collapsed || mobileNavOpen;

      return (
        <button
          key={href}
          type="button"
          onClick={() => handleNavigate(href)}
          aria-current={active ? "page" : undefined}
          className={`group relative w-full min-h-11 flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors duration-150 border ${
            showLabel ? "" : "justify-center"
          } ${
            active
              ? "bg-white/[0.08] text-white border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              : "text-white border-transparent hover:bg-white/[0.05] hover:border-white/10"
          }`}
        >
          {active && (
            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-300" />
          )}

          <span className="shrink-0 text-white">{icon}</span>

          {showLabel && (
            <span className="font-semibold text-[14px] tracking-[0.01em] text-white">
              {label}
            </span>
          )}
        </button>
      );
    },
    [collapsed, handleNavigate, mobileNavOpen, pathname]
  );

  const navItems = useMemo(() => {
    if (!user) return [];

    const items: Array<{
      href: string;
      label: string;
      icon: React.ReactNode;
      show: boolean;
    }> = [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: <HomeIcon className="w-5 h-5" />,
        show: true,
      },
      {
        href: "/research",
        label: "Documents",
        icon: <DocumentTextIcon className="w-5 h-5" />,
        show: true,
      },
      {
        href: "/upload",
        label: "Upload",
        icon: <ArrowUpTrayIcon className="w-5 h-5" />,
        show: canUpload(user.role),
      },
      {
        href: "/admin/users",
        label: "Registered Staff",
        icon: <UserGroupIcon className="w-5 h-5" />,
        show: canViewRegisteredStaff(user.role),
      },
      {
        href: "/settings",
        label: "Settings",
        icon: <Cog6ToothIcon className="w-5 h-5" />,
        show: canAccessSettings(user.role),
      },
    ];

    return items.filter((item) => item.show);
  }, [user]);

  const confirmLogout = confirmLogoutPath === pathname;
  const showSidebarLabels = !collapsed || mobileNavOpen;

  if (loading) {
    return (
      <div className={`min-h-[100dvh] flex items-center justify-center ${pageBg}`}>
        <div className={`${ui.card} p-6 w-[min(360px,calc(100vw-2rem))] text-center`}>
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

  if (!user) return null;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-cyan-400 focus:text-slate-950 focus:font-semibold"
      >
        Skip to main content
      </a>

      <div className={`h-[100dvh] overflow-hidden ${pageBg}`}>
        <div className="flex h-full">
          {mobileNavOpen && (
            <button
              type="button"
              aria-label="Close navigation"
              className="fixed inset-0 z-40 bg-black/45 md:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
          )}

          <aside
            aria-label="Sidebar"
            className={`fixed inset-y-0 left-0 z-50 h-full overflow-hidden border-r p-4 sm:p-5 flex flex-col bg-[linear-gradient(180deg,#04191a_0%,#0B2B26_52%,#163832_100%)] border-white/10 transition-transform duration-150 ease-out md:relative md:z-auto md:translate-x-0 ${
              mobileNavOpen ? "translate-x-0" : "-translate-x-full"
            } ${
              collapsed ? "md:w-[88px]" : "md:w-[290px]"
            } w-[min(84vw,290px)]`}
          >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(142,182,155,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(35,83,71,0.22),transparent_40%)]" />
            <div role="banner" className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setMobileNavOpen(false);
                    return;
                  }
                  setCollapsed((v) => !v);
                }}
                className="min-h-11 min-w-11 p-2.5 rounded-xl hover:bg-white/[0.08] transition border border-transparent hover:border-white/10"
                title="Toggle sidebar"
                aria-label="Toggle sidebar"
              >
                <Bars3Icon className="w-6 h-6 text-white" />
              </button>

              {showSidebarLabels && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.05] text-[#DAF1DE] font-semibold border border-white/10">
                  {roleLabel(user.role)}
                </span>
              )}
            </div>

            <div className={`mt-6 ${showSidebarLabels ? "" : "text-center"}`}>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/[0.06] text-[#DAF1DE] border border-white/10 grid place-items-center font-extrabold">
                  {initials(user.name)}
                </div>

                {showSidebarLabels && (
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

              {showSidebarLabels && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
                  <div className="flex items-center gap-2 text-[#DAF1DE]">
                    <ShieldCheckIcon className="w-4 h-4 text-[#8EB69B]" />
                    <span className="text-[12px] font-semibold">
                      Secure Access Panel
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-[#DAF1DE]/65">
                    Manage documents, uploads, settings, and staff records.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-7 mb-3 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <nav aria-label="Primary navigation" className="space-y-2 overflow-y-auto pr-1">
              {navItems.map((item) => navBtn(item.href, item.label, item.icon))}
            </nav>

            <div className="mt-auto pt-5">
              {showSidebarLabels && (
                <div className="rounded-2xl border p-3.5 bg-white/[0.04] border-white/10">
                  <div className="text-[11px] text-[#DAF1DE]/60">Signed in as</div>
                  <div className="font-semibold text-[#DAF1DE] truncate text-sm mt-1">
                    {user.email}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setConfirmLogoutPath(pathname)}
                className={`mt-3 w-full min-h-11 flex items-center gap-2 px-3 py-3 rounded-2xl border transition ${
                  showSidebarLabels ? "" : "justify-center"
                } ${darkButtonStyle()}`}
                aria-label="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                {showSidebarLabels && (
                  <span className="font-semibold text-sm">Logout</span>
                )}
              </button>
            </div>
          </aside>

          <main
            id="main-content"
            role="main"
          className={`flex-1 h-full overflow-y-auto md:transition-colors md:duration-300 ${pageBg}`}
          >
            <div className="sticky top-0 z-30 border-b border-white/10 bg-[#04191a]/95 px-4 py-3 md:hidden">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="min-h-11 min-w-11 rounded-xl border border-white/10 bg-white/[0.05] text-white grid place-items-center"
                  aria-label="Open navigation"
                >
                  <Bars3Icon className="w-6 h-6" />
                </button>

                <div className="min-w-0 text-right">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">
                    Repository
                  </div>
                  <div className="truncate text-sm font-semibold text-white">
                    {user.name}
                  </div>
                </div>
              </div>
            </div>

            <div className={`min-h-full ${ui.page}`}>{children}</div>
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
        onCancel={() => setConfirmLogoutPath(null)}
        onConfirm={async () => {
          setConfirmLogoutPath(null);

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
