"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CalendarDayData } from "@/app/lib/bookingTypes";
import {
  addDays,
  firstDateOfMonth,
  formatMonthLabel,
  parseDateOnly,
  shiftMonth,
} from "@/app/lib/bookingUtils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const STATUS_LEGEND = [
  ["Available", "border-emerald-200/16 bg-emerald-400/9 text-emerald-100"],
  ["Limited", "border-amber-200/16 bg-amber-400/10 text-amber-100"],
  ["Full", "border-rose-200/16 bg-rose-400/10 text-rose-200"],
  ["Closed", "border-slate-200/16 bg-slate-400/10 text-slate-200"],
] as const;

const TRAIL_ROW_BASE =
  "flex items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-0";

type CalendarState =
  | { status: "loading"; days: CalendarDayData[] }
  | { status: "ready"; days: CalendarDayData[] }
  | { status: "error"; days: CalendarDayData[]; message: string };

function getWeekdayIndex(date: string) {
  const parsed = parseDateOnly(date);
  if (!parsed) return 0;
  return (parsed.getUTCDay() + 6) % 7;
}

function getDayNumber(date: string) {
  return date.slice(-2).replace(/^0/, "");
}

function getOverallState(day: {
  sanState: "available" | "limited" | "full" | "blocked";
  govState: "available" | "limited" | "full" | "blocked";
}) {
  if (day.sanState === "blocked" || day.govState === "blocked") return "blocked" as const;
  if (day.sanState === "full" || day.govState === "full") return "full" as const;
  if (day.sanState === "limited" || day.govState === "limited") return "limited" as const;
  return "available" as const;
}

function getStatusLabel(state: "available" | "limited" | "full" | "blocked") {
  if (state === "blocked") return "Closed";
  if (state === "full") return "Full";
  if (state === "limited") return "Limited";
  return "Available";
}

function getStatusTone(state: "available" | "limited" | "full" | "blocked") {
  if (state === "blocked") return "border-slate-200/16 bg-slate-400/10 text-slate-200";
  if (state === "full") return "border-rose-200/16 bg-rose-400/10 text-rose-200";
  if (state === "limited") return "border-amber-200/16 bg-amber-400/10 text-amber-100";
  return "border-emerald-200/16 bg-emerald-400/9 text-emerald-100";
}

function getTrailStateTone(state: "available" | "limited" | "full" | "blocked") {
  if (state === "blocked") return "text-slate-200";
  if (state === "full") return "text-rose-200";
  if (state === "limited") return "text-amber-100";
  return "text-emerald-100";
}

function getCalendarCellTone(state: "available" | "limited" | "full" | "blocked") {
  if (state === "blocked") {
    return "border-slate-300/16 bg-[linear-gradient(180deg,rgba(148,163,184,0.12),rgba(15,23,42,0.16))]";
  }

  if (state === "full") {
    return "border-rose-300/18 bg-[linear-gradient(180deg,rgba(251,113,133,0.13),rgba(15,23,42,0.16))]";
  }

  if (state === "limited") {
    return "border-amber-300/18 bg-[linear-gradient(180deg,rgba(251,191,36,0.13),rgba(15,23,42,0.16))]";
  }

  return "border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.028))]";
}

