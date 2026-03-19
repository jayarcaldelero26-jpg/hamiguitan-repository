"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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

function darkButtonStyle(dark: boolean) {
  return dark
    ? "bg-white/[0.04] text-[var(--ui-text-main)] border-[var(--ui-border)] hover:bg-white/[0.08]"
    : "bg-white text-[var(--ui-text-main)] border-[var(--ui-border-strong)] hover:bg-slate-50";
}

function navActionBase(active: boolean, dark: boolean) {
  return active
    ? dark
      ? "bg-[linear-gradient(180deg,rgba(57,92,122,0.28),rgba(57,92,122,0.12))] text-[var(--ui-text-main)] border-[var(--ui-border-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_24px_rgba(0,0,0,0.18)]"
      : "bg-[linear-gradient(180deg,rgba(57,92,122,0.12),rgba(57,92,122,0.06))] text-[var(--ui-text-main)] border-[var(--ui-border-strong)] shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
    : dark
      ? "text-[color:rgba(230,237,243,0.84)] border-transparent hover:bg-white/[0.05] hover:border-[var(--ui-border)] hover:text-[var(--ui-text-main)]"
      : "text-[color:rgba(75,85,99,0.92)] border-transparent hover:bg-black/[0.03] hover:border-[var(--ui-border)] hover:text-[var(--ui-text-main)]";
}

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

  const handleNavigate = useCallback(
    (href: string) => {
      setMobileNavOpen(false);
      if (pathname === href) return;
      router.push(href);
    },
    [pathname, router]
  );

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

  const navBtn = useCallback(
    (href: string, label: string, icon: React.ReactNode) => {
      const active = pathname === href;
      const showLabel = !collapsed || mobileNavOpen;

      return (
        <button
          key={href}
          type="button"
          onClick={() => handleNavigate(href)}
          onMouseEnter={() => prefetchRoute(href)}
          onFocus={() => prefetchRoute(href)}
          aria-current={active ? "page" : undefined}
          className={`group relative flex w-full min-h-11 items-center gap-3 rounded-[20px] border px-3 py-2.5 transition-all duration-200 ease-out ${
            showLabel ? "" : "justify-center"
          } ${navActionBase(active, dark)}`}
        >
          {active && (
            <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-[#868C65]" />
          )}

          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-[14px] border transition-colors ${
              active
                ? dark
                  ? "border-[var(--ui-border)] bg-white/[0.08] text-[var(--ui-text-main)]"
                  : "border-[var(--ui-border)] bg-black/[0.04] text-[var(--ui-text-main)]"
                : dark
                  ? "border-transparent bg-transparent text-[color:rgba(230,237,243,0.78)] group-hover:border-[var(--ui-border)] group-hover:bg-white/[0.05] group-hover:text-[var(--ui-text-main)]"
                  : "border-transparent bg-transparent text-[color:rgba(75,85,99,0.8)] group-hover:border-[var(--ui-border)] group-hover:bg-black/[0.03] group-hover:text-[var(--ui-text-main)]"
            }`}
          >
            {icon}
          </span>

          {showLabel && (
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold tracking-[0.01em] text-[var(--ui-text-main)]">
                {label}
              </span>
              {active && (
                <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[color:rgba(151,166,168,0.86)]">
                  Active
                </span>
              )}
            </span>
          )}

          {!showLabel && (
            <span className={`pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-20 hidden -translate-y-1/2 rounded-xl border px-3 py-2 text-[12px] font-medium text-[var(--ui-text-main)] opacity-0 shadow-[0_12px_28px_rgba(0,0,0,0.24)] transition-all duration-150 ease-out group-hover:translate-x-0 group-hover:opacity-100 md:block md:-translate-x-1 ${dark ? "border-[var(--ui-border)] bg-[#181F27]/96" : "border-[var(--ui-border-strong)] bg-white/98"}`}>
              {label}
            </span>
          )}
        </button>
      );
    },
    [collapsed, dark, handleNavigate, mobileNavOpen, pathname, prefetchRoute]
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
              ui.sidebar
            } ${
              mobileNavOpen ? "translate-x-0" : "-translate-x-full"
            } ${
              collapsed ? "md:w-[96px]" : "md:w-[320px]"
            } w-[min(88vw,320px)]`}
          >
            <div className={`pointer-events-none absolute inset-0 hidden md:block ${dark ? "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(57,92,122,0.16),transparent_40%)]" : "bg-[radial-gradient(circle_at_top_left,rgba(57,92,122,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(165,165,141,0.16),transparent_40%)]"}`} />
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
                className={`min-h-10 min-w-10 rounded-xl border border-transparent p-2 transition hover:border-[var(--ui-border)] ${dark ? "hover:bg-white/[0.06]" : "hover:bg-black/[0.03]"}`}
                title="Toggle sidebar"
                aria-label="Toggle sidebar"
              >
                <Bars3Icon className="h-6 w-6 text-[var(--ui-text-main)]" />
              </button>

              {showSidebarLabels && (
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${dark ? "border-[var(--ui-border)] bg-white/[0.04] text-[color:rgba(230,237,243,0.72)]" : "border-[var(--ui-border-strong)] bg-black/[0.03] text-[color:rgba(75,85,99,0.82)]"}`}>
                  {roleLabel(user.role)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className={`mt-3 inline-flex min-h-11 items-center gap-3 rounded-[18px] border px-3 py-2.5 transition ${
                dark
                  ? "border-[var(--ui-border)] bg-white/[0.04] text-[var(--ui-text-main)] hover:bg-white/[0.08]"
                  : "border-[var(--ui-border-strong)] bg-white/70 text-[var(--ui-text-main)] hover:bg-white"
              } ${showSidebarLabels ? "w-full justify-start" : "w-full justify-center"}`}
              aria-label={themeToggleLabel}
              title={themeToggleLabel}
            >
                <span className={`grid h-9 w-9 place-items-center rounded-[14px] border ${dark ? "border-[var(--ui-border)] bg-white/[0.05]" : "border-[var(--ui-border-strong)] bg-black/[0.03]"}`}>
                {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </span>
              {showSidebarLabels && (
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-[13px] font-semibold">
                    {dark ? "Light Mode" : "Dark Mode"}
                  </span>
                  <span className="block text-[10px] uppercase tracking-[0.12em] text-[color:rgba(151,166,168,0.72)]">
                    Theme
                  </span>
                </span>
              )}
            </button>

            <div className={`mt-4 ${showSidebarLabels ? "" : "text-center"}`}>
              <div className={`flex items-center ${showSidebarLabels ? "gap-3" : "justify-center"}`}>
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-[var(--ui-border)] bg-white/[0.06] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:h-14 sm:w-14 sm:p-2">
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
                    <div className="text-[15px] font-bold leading-tight tracking-[0.01em] text-[var(--ui-text-main)] sm:text-base">
                      Hamiguitan
                    </div>
                    <div className="truncate text-[11px] font-medium text-[color:rgba(151,166,168,0.8)]">
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
                    className={`group relative flex w-full min-h-11 items-center gap-3 rounded-[20px] border px-3 py-2.5 transition-all duration-200 ease-out ${
                      showSidebarLabels ? "" : "justify-center"
                    } ${navActionBase(
                      bookingModuleActive
                    , dark)}`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-[14px] border transition-colors ${
                        bookingModuleActive
                          ? dark
                            ? "border-[var(--ui-border)] bg-white/[0.08] text-[var(--ui-text-main)]"
                            : "border-[var(--ui-border)] bg-black/[0.04] text-[var(--ui-text-main)]"
                          : dark
                            ? "border-transparent bg-transparent text-[color:rgba(230,237,243,0.78)] group-hover:border-[var(--ui-border)] group-hover:bg-white/[0.05] group-hover:text-[var(--ui-text-main)]"
                            : "border-transparent bg-transparent text-[color:rgba(75,85,99,0.8)] group-hover:border-[var(--ui-border)] group-hover:bg-black/[0.03] group-hover:text-[var(--ui-text-main)]"
                      }`}
                    >
                      <TicketIcon className="h-5 w-5" />
                    </span>

                    {showSidebarLabels && (
                      <>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block text-[13px] font-semibold tracking-[0.01em] text-[var(--ui-text-main)]">
                            Booking
                          </span>
                          <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[color:rgba(151,166,168,0.72)]">
                            Module
                          </span>
                        </span>
                        <span className="text-lg font-semibold text-[color:rgba(230,237,243,0.72)]">
                          {showBookingNav ? "−" : "+"}
                        </span>
                      </>
                    )}
                  </button>

                  {showSidebarLabels && showBookingNav && (
                    <div className="ml-4 space-y-1 border-l border-[var(--ui-border)] pl-3">
                      {navItems.booking.map((item) => navBtn(item.href, item.label, item.icon))}
                    </div>
                  )}
                </div>
              </nav>

              {showSidebarLabels && navItems.admin.length > 0 && (
                <div className="px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:rgba(151,166,168,0.66)]">
                  Admin Tools
                </div>
              )}

              <nav aria-label="Administrative navigation" className="space-y-1.5">
                {navItems.admin.map((item) => navBtn(item.href, item.label, item.icon))}
              </nav>
            </div>

            <div className="mt-4 border-t border-[var(--ui-border)] pt-4">
              {showSidebarLabels ? (
                <div className="px-3.5 py-1 text-left">
                  <div className="truncate text-[13px] font-semibold text-[var(--ui-text-main)]">
                    {user.email}
                  </div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:rgba(151,166,168,0.72)]">
                    {roleLabel(user.role)}
                  </div>
                </div>
              ) : (
                <div className="px-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:rgba(151,166,168,0.72)]">
                  {roleLabel(user.role)}
                </div>
              )}

              <button
                type="button"
                onClick={() => setConfirmLogoutPath(pathname)}
                className={`mt-3 flex w-full min-h-11 items-center gap-3 rounded-[20px] border px-3 py-2.5 transition ${
                  showSidebarLabels ? "" : "justify-center"
                } ${navActionBase(false, dark)} ${darkButtonStyle(dark)}`}
                aria-label="Logout"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[14px] border border-[var(--ui-border)] bg-white/[0.04] text-[color:rgba(230,237,243,0.88)]">
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </span>
                {showSidebarLabels && (
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-[13px] font-semibold text-[var(--ui-text-main)]">Logout</span>
                    <span className="block text-[10px] uppercase tracking-[0.12em] text-[color:rgba(151,166,168,0.72)]">
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
            className={`h-full flex-1 overflow-y-auto md:transition-colors md:duration-300 ${ui.page}`}
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
    </>
  );
}
