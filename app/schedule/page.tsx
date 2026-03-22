import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import PublicShell from "@/app/components/public/PublicShell";
import { Reveal } from "@/app/components/public/ScrollReveal";
import { getCalendarData } from "@/app/lib/bookings";
import {
  addDays,
  expandDateRange,
  firstDateOfMonth,
  formatMonthLabel,
  parseDateOnly,
  shiftMonth,
} from "@/app/lib/bookingUtils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function getValidMonth(value?: string) {
  return /^\d{4}-\d{2}$/.test(String(value || ""))
    ? String(value)
    : new Date().toISOString().slice(0, 7);
}

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

  const nextMonth = parseDateOnly(firstDateOfMonth(shiftMonth(month, 1)));
  if (!nextMonth) return [];

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

export default async function PublicSchedulePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const monthParam = Array.isArray(params.month) ? params.month[0] : params.month;
  const month = getValidMonth(monthParam);
  const calendarData = await getCalendarData(month);
  const previousMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const daysByDate = new Map(
    calendarData.days.map((day) => [
      day.date,
      {
        ...day,
        sanIsidro: 0,
        governorGeneroso: 0,
      },
    ])
  );

  for (const booking of calendarData.bookings) {
    if (booking.booking_type === "Off Season" || booking.booking_type === "Block Schedule") {
      continue;
    }

    for (const coveredDate of expandDateRange(booking.start_date, booking.end_date)) {
      if (!coveredDate.startsWith(month)) continue;
      const existing = daysByDate.get(coveredDate);
      if (!existing) continue;

      if (booking.trail === "San Isidro Trail") {
        existing.sanIsidro += booking.pax;
      } else if (booking.trail === "Governor Generoso Trail") {
        existing.governorGeneroso += booking.pax;
      }
    }
  }

  const calendarGrid = buildCalendarGrid(month);
  const preparedCalendarCells = calendarGrid.map((entry) => {
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

  return (
    <PublicShell>
      <section className="relative isolate overflow-hidden border-b border-[var(--public-border)] bg-[#06090f]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(6,9,14,0.16) 0%, rgba(6,9,14,0.24) 36%, rgba(5,7,11,0.72) 100%), url('/images/carousel/carousel-04.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(245,158,11,0.14),transparent_18%),radial-gradient(circle_at_76%_18%,rgba(120,180,157,0.14),transparent_18%),linear-gradient(90deg,rgba(7,10,16,0.2)_0%,rgba(7,10,16,0.04)_42%,rgba(7,10,16,0.36)_100%)]" />

        <div className="public-container relative py-24 md:py-28">
          <Reveal className="max-w-4xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
              <p className="public-eyebrow">Climb Schedule</p>
              <h1 className="mt-4 max-w-3xl text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.045em] text-[var(--public-text)] sm:text-[3rem] lg:text-[4rem]">
                Check monthly trail availability
              </h1>
              <p className="mt-5 max-w-2xl text-[1rem] leading-8 text-[rgba(236,242,249,0.88)] sm:text-[1.06rem]">
                See date-based trail availability for San Isidro and Governor Generoso in one public calendar view.
              </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-[rgba(8,12,18,0.3)] px-4 py-3 text-sm text-[var(--public-text)] backdrop-blur-[4px]">
                  <CalendarDaysIcon className="h-5 w-5 text-[var(--public-accent)]" />
                  <span className="font-semibold">{formatMonthLabel(month)}</span>
                </div>
                <Link
                  href={`/schedule?month=${previousMonth}`}
                  className="public-button-secondary-light inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Previous
                </Link>
                <Link
                  href={`/schedule?month=${nextMonth}`}
                  className="public-button-secondary-light inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold"
                >
                  Next
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="public-section public-section-light">
        <div className="public-container max-w-[1180px]">
          <div>
            <div>
              <p className="public-eyebrow">Monthly View</p>
              <h2 className="public-h3 mt-3">Trail Availability Calendar</h2>
            </div>
          </div>

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
                {preparedCalendarCells.map((entry) => {
                  return (
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
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-sm text-[var(--public-text-muted)]">
            {[
              ["Available", "border-emerald-200/18 bg-emerald-400/10 text-emerald-100"],
              ["Limited", "border-amber-200/18 bg-amber-400/10 text-amber-100"],
              ["Full", "border-rose-200/18 bg-rose-400/10 text-rose-200"],
            ].map(([label, tone]) => (
              <span
                key={label}
                className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${tone}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
