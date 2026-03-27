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
  ["Available", "border-emerald-200/18 bg-emerald-400/10 text-emerald-100"],
  ["Limited", "border-amber-200/18 bg-amber-400/10 text-amber-100"],
  ["Full", "border-rose-200/18 bg-rose-400/10 text-rose-200"],
] as const;

type CalendarState =
  | { status: "loading"; days: CalendarDayData[] }
  | { status: "ready"; days: CalendarDayData[] }
  | { status: "error"; days: CalendarDayData[]; message: string };

function getWeekdayIndex(date: string) {
  return (new Date(`${date}T00:00:00`).getDay() + 6) % 7;
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
  if (state === "blocked") return "border-slate-200/18 bg-slate-400/10 text-slate-200";
  if (state === "full") return "border-rose-200/18 bg-rose-400/10 text-rose-200";
  if (state === "limited") return "border-amber-200/18 bg-amber-400/10 text-amber-100";
  return "border-emerald-200/18 bg-emerald-400/10 text-emerald-100";
}

function formatShortDateLabel(date: string) {
  const parsed = parseDateOnly(date);
  if (!parsed) return date;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
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
    <div className="public-card mt-6 overflow-hidden p-4 md:p-6">
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {calendarGrid
          .filter((entry) => entry.inMonth)
          .map((entry) => (
            <article
              key={entry.date}
              className="min-h-[142px] rounded-[20px] border border-[var(--public-border)] bg-[rgba(255,255,255,0.04)] px-4 py-4"
            >
              <div className="flex h-full animate-pulse flex-col justify-between">
                <div>
                  <div className="h-5 w-20 rounded-full bg-white/10" />
                  <div className="mt-3 h-4 w-16 rounded-full bg-white/8" />
                </div>
                <div className="mt-4">
                  <div className="h-6 w-20 rounded-full bg-white/10" />
                  <div className="mt-3 h-4 w-14 rounded-full bg-white/8" />
                </div>
              </div>
            </article>
          ))}
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-3 text-center">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--public-text-muted)]"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {calendarGrid.map((entry) => (
            <article
              key={entry.date}
              className={`min-h-[132px] rounded-[20px] border p-4 ${
                entry.inMonth
                  ? "border-[var(--public-border)] bg-[rgba(255,255,255,0.04)]"
                  : "border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)] opacity-55"
              }`}
            >
              <div className="flex h-full animate-pulse flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-4 w-5 rounded-full bg-white/10" />
                  {entry.inMonth ? <div className="h-5 w-16 rounded-full bg-white/8" /> : null}
                </div>
                {entry.inMonth ? <div className="h-5 w-16 rounded-full bg-white/10" /> : null}
              </div>
            </article>
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
          cache: "force-cache",
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
      const totalOccupied = day ? day.sanIsidro + day.governorGeneroso : 0;

      return {
        ...entry,
        day,
        state,
        totalOccupied,
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
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="public-eyebrow">Monthly View</p>
          <h2 className="public-h3 mt-3">Trail Availability Calendar</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-[rgba(8,12,18,0.3)] px-4 py-3 text-sm font-semibold text-[var(--public-text)]">
            {formatMonthLabel(month)}
          </span>
          <Link
            href={`/schedule?month=${previousMonth}`}
            prefetch
            className="public-button-secondary-light inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold"
          >
            Previous
          </Link>
          <Link
            href={`/schedule?month=${nextMonth}`}
            prefetch
            className="public-button-secondary-light inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold"
          >
            Next
          </Link>
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
                  className="min-h-[142px] rounded-[20px] border border-[var(--public-border)] bg-[rgba(255,255,255,0.04)] px-4 py-4"
                >
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <p className="text-[1.05rem] font-semibold text-[var(--public-text)]">
                        {formatShortDateLabel(entry.date)}
                      </p>
                      <p className="mt-3 text-sm font-medium text-[var(--public-text-muted)]">
                        {getStatusLabel(entry.state)}
                      </p>
                    </div>
                    <div className="mt-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusTone(entry.state)}`}
                      >
                        {getStatusLabel(entry.state)}
                      </span>
                      <p className="mt-3 text-sm font-semibold text-[var(--public-text)]">
                        {entry.totalOccupied} / 30
                      </p>
                    </div>
                  </div>
                </article>
              ))}
          </div>

          <div className="hidden md:block">
            <div className="grid grid-cols-7 gap-3 text-center">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--public-text-muted)]"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-3">
              {preparedCalendarCells.map((entry) => (
                <article
                  key={entry.date}
                  title={entry.inMonth && entry.day ? entry.detailLabel : undefined}
                  className={`min-h-[132px] rounded-[20px] border p-4 transition ${
                    entry.inMonth
                      ? "border-[var(--public-border)] bg-[rgba(255,255,255,0.04)]"
                      : "border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)] opacity-55"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-[var(--public-text)]">
                      {getDayNumber(entry.date)}
                    </span>
                    {entry.inMonth && entry.day ? (
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusTone(entry.state)}`}
                      >
                        {getStatusLabel(entry.state)}
                      </span>
                    ) : null}
                  </div>

                  {entry.inMonth && entry.day ? (
                    <div className="mt-6 space-y-3">
                      <p className="text-base font-semibold text-[var(--public-text)]">
                        {entry.totalOccupied} / 30
                      </p>
                    </div>
                  ) : entry.inMonth ? (
                    <div className="mt-10 text-base font-semibold text-[var(--public-text-muted)]">
                      0 / 30
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2 text-sm text-[var(--public-text-muted)]">
        {STATUS_LEGEND.map(([label, tone]) => (
          <span
            key={label}
            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${tone}`}
          >
            {label}
          </span>
        ))}
      </div>

      {calendarState.status === "error" ? (
        <p className="mt-4 text-sm text-[var(--public-text-muted)]">
          {calendarState.message}
        </p>
      ) : null}
    </>
  );
}
