"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import {
  HomeIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  Bars3Icon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  IdentificationIcon,
  UserGroupIcon,
  RectangleGroupIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/app/components/AuthProvider";
import { repoTheme } from "@/app/lib/repoTheme";

type PageTheme = "dark" | "light";

function getStoredPageTheme(): PageTheme {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem("page-theme") === "light" ? "light" : "dark";
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

function canViewAudit(role?: string) {
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
  return "bg-white/[0.04] text-[#DAF1DE] border-white/10 hover:bg-white/[0.07]";
}

function navActionBase(active: boolean) {
  return active
    ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.06))] text-white border-white/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_24px_rgba(0,0,0,0.14)]"
    : "text-white/84 border-transparent hover:bg-white/[0.05] hover:border-white/10 hover:text-white";
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
  const [bookingNavOpen, setBookingNavOpen] = useState(
    pathname.startsWith("/booking") || pathname.startsWith("/calendar")
  );
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
    router.prefetch("/calendar");
    router.prefetch("/booking");
    router.prefetch("/porters-identification");
    router.prefetch("/organizational-chart");

    if (canUpload(user.role)) router.prefetch("/upload");
    if (canViewAudit(user.role)) router.prefetch("/audit");
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
  const bookingModuleActive =
    pathname.startsWith("/booking") || pathname.startsWith("/calendar");
  const showBookingNav = bookingNavOpen || bookingModuleActive;

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
          className={`group relative w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-[20px] border transition-all duration-200 ease-out ${
            showLabel ? "" : "justify-center"
          } ${navActionBase(active)}`}
        >
          {active && (
            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-300" />
          )}

          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-[14px] border transition-colors ${
              active
                ? "border-white/12 bg-white/[0.08] text-cyan-100"
                : "border-transparent bg-transparent text-white/78 group-hover:border-white/10 group-hover:bg-white/[0.05] group-hover:text-white"
            }`}
          >
            {icon}
          </span>

          {showLabel && (
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-[13px] tracking-[0.01em] text-white">
                {label}
              </span>
              {active && (
                <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-cyan-100/70">
                  Active
                </span>
              )}
            </span>
          )}

          {!showLabel && (
            <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-20 hidden -translate-y-1/2 rounded-xl border border-white/10 bg-[#0c1f1d]/96 px-3 py-2 text-[12px] font-medium text-white shadow-[0_12px_28px_rgba(0,0,0,0.24)] opacity-0 transition-all duration-150 ease-out group-hover:translate-x-0 group-hover:opacity-100 md:block md:-translate-x-1">
              {label}
            </span>
          )}
        </button>
      );
    },
    [collapsed, handleNavigate, mobileNavOpen, pathname]
  );

  const navItems = useMemo(() => {
    if (!user) {
      return {
        primary: [],
        booking: [],
        admin: [],
      };
    }

    const primaryItems: Array<{
      href: string;
      label: string;
      icon: React.ReactNode;
    }> = [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: <HomeIcon className="w-5 h-5" />,
      },
      {
        href: "/research",
        label: "Document Repository",
        icon: <DocumentTextIcon className="w-5 h-5" />,
      },
      {
        href: "/porters-identification",
        label: "Porters Identification",
        icon: <IdentificationIcon className="w-5 h-5" />,
      },
      {
        href: "/organizational-chart",
        label: "Organizational Chart",
        icon: <RectangleGroupIcon className="w-5 h-5" />,
      },
    ];

    const adminItems: Array<{
      href: string;
      label: string;
      icon: React.ReactNode;
      show: boolean;
    }> = [
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
      {
        href: "/audit",
        label: "Audit Logs",
        icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
        show: canViewAudit(user.role),
      },
    ];

    return {
      primary: primaryItems,
      booking: [
        {
          href: "/booking",
          label: "Booking",
          icon: <TicketIcon className="w-4 h-4" />,
        },
        {
          href: "/calendar",
          label: "Calendar",
          icon: <CalendarDaysIcon className="w-4 h-4" />,
        },
      ],
      admin: adminItems.filter((item) => item.show),
    };
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
            className={`fixed inset-y-0 left-0 z-50 h-full overflow-hidden border-r p-3 sm:p-4 md:p-4 flex flex-col bg-[linear-gradient(180deg,#041618_0%,#082224_48%,#102f30_100%)] border-white/10 shadow-[0_18px_42px_rgba(0,0,0,0.28)] md:shadow-none transition-transform duration-150 ease-out md:relative md:z-auto md:translate-x-0 ${
              mobileNavOpen ? "translate-x-0" : "-translate-x-full"
            } ${
              collapsed ? "md:w-[96px]" : "md:w-[320px]"
            } w-[min(88vw,320px)]`}
          >
            <div className="absolute inset-0 pointer-events-none hidden md:block bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(35,83,71,0.16),transparent_40%)]" />
            <div role="banner" className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setMobileNavOpen(false);
                    return;
                  }
                  setCollapsed((v) => !v);
                }}
                className="min-h-10 min-w-10 p-2 rounded-xl hover:bg-white/[0.06] transition border border-transparent hover:border-white/10"
                title="Toggle sidebar"
                aria-label="Toggle sidebar"
              >
                <Bars3Icon className="w-6 h-6 text-white" />
              </button>

              {showSidebarLabels && (
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.04] text-white/72 font-semibold border border-white/10">
                  {roleLabel(user.role)}
                </span>
              )}
            </div>

            <div className={`mt-4 ${showSidebarLabels ? "" : "text-center"}`}>
              <div className={`flex items-center ${showSidebarLabels ? "gap-3" : "justify-center"}`}>
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.06] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:h-14 sm:w-14 sm:p-2">
                  <Image
                    src="/branding/mhrws-logo.png"
                    alt="Mount Hamiguitan Range Wildlife Sanctuary logo"
                    fill
                    sizes="(min-width: 640px) 56px, 48px"
                    className="object-contain p-1"
                    priority
                  />
                </div>

                {showSidebarLabels && (
                  <div className="min-w-0">
                    <div className="font-bold text-white text-[15px] sm:text-base leading-tight tracking-[0.01em]">
                      Hamiguitan
                    </div>
                    <div className="text-[11px] font-medium text-white/58 truncate">
                      Internal Workspace
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

            <div className="scroll-sidebar mt-4 flex-1 overflow-y-auto pr-1.5">
              <nav aria-label="Primary navigation" className="space-y-1.5">
                {navItems.primary.map((item) => navBtn(item.href, item.label, item.icon))}

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!showSidebarLabels) {
                        setCollapsed(false);
                        setBookingNavOpen(true);
                        return;
                      }
                      setBookingNavOpen((current) => !current);
                    }}
                    aria-expanded={showBookingNav}
                    className={`group relative w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-[20px] border transition-all duration-200 ease-out ${
                      showSidebarLabels ? "" : "justify-center"
                    } ${navActionBase(
                      bookingModuleActive
                    )}`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-[14px] border transition-colors ${
                        bookingModuleActive
                          ? "border-white/12 bg-white/[0.08] text-cyan-100"
                          : "border-transparent bg-transparent text-white/78 group-hover:border-white/10 group-hover:bg-white/[0.05] group-hover:text-white"
                      }`}
                    >
                      <TicketIcon className="w-5 h-5" />
                    </span>

                    {showSidebarLabels && (
                      <>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block font-semibold text-[13px] tracking-[0.01em] text-white">
                            Booking
                          </span>
                          <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-white/55">
                            Module
                          </span>
                        </span>
                        <span className="text-lg font-semibold text-white/72">
                          {showBookingNav ? "−" : "+"}
                        </span>
                      </>
                    )}
                  </button>

                  {showSidebarLabels && showBookingNav && (
                    <div className="ml-4 space-y-1 border-l border-white/10 pl-3">
                      {navItems.booking.map((item) => navBtn(item.href, item.label, item.icon))}
                    </div>
                  )}
                </div>
              </nav>

              {showSidebarLabels && navItems.admin.length > 0 && (
                <div className="px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
                  Admin Tools
                </div>
              )}

              <nav aria-label="Administrative navigation" className="space-y-1.5">
                {navItems.admin.map((item) => navBtn(item.href, item.label, item.icon))}
              </nav>
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              {showSidebarLabels ? (
                <div className="px-3.5 py-1 text-left">
                  <div className="truncate text-[13px] font-semibold text-[#DAF1DE]">
                    {user.email}
                  </div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/48">
                    {roleLabel(user.role)}
                  </div>
                </div>
              ) : (
                <div className="px-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-white/48">
                  {roleLabel(user.role)}
                </div>
              )}

              <button
                type="button"
                onClick={() => setConfirmLogoutPath(pathname)}
                className={`mt-3 w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-[20px] border transition ${
                  showSidebarLabels ? "" : "justify-center"
                } ${navActionBase(false)} ${darkButtonStyle()}`}
                aria-label="Logout"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[14px] border border-white/10 bg-white/[0.04] text-white/88">
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </span>
                {showSidebarLabels && (
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block font-semibold text-[13px]">Logout</span>
                    <span className="block text-[10px] uppercase tracking-[0.12em] text-white/50">
                      End Session
                    </span>
                  </span>
                )}
              </button>
            </div>
          </aside>

          <main
            id="main-content"
            role="main"
          className={`flex-1 h-full overflow-y-auto md:transition-colors md:duration-300 ${pageBg}`}
          >
            <div className="sticky top-0 z-30 border-b border-white/10 bg-[#04191a]/95 px-4 py-2.5 md:hidden">
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
                    Internal Workspace
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
