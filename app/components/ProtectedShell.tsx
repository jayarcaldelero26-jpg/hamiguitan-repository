"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import {
  HomeIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  Bars3Icon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  MoonIcon,
  IdentificationIcon,
  UserGroupIcon,
  RectangleGroupIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  SunIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/app/components/AuthProvider";
import { repoTheme } from "@/app/lib/repoTheme";
import { useProtectedTheme } from "@/app/components/ProtectedThemeProvider";

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

const IDLE_WARNING_MS = 15 * 60 * 1000;
const IDLE_LOGOUT_MS = 30 * 60 * 1000;

export default function ProtectedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { theme: pageTheme, dark, toggleTheme } = useProtectedTheme();
  const prefetchedRoutesRef = useRef(new Set<string>());

  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [bookingNavOpen, setBookingNavOpen] = useState(
    pathname.startsWith("/booking") || pathname.startsWith("/calendar")
  );
  const [confirmLogoutPath, setConfirmLogoutPath] = useState<string | null>(null);

  const [logoutSuccessOpen, setLogoutSuccessOpen] = useState(false);
  const [logoutErrorOpen, setLogoutErrorOpen] = useState(false);
  const [logoutErrorMsg, setLogoutErrorMsg] = useState("Please try again.");
  const [sessionWarningOpen, setSessionWarningOpen] = useState(false);
  const warningTimerRef = useRef<number | null>(null);
  const logoutTimerRef = useRef<number | null>(null);
  const logoutInFlightRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const onResize = () => {
      if (window.innerWidth >= 768) {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileNavOpen]);

  const closeMobileNav = useCallback(() => {
    startTransition(() => {
      setMobileNavOpen(false);
    });
  }, []);

  const clearIdleTimers = useCallback(() => {
    if (warningTimerRef.current !== null) {
      window.clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current !== null) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const finishLogoutToLogin = useCallback(() => {
    window.location.replace("/login");
  }, []);

  const runLogoutToLogin = useCallback(async () => {
    if (logoutInFlightRef.current) return;
    logoutInFlightRef.current = true;
    clearIdleTimers();
    setSessionWarningOpen(false);
    setConfirmLogoutPath(null);

    const ok = await logout();

    if (!ok) {
      logoutInFlightRef.current = false;
      setLogoutErrorMsg("Please try again.");
      setLogoutErrorOpen(true);
      return;
    }

    finishLogoutToLogin();
  }, [clearIdleTimers, finishLogoutToLogin, logout]);

  const scheduleIdleTimers = useCallback(() => {
    if (!user || logoutInFlightRef.current) return;
    clearIdleTimers();

    warningTimerRef.current = window.setTimeout(() => {
      setSessionWarningOpen(true);
    }, IDLE_WARNING_MS);

    logoutTimerRef.current = window.setTimeout(() => {
      void runLogoutToLogin();
    }, IDLE_LOGOUT_MS);
  }, [clearIdleTimers, runLogoutToLogin, user]);

  const resetIdleTimer = useCallback(() => {
    setSessionWarningOpen(false);
    scheduleIdleTimers();
  }, [scheduleIdleTimers]);

  const prefetchRoute = useCallback(
    (href: string) => {
      if (!user || pathname === href || prefetchedRoutesRef.current.has(href)) {
        return;
      }

      prefetchedRoutesRef.current.add(href);
      router.prefetch(href);
    },
    [pathname, router, user]
  );

  const ui = repoTheme(pageTheme);
  const bookingModuleActive =
    pathname.startsWith("/booking") || pathname.startsWith("/calendar");
  const showBookingNav = bookingNavOpen || bookingModuleActive;
  const themeToggleLabel = dark ? "Switch to light mode" : "Switch to dark mode";
  const sidebarSurfaceClassName =
    "border-white/10 bg-[linear-gradient(180deg,#182029_0%,#1d2831_46%,#22323b_100%)] text-[#E6EDF3] shadow-[0_26px_54px_rgba(0,0,0,0.3)]";
  const sidebarDividerClassName =
    "bg-gradient-to-r from-transparent via-white/10 to-transparent";
  const sidebarLabelClassName =
    "text-[10px] font-semibold uppercase tracking-[0.22em] text-[rgba(151,166,168,0.72)]";
  const sidebarRoleBadgeClassName =
    "border border-white/10 bg-white/[0.05] text-[rgba(230,237,243,0.72)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
  const sidebarIconBaseClassName =
    "grid h-9 w-9 shrink-0 place-items-center rounded-[14px] border transition-colors";
  const sidebarItemBaseClassName =
    "group relative flex w-full min-h-11 items-center gap-3 rounded-[18px] border px-3 py-2.5 text-left transition-all duration-200 ease-out";
  const sidebarItemInactiveClassName =
    "border-transparent bg-transparent text-[rgba(230,237,243,0.84)] hover:border-white/10 hover:bg-white/[0.05] hover:text-[#F8FBFD]";
  const sidebarItemActiveClassName =
    "border-[#5D7892]/32 bg-[linear-gradient(180deg,rgba(57,92,122,0.28),rgba(57,92,122,0.12))] text-[#F8FBFD] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_30px_rgba(0,0,0,0.24)]";
  const sidebarIconInactiveClassName =
    "border-transparent bg-white/[0.04] text-[rgba(230,237,243,0.76)] group-hover:border-white/10 group-hover:bg-white/[0.07] group-hover:text-[#F8FBFD]";
  const sidebarIconActiveClassName =
    "border-white/12 bg-white/[0.08] text-[#F8FBFD] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
  const sidebarActionButtonClassName =
    "inline-flex min-h-11 items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.05] px-3 py-2.5 text-[#E6EDF3] transition hover:bg-white/[0.08]";
  const sidebarSecondaryCardClassName =
    "border border-white/8 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";
  const sidebarTooltipClassName =
    "border-white/10 bg-[#182029]/96 text-[#E6EDF3]";
  const sidebarUserCardClassName =
    "rounded-[22px] border border-white/10 bg-white/[0.045] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

  const navBtn = useCallback(
    (href: string, label: string, icon: React.ReactNode) => {
      const active = pathname === href;
      const showLabel = !collapsed || mobileNavOpen;

      return (
        <Link
          key={href}
          href={href}
          prefetch={false}
          onClick={(event) => {
            closeMobileNav();

            if (pathname === href) {
              event.preventDefault();
            }
          }}
          onMouseEnter={() => prefetchRoute(href)}
          onFocus={() => prefetchRoute(href)}
          aria-current={active ? "page" : undefined}
          className={`${sidebarItemBaseClassName} ${
            showLabel ? "" : "justify-center"
          } ${active ? sidebarItemActiveClassName : sidebarItemInactiveClassName}`}
        >
          {active && (
            <span className="absolute bottom-2 left-[8px] top-2 w-[3px] rounded-full bg-[#8EB69B]" />
          )}

          <span
            className={`${sidebarIconBaseClassName} ${
              active ? sidebarIconActiveClassName : sidebarIconInactiveClassName
            }`}
          >
            {icon}
          </span>

          {showLabel && (
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold tracking-[0.01em] text-[#E6EDF3]">
                {label}
              </span>
              {active && (
                <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[rgba(151,166,168,0.86)]">
                  Active
                </span>
              )}
            </span>
          )}

          {!showLabel && (
            <span className={`pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-20 hidden -translate-y-1/2 rounded-xl border px-3 py-2 text-[12px] font-medium opacity-0 shadow-[0_12px_28px_rgba(0,0,0,0.16)] transition-all duration-150 ease-out group-hover:translate-x-0 group-hover:opacity-100 md:block md:-translate-x-1 ${sidebarTooltipClassName}`}>
              {label}
            </span>
          )}
        </Link>
      );
    },
    [
      closeMobileNav,
      collapsed,
      mobileNavOpen,
      pathname,
      prefetchRoute,
      sidebarIconActiveClassName,
      sidebarIconBaseClassName,
      sidebarIconInactiveClassName,
      sidebarItemActiveClassName,
      sidebarItemBaseClassName,
      sidebarItemInactiveClassName,
      sidebarTooltipClassName,
    ]
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
        icon: <HomeIcon className="h-5 w-5" />,
      },
      {
        href: "/research",
        label: "Document Repository",
        icon: <DocumentTextIcon className="h-5 w-5" />,
      },
      {
        href: "/porters-identification",
        label: "Porters Identification",
        icon: <IdentificationIcon className="h-5 w-5" />,
      },
      {
        href: "/organizational-chart",
        label: "Organizational Chart",
        icon: <RectangleGroupIcon className="h-5 w-5" />,
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
        icon: <ArrowUpTrayIcon className="h-5 w-5" />,
        show: canUpload(user.role),
      },
      {
        href: "/admin/users",
        label: "Registered Staff",
        icon: <UserGroupIcon className="h-5 w-5" />,
        show: canViewRegisteredStaff(user.role),
      },
      {
        href: "/settings",
        label: "Settings",
        icon: <Cog6ToothIcon className="h-5 w-5" />,
        show: canAccessSettings(user.role),
      },
      {
        href: "/audit",
        label: "Audit Logs",
        icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
        show: canViewAudit(user.role),
      },
    ];

    return {
      primary: primaryItems,
      booking: [
        {
          href: "/booking",
          label: "Booking",
          icon: <TicketIcon className="h-4 w-4" />,
        },
        {
          href: "/calendar",
          label: "Calendar",
          icon: <CalendarDaysIcon className="h-4 w-4" />,
        },
      ],
      admin: adminItems.filter((item) => item.show),
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      clearIdleTimers();
      return;
    }

    const handleActivity = () => {
      resetIdleTimer();
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    scheduleIdleTimers();

    for (const eventName of events) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, handleActivity);
      }
      clearIdleTimers();
    };
  }, [clearIdleTimers, resetIdleTimer, scheduleIdleTimers, user]);

  const confirmLogout = confirmLogoutPath === pathname;
  const showSidebarLabels = !collapsed || mobileNavOpen;

  if (loading) {
    return (
      <div className={`flex min-h-[100dvh] items-center justify-center ${ui.page}`}>
        <div className={`${ui.card} w-[min(360px,calc(100vw-2rem))] p-6 text-center`}>
          <div className="animate-pulse">
            <div className="mx-auto mb-4 h-10 w-10 rounded-full bg-[#395C7A]/24" />
            <div className="mb-2 h-4 rounded bg-white/10" />
            <div className="mx-auto h-4 w-2/3 rounded bg-white/10" />
          </div>
          <p className="mt-4 text-sm text-[color:rgba(230,237,243,0.8)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-xl focus:bg-[#395C7A] focus:px-4 focus:py-2 focus:font-semibold focus:text-[var(--ui-text-main)]"
      >
        Skip to main content
      </a>

      <div className={`h-[100dvh] overflow-hidden ${ui.page}`}>
        <div className="flex h-full">
          {mobileNavOpen && (
            <button
              type="button"
              aria-label="Close navigation"
              className={`fixed inset-0 z-40 md:hidden ${dark ? "bg-black/56" : "bg-slate-900/20"}`}
              onClick={() => setMobileNavOpen(false)}
            />
          )}

          <aside
            aria-label="Sidebar"
            className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col overflow-hidden border-r p-3 transition-transform duration-150 ease-out md:relative md:z-auto md:translate-x-0 md:p-4 md:shadow-none sm:p-4 ${
              sidebarSurfaceClassName
            } ${
              mobileNavOpen ? "translate-x-0" : "-translate-x-full"
            } ${
              collapsed ? "md:w-[84px]" : "md:w-[224px]"
            } w-[min(84vw,224px)]`}
          >
            <div className="pointer-events-none absolute inset-0 hidden md:block bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(57,92,122,0.22),transparent_40%)]" />
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
                className="min-h-10 min-w-10 rounded-[16px] border border-transparent p-2 text-[#E6EDF3] transition hover:border-white/10 hover:bg-white/[0.06]"
                title="Toggle sidebar"
                aria-label="Toggle sidebar"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>

              {showSidebarLabels && (
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${sidebarRoleBadgeClassName}`}>
                  {roleLabel(user.role)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className={`mt-3 ${sidebarActionButtonClassName} ${sidebarSecondaryCardClassName} ${showSidebarLabels ? "w-full justify-start" : "w-full justify-center"}`}
              aria-label={themeToggleLabel}
              title={themeToggleLabel}
            >
                <span className="grid h-9 w-9 place-items-center rounded-[14px] border border-white/10 bg-white/[0.06] text-[#E6EDF3]">
                {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </span>
              {showSidebarLabels && (
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-[13px] font-semibold text-[#E6EDF3]">
                    {dark ? "Light Mode" : "Dark Mode"}
                  </span>
                  <span className="block text-[10px] uppercase tracking-[0.12em] text-[rgba(151,166,168,0.76)]">
                    Theme
                  </span>
                </span>
              )}
            </button>

            <div className={`mt-4 ${showSidebarLabels ? "" : "text-center"}`}>
              <div className={`flex items-center ${showSidebarLabels ? "gap-3.5" : "justify-center"}`}>
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.05] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_20px_rgba(0,0,0,0.16)] sm:h-14 sm:w-14 sm:p-2">
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
                    <div className="text-[15px] font-bold leading-tight tracking-[0.01em] text-[#E6EDF3] sm:text-base">
                      Hamiguitan
                    </div>
                    <div className="truncate text-[11px] font-medium text-[rgba(151,166,168,0.8)]">
                      Internal Workspace
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={`mt-5 h-px ${sidebarDividerClassName}`} />

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
                    className={`${sidebarItemBaseClassName} ${
                      showSidebarLabels ? "" : "justify-center"
                    } ${bookingModuleActive ? sidebarItemActiveClassName : sidebarItemInactiveClassName}`}
                  >
                    <span
                      className={`${sidebarIconBaseClassName} ${
                        bookingModuleActive
                          ? sidebarIconActiveClassName
                          : sidebarIconInactiveClassName
                      }`}
                    >
                      <TicketIcon className="h-5 w-5" />
                    </span>

                    {showSidebarLabels && (
                      <>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block text-[13px] font-semibold tracking-[0.01em] text-[#E6EDF3]">
                            Booking
                          </span>
                          <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[rgba(151,166,168,0.76)]">
                            Module
                          </span>
                        </span>
                        <span className="text-lg font-semibold text-[rgba(230,237,243,0.72)]">
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
                <div className={`px-3 pb-2 pt-6 ${sidebarLabelClassName}`}>
                  Admin Tools
                </div>
              )}

              <nav aria-label="Administrative navigation" className="space-y-1.5">
                {navItems.admin.map((item) => navBtn(item.href, item.label, item.icon))}
              </nav>
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              {showSidebarLabels ? (
                <div className={sidebarUserCardClassName}>
                  <div className="truncate text-[13px] font-semibold text-[#E6EDF3]">
                    {user.email}
                  </div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(151,166,168,0.76)]">
                    {roleLabel(user.role)}
                  </div>
                </div>
              ) : (
                <div className="px-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(151,166,168,0.76)]">
                  {roleLabel(user.role)}
                </div>
              )}

              <button
                type="button"
                onClick={() => setConfirmLogoutPath(pathname)}
                className={`mt-3 ${sidebarItemBaseClassName} ${
                  showSidebarLabels ? "" : "justify-center"
                } border-white/10 bg-white/[0.05] text-[#E6EDF3] hover:bg-white/[0.08]`}
                aria-label="Logout"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[14px] border border-white/10 bg-white/[0.06] text-[#E6EDF3]">
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </span>
                {showSidebarLabels && (
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-[13px] font-semibold text-[#E6EDF3]">Logout</span>
                    <span className="block text-[10px] uppercase tracking-[0.12em] text-[rgba(151,166,168,0.76)]">
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
            className={`scroll-page h-full flex-1 overflow-y-auto md:transition-colors md:duration-300 ${ui.page}`}
          >
            <div className={`sticky top-0 z-30 border-b px-4 py-2.5 md:hidden ${ui.mobileBar}`}>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className={`grid min-h-11 min-w-11 place-items-center rounded-xl border text-[var(--ui-text-main)] ${
                    dark
                      ? "border-[var(--ui-border)] bg-white/[0.05]"
                      : "border-[var(--ui-border-strong)] bg-white"
                  }`}
                  aria-label="Open navigation"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`grid min-h-11 min-w-11 place-items-center rounded-xl border text-[var(--ui-text-main)] ${
                    dark
                      ? "border-[var(--ui-border)] bg-white/[0.05]"
                      : "border-[var(--ui-border-strong)] bg-white"
                  }`}
                  aria-label={themeToggleLabel}
                >
                  {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </button>

                <div className="min-w-0 flex-1 text-right">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:rgba(151,166,168,0.72)]">
                    Internal Workspace
                  </div>
                  <div className="truncate text-sm font-semibold text-[var(--ui-text-main)]">
                    {user.name}
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-full">{children}</div>
          </main>
        </div>
      </div>

      {confirmLogout && (
        <ConfirmDialog
          open
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
      )}

      {logoutSuccessOpen && (
        <ConfirmDialog
          open
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
      )}

      {logoutErrorOpen && (
        <ConfirmDialog
          open
          title="Logout Failed"
          message={logoutErrorMsg}
          confirmText="OK"
          oneButton
          variant="warning"
          onConfirm={() => setLogoutErrorOpen(false)}
        />
      )}

      {sessionWarningOpen && (
        <ConfirmDialog
          open
          title="Session Expiring Soon"
          message="Your session is about to expire due to inactivity. Stay signed in to continue working, or logout now."
          confirmText="Stay Signed In"
          cancelText="Logout Now"
          variant="warning"
          onConfirm={() => resetIdleTimer()}
          onCancel={() => {
            void runLogoutToLogin();
          }}
        />
      )}
    </>
  );
}