function formatShortDateLabel(date: string) {
  const parsed = parseDateOnly(date);
  if (!parsed) return date;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function buildCalendarGrid(month: string) {
  const start = parseDateOnly(firstDateOfMonth(month));
  if (!start) return [];

  const startOffset = getWeekdayIndex(firstDateOfMonth(month));
  const leadingStart = addDays(start, -startOffset);
  const totalDays = 42;

  return Array.from({ length: totalDays }, (_, index) => {
    const date = addDays(leadingStart, index);
    const iso = date.toISOString().slice(0, 10);
    return {
      date: iso,
      inMonth: iso.startsWith(month),
    };
  }).filter((_, index, array) => {
    if (index < 35) return true;
    return array.slice(35).some((entry) => entry.inMonth);
  });
}

function PublicScheduleCalendarFallback({ month }: { month: string }) {
  const calendarGrid = useMemo(() => buildCalendarGrid(month), [month]);

  return (
    <div className="public-card mt-7 overflow-hidden p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {calendarGrid
          .filter((entry) => entry.inMonth)
          .map((entry) => (
            <article
              key={entry.date}
              className="min-h-[172px] rounded-[22px] border border-[var(--public-border)] bg-[rgba(255,255,255,0.04)] px-4 py-4"
            >
              <div className="flex h-full animate-pulse flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="h-5 w-20 rounded-full bg-white/10" />
                    <div className="mt-2 h-3.5 w-14 rounded-full bg-white/8" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-white/8" />
                </div>
                <div className="space-y-2.5">
                  <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-3 py-2.5">
                    <div className="h-3 w-20 rounded-full bg-white/8" />
                    <div className="mt-2 h-4 w-16 rounded-full bg-white/10" />
                  </div>
                  <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-3 py-2.5">
                    <div className="h-3 w-20 rounded-full bg-white/8" />
                    <div className="mt-2 h-4 w-16 rounded-full bg-white/10" />
                  </div>
                </div>
              </div>
            </article>
          ))}
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-2 px-1 text-center">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(236,242,249,0.56)]"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {calendarGrid.map((entry) => (
            entry.inMonth ? (
              <article
                key={entry.date}
                className="min-h-[150px] rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3.5"
              >
                <div className="flex h-full animate-pulse flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-4 w-5 rounded-full bg-white/10" />
                    <div className="h-5 w-14 rounded-full bg-white/8" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
                      <div className="h-3 w-12 rounded-full bg-white/8" />
                      <div className="mt-2 h-4 w-14 rounded-full bg-white/10" />
                    </div>
                    <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
                      <div className="h-3 w-12 rounded-full bg-white/8" />
                      <div className="mt-2 h-4 w-14 rounded-full bg-white/10" />
                    </div>
                  </div>
                </div>
              </article>
            ) : (
              <div key={entry.date} aria-hidden="true" className="min-h-[150px]" />
            )
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PublicScheduleCalendarClient({ month }: { month: string }) {
  const [calendarState, setCalendarState] = useState<CalendarState>({
    status: "loading",
    days: [],
  });

  useEffect(() => {
    const controller = new AbortController();
    setCalendarState((current) => ({
      status: "loading",
      days: current.days,
    }));

    const loadCalendar = async () => {
      try {
        const response = await fetch(`/api/public-calendar?month=${month}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load public calendar data.");
        }

        const payload = (await response.json()) as { days?: CalendarDayData[] };
        if (controller.signal.aborted) return;

        setCalendarState({
          status: "ready",
          days: Array.isArray(payload.days) ? payload.days : [],
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setCalendarState((current) => ({
          status: "error",
          days: current.days,
          message:
            error instanceof Error ? error.message : "Failed to load public calendar data.",
        }));
      }
    };

    void loadCalendar();

    return () => controller.abort();
  }, [month]);

  const calendarGrid = useMemo(() => buildCalendarGrid(month), [month]);
  const preparedCalendarCells = useMemo(() => {
    const daysByDate = new Map(calendarState.days.map((day) => [day.date, day]));

    return calendarGrid.map((entry) => {
      const day = daysByDate.get(entry.date);
      const state = day ? getOverallState(day) : "available";

      return {
        ...entry,
        day,
        state,
        detailLabel: day
          ? `San Isidro: ${day.sanIsidro}/30, Governor Generoso: ${day.governorGeneroso}/30`
          : "",
      };
    });
  }, [calendarGrid, calendarState.days]);

  const previousMonth = useMemo(() => shiftMonth(month, -1), [month]);
  const nextMonth = useMemo(() => shiftMonth(month, 1), [month]);

  return (
    <>
      <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="public-eyebrow">Monthly Snapshot</p>
          <h2 className="mt-3 text-[1.9rem] font-semibold tracking-[-0.04em] text-[var(--public-text)] sm:text-[2.25rem]">
            Trail Schedule Overview
          </h2>
          <p className="mt-3 max-w-xl text-[0.95rem] leading-7 text-[rgba(236,242,249,0.68)]">
            A read-only monthly summary that keeps trail capacity clear and easy to scan without operational booking detail.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:min-w-[18rem] lg:items-end">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-[rgba(8,12,18,0.24)] px-4 py-2.5 text-sm font-semibold text-[var(--public-text)]">
            <span className="text-[rgba(236,242,249,0.62)]">Viewing</span>
            <span className="ml-2 text-[var(--public-text)]">{formatMonthLabel(month)}</span>
          </div>
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <Link
              href={`/schedule?month=${previousMonth}`}
              prefetch
              className="public-button-secondary-light inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold"
            >
              Previous
            </Link>
            <Link
              href={`/schedule?month=${nextMonth}`}
              prefetch
              className="public-button-secondary-light inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold"
            >
              Next
            </Link>
          </div>
        </div>
      </div>

      {calendarState.status === "loading" && calendarState.days.length === 0 ? (
        <PublicScheduleCalendarFallback month={month} />
      ) : (
        <div className="public-card mt-6 overflow-hidden p-4 md:p-6">
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {preparedCalendarCells
              .filter((entry) => entry.inMonth)
              .map((entry) => (
                <article
                  key={entry.date}
                  className={`min-h-[168px] rounded-[20px] border px-4 py-3.5 ${getCalendarCellTone(entry.state)}`}
                >
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[1.02rem] font-semibold tracking-[-0.03em] text-[var(--public-text)]">
                          {formatShortDateLabel(entry.date)}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[rgba(236,242,249,0.48)]">
                          Read-only schedule
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] ${getStatusTone(entry.state)}`}
                      >
                        {getStatusLabel(entry.state)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className={`${TRAIL_ROW_BASE} border-b border-white/6`}>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-[rgba(236,242,249,0.48)]">
                            San Isidro
                          </p>
                          <p className={`mt-1 text-[11px] font-medium ${getTrailStateTone(entry.day?.sanState || "available")}`}>
                            {getStatusLabel(entry.day?.sanState || "available")}
                          </p>
                        </div>
                        <p className="shrink-0 text-base font-semibold tracking-[-0.02em] text-[var(--public-text)]">
                          {entry.day?.sanIsidro || 0} / 30
                        </p>
                      </div>

                      <div className={TRAIL_ROW_BASE}>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-[rgba(236,242,249,0.48)]">
                            Gov. Generoso
                          </p>
                          <p className={`mt-1 text-[11px] font-medium ${getTrailStateTone(entry.day?.govState || "available")}`}>
                            {getStatusLabel(entry.day?.govState || "available")}
                          </p>
                        </div>
                        <p className="shrink-0 text-base font-semibold tracking-[-0.02em] text-[var(--public-text)]">
                          {entry.day?.governorGeneroso || 0} / 30
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
          </div>

          <div className="hidden md:block">
            <div className="grid grid-cols-7 gap-2 px-1 text-center">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(236,242,249,0.56)]"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {preparedCalendarCells.map((entry) => (
                entry.inMonth ? (
                  <article
                    key={entry.date}
                    title={entry.day ? entry.detailLabel : undefined}
                    className={`min-h-[166px] rounded-[20px] border px-4 py-3.5 ${getCalendarCellTone(entry.state)}`}
                  >
                    <div className="flex h-full flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold tracking-[-0.02em] text-[var(--public-text)]">
                          {getDayNumber(entry.date)}
                        </span>
                        {entry.day ? (
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.18em] ${getStatusTone(entry.state)}`}
                          >
                            {getStatusLabel(entry.state)}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className={`${TRAIL_ROW_BASE} border-b border-white/6`}>
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase tracking-[0.16em] text-[rgba(236,242,249,0.48)]">
                              San Isidro
                            </p>
                            <p className={`mt-1 text-[10px] font-medium ${getTrailStateTone(entry.day?.sanState || "available")}`}>
                              {getStatusLabel(entry.day?.sanState || "available")}
                            </p>
                          </div>
                          <p className="shrink-0 text-[15px] font-semibold tracking-[-0.02em] text-[var(--public-text)]">
                            {entry.day?.sanIsidro || 0} / 30
                          </p>
                        </div>

                        <div className={TRAIL_ROW_BASE}>
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase tracking-[0.16em] text-[rgba(236,242,249,0.48)]">
                              Gov. Generoso
                            </p>
                            <p className={`mt-1 text-[10px] font-medium ${getTrailStateTone(entry.day?.govState || "available")}`}>
                              {getStatusLabel(entry.day?.govState || "available")}
                            </p>
                          </div>
                          <p className="shrink-0 text-[15px] font-semibold tracking-[-0.02em] text-[var(--public-text)]">
                            {entry.day?.governorGeneroso || 0} / 30
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ) : (
                  <div key={entry.date} aria-hidden="true" className="min-h-[166px]" />
                )
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-[20px] border border-white/8 bg-white/[0.022] px-4 py-3.5 lg:grid-cols-[1.25fr_auto] lg:items-center">
            <div className="grid gap-2 text-[13px] leading-6 text-[rgba(236,242,249,0.62)] sm:grid-cols-2">
              <p>Each date keeps separate San Isidro and Governor Generoso capacities in a clean public summary view.</p>
              <p>Status colors use the same UTC-normalized availability and closure logic as the internal schedule calculations.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[13px] text-[var(--public-text-muted)]">
              {STATUS_LEGEND.map(([label, tone]) => (
                <span
                  key={label}
                  className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${tone}`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {calendarState.status === "error" ? (
        <p className="mt-4 text-sm text-[var(--public-text-muted)]">
          {calendarState.message}
        </p>
      ) : null}
    </>
  );
}
