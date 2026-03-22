"use client";

import { repoTheme } from "@/app/lib/repoTheme";
import { useProtectedTheme } from "@/app/components/ProtectedThemeProvider";

type ProtectedLoadingOverlayProps = {
  mode?: "auth" | "route";
};

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`app-skeleton-block ${className}`} />;
}

function ContentSkeleton({ mode }: { mode: "auth" | "route" }) {
  const { theme } = useProtectedTheme();
  const ui = repoTheme(theme);

  return (
    <div className="protected-main-content min-h-full">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {mode === "auth" && (
          <div className={`${ui.panelSoft} flex items-center justify-between gap-4 rounded-[24px] px-5 py-4`}>
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-32 rounded-full" />
              <SkeletonBlock className="h-4 w-56 rounded-full" />
            </div>
            <SkeletonBlock className="hidden h-10 w-28 rounded-full sm:block" />
          </div>
        )}

        <section className={`${ui.card} rounded-[28px] p-5 sm:p-6`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-28 rounded-full" />
              <SkeletonBlock className="h-10 w-[min(24rem,80vw)] rounded-[18px]" />
              <SkeletonBlock className="h-4 w-[min(34rem,88vw)] rounded-full" />
            </div>
            <div className="flex flex-wrap gap-3">
              <SkeletonBlock className="h-11 w-32 rounded-full" />
              <SkeletonBlock className="h-11 w-28 rounded-full" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={`${ui.card} rounded-[24px] p-5 sm:p-6`}>
              <SkeletonBlock className="h-3 w-24 rounded-full" />
              <SkeletonBlock className="mt-4 h-10 w-20 rounded-[16px]" />
              <div className="mt-5 flex flex-wrap gap-2">
                <SkeletonBlock className="h-7 w-20 rounded-full" />
                <SkeletonBlock className="h-7 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </section>

        <section className={`${ui.panelSoft} flex w-full flex-wrap gap-2 rounded-[24px] p-2 sm:w-fit`}>
          <SkeletonBlock className="h-14 flex-1 rounded-[18px] sm:w-[210px]" />
          <SkeletonBlock className="h-14 flex-1 rounded-[18px] sm:w-[210px]" />
          <SkeletonBlock className="h-14 flex-1 rounded-[18px] sm:w-[210px]" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]">
          <div className={`${ui.tableWrap} rounded-[28px]`}>
            <div className="flex items-center justify-between border-b border-[var(--app-surface-border)] px-5 py-4 sm:px-6">
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-36 rounded-full" />
                <SkeletonBlock className="h-3 w-48 rounded-full" />
              </div>
              <SkeletonBlock className="h-10 w-28 rounded-full" />
            </div>
            <div className="space-y-3 px-5 py-5 sm:px-6">
              <div className="grid grid-cols-[1.1fr_0.75fr_0.6fr_0.5fr] gap-3">
                <SkeletonBlock className="h-3 rounded-full" />
                <SkeletonBlock className="h-3 rounded-full" />
                <SkeletonBlock className="h-3 rounded-full" />
                <SkeletonBlock className="h-3 rounded-full" />
              </div>
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className={`${ui.panelSoft} grid gap-3 rounded-[22px] px-4 py-4 sm:grid-cols-[1.1fr_0.75fr_0.6fr_0.5fr]`}
                >
                  <SkeletonBlock className="h-4 w-4/5 rounded-full" />
                  <SkeletonBlock className="h-4 w-3/4 rounded-full" />
                  <SkeletonBlock className="h-4 w-2/3 rounded-full" />
                  <SkeletonBlock className="h-4 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className={`${ui.card} rounded-[28px] p-5 sm:p-6`}>
              <div className="space-y-3">
                <SkeletonBlock className="h-4 w-28 rounded-full" />
                <SkeletonBlock className="h-3 w-40 rounded-full" />
              </div>
              <div className="mt-5 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className={`${ui.panelSoft} rounded-[22px] px-4 py-4`}>
                    <SkeletonBlock className="h-4 w-2/3 rounded-full" />
                    <SkeletonBlock className="mt-3 h-3 w-4/5 rounded-full" />
                    <div className="mt-4 flex gap-2">
                      <SkeletonBlock className="h-6 w-16 rounded-full" />
                      <SkeletonBlock className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${ui.card} rounded-[28px] p-5 sm:p-6`}>
              <div className="space-y-3">
                <SkeletonBlock className="h-4 w-24 rounded-full" />
                <SkeletonBlock className="h-3 w-36 rounded-full" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-24 rounded-[22px]" />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="app-protected-sidebar fixed inset-y-0 left-0 z-50 hidden h-full w-[224px] flex-col overflow-hidden border-r p-4 md:flex">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(57,92,122,0.18),transparent_40%)]" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between gap-3">
          <SkeletonBlock className="h-10 w-10 rounded-[16px]" />
          <SkeletonBlock className="h-7 w-20 rounded-full" />
        </div>

        <div className="app-protected-sidebar-card mt-3 flex items-center gap-3 rounded-[18px] px-3 py-3">
          <SkeletonBlock className="h-9 w-9 rounded-[14px]" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-24 rounded-full" />
            <SkeletonBlock className="h-3 w-14 rounded-full" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="app-protected-sidebar-card flex h-14 w-14 items-center justify-center rounded-[20px]">
            <SkeletonBlock className="h-8 w-8 rounded-xl" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-24 rounded-full" />
            <SkeletonBlock className="h-3 w-28 rounded-full" />
          </div>
        </div>

        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="mt-4 flex-1 space-y-2 overflow-hidden pr-1.5">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="app-protected-sidebar-link flex items-center gap-3 rounded-[18px] border px-3 py-2.5">
              <div className="app-protected-sidebar-icon grid h-9 w-9 place-items-center rounded-[14px] border">
                <SkeletonBlock className="h-4 w-4 rounded-md" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-3.5 w-24 rounded-full" />
                <SkeletonBlock className="h-2.5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="app-protected-sidebar-card rounded-[22px] p-3">
            <SkeletonBlock className="h-4 w-32 rounded-full" />
            <SkeletonBlock className="mt-2 h-3 w-16 rounded-full" />
          </div>
          <div className="app-protected-sidebar-card mt-3 flex items-center gap-3 rounded-[18px] px-3 py-2.5">
            <SkeletonBlock className="h-9 w-9 rounded-[14px]" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-3.5 w-20 rounded-full" />
              <SkeletonBlock className="h-2.5 w-14 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function ProtectedLoadingOverlay({
  mode = "route",
}: ProtectedLoadingOverlayProps) {
  const { theme } = useProtectedTheme();
  const ui = repoTheme(theme);

  if (mode === "route") {
    return <ContentSkeleton mode="route" />;
  }

  return (
    <div className={`protected-sidebar-shell h-[100dvh] overflow-hidden ${ui.page}`}>
      <div className="flex h-full">
        <SidebarSkeleton />

        <main
          role="main"
          aria-busy="true"
          className={`scroll-page h-full flex-1 overflow-y-auto md:transition-colors md:duration-300 ${ui.page}`}
        >
          <div className={`app-protected-sidebar-bar sticky top-0 z-30 border-b px-4 py-2.5 md:hidden`}>
            <div className="flex items-center justify-between gap-3">
              <div className="app-protected-sidebar-bar-button grid min-h-11 min-w-11 place-items-center rounded-xl border">
                <SkeletonBlock className="h-5 w-5 rounded-md" />
              </div>
              <div className="app-protected-sidebar-bar-button grid min-h-11 min-w-11 place-items-center rounded-xl border">
                <SkeletonBlock className="h-5 w-5 rounded-md" />
              </div>
              <div className="min-w-0 flex-1 text-right">
                <SkeletonBlock className="ml-auto h-3 w-24 rounded-full" />
                <SkeletonBlock className="mt-2 ml-auto h-4 w-36 rounded-full" />
              </div>
            </div>
          </div>

          <ContentSkeleton mode="auth" />
        </main>
      </div>
    </div>
  );
}
