"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import {
  PARTICIPANT_CATEGORY_OPTIONS,
  type CalendarDayData,
  type ParticipantCategoryOption,
  type SelectedDateBooking,
} from "@/app/lib/bookingTypes";
import {
  addDays,
  firstDateOfMonth,
  formatDateOnly,
  formatDisplayDate,
  formatMonthLabel,
  shiftMonth,
} from "@/app/lib/bookingUtils";

const ALL_CATEGORIES = "All Categories" as const;
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type CalendarApiResponse = {
  days: CalendarDayData[];
  summary: {
    sanOpenDays: number;
    govOpenDays: number;
    fullTrailDays: number;
    specialOrBlockedDays: number;
  };
  bookings: SelectedDateBooking[];
};

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getCurrentDate() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekdayIndex(date: string) {
  return (new Date(`${date}T00:00:00`).getDay() + 6) % 7;
}

function formatDayNumber(date: string) {
  return date.slice(-2).replace(/^0/, "");
}

function formatDayStateLabel(state?: CalendarDayData["sanState"] | null) {
  if (state === "blocked") return "Closed";
  if (state === "full") return "High Demand";
  if (state === "limited") return "Limited";
  return "Open";
}

function getOverallState(day: CalendarDayData) {
  const specialStatus = String((day as CalendarDayData & { specialStatus?: string | null }).specialStatus || "")
    .trim()
    .toLowerCase();

  if (
    day.sanState === "blocked" ||
    day.govState === "blocked" ||
    specialStatus.includes("blocked") ||
    specialStatus.includes("off season") ||
    specialStatus.includes("closed")
  ) {
    return "blocked" as const;
  }

  if (day.sanState === "full" || day.govState === "full") {
    return "full" as const;
  }

  if (day.sanState === "limited" || day.govState === "limited") {
    return "limited" as const;
  }

  return "available" as const;
}


const CalendarDayButton = memo(function CalendarDayButton({
  day,
  selected,
  onSelect,
}: {
  day: CalendarDayData;
  selected: boolean;
  onSelect: (date: string) => void;
}) {
  const state = getOverallState(day);
  const isToday = day.date === getCurrentDate();
  const sanFull = day.sanState === "full";
  const govFull = day.govState === "full";

  const dotTone: Record<string, string> = {
    available: "bg-emerald-500",
    limited: "bg-amber-400",
    full: "bg-rose-500",
    blocked: "bg-slate-400",
  };

  const stateSurface =
    state === "limited"
      ? "from-amber-50/85 to-white"
      : state === "full"
        ? "from-rose-50/80 to-white"
        : state === "blocked"
          ? "from-slate-100/90 to-white"
          : "from-emerald-50/60 to-white";

  const cellTone = selected
    ? "bg-[linear-gradient(180deg,rgba(242,249,244,0.98),rgba(255,255,255,0.98))] border-[#235347]/34 shadow-[0_10px_24px_rgba(35,83,71,0.08),inset_0_1px_0_rgba(255,255,255,0.92)]"
    : `bg-[linear-gradient(180deg,var(--tw-gradient-from),var(--tw-gradient-to))] ${stateSurface} border-slate-200/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-[1px] hover:bg-white hover:border-[#ccdbd1] hover:shadow-[0_8px_18px_rgba(15,23,42,0.05)]`;

  return (
    <button
      type="button"
      onClick={() => onSelect(day.date)}
      className={`group relative min-h-[98px] rounded-[18px] border px-3.5 py-3 text-left transition-all duration-200 ${cellTone}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`mt-1 inline-flex h-2 w-2 rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.9)] ${dotTone[state] ?? "bg-slate-300"}`}
          aria-hidden="true"
        />
        <div className="flex items-center gap-2">
          {isToday && (
            <span className="rounded-full border border-[#d5e3da] bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#235347]">
              Today
            </span>
          )}
          <span
            className={`text-[24px] font-semibold tracking-[-0.06em] ${
              selected ? "text-[#16362d]" : "text-slate-900"
            }`}
          >
            {formatDayNumber(day.date)}
          </span>
        </div>
      </div>

      <div className="mt-2.5 space-y-1">
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className={`font-medium uppercase tracking-[0.08em] ${sanFull ? "text-rose-500" : "text-slate-400"}`}>
            San Isidro
          </span>
          <span className={`font-semibold tracking-[-0.03em] ${sanFull ? "text-rose-700" : "text-slate-900"}`}>
            {day.sanIsidro}
            <span className="ml-0.5 text-slate-400">/30</span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className={`font-medium uppercase tracking-[0.08em] ${govFull ? "text-rose-500" : "text-slate-400"}`}>
            Gov. Generoso
          </span>
          <span className={`font-semibold tracking-[-0.03em] ${govFull ? "text-rose-700" : "text-slate-900"}`}>
            {day.governorGeneroso}
            <span className="ml-0.5 text-slate-400">/30</span>
          </span>
        </div>
      </div>
    </button>
  );
});

function DayDetailsModal({
  open,
  onClose,
  selectedDate,
  selectedNote,
  selectedCapacityNote,
  selectedDay,
  selectedDateBookings,
  selectedClosed,
  canCreateBookings,
  selectedCamp4Advised,
}: {
  open: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedNote: string;
  selectedCapacityNote: string;
  selectedDay: CalendarDayData | null;
  selectedDateBookings: SelectedDateBooking[];
  selectedClosed: boolean;
  canCreateBookings: boolean;
  selectedCamp4Advised: boolean;
}) {
  return (
    <AnimatePresence mode="wait">
      {open && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center p-3 sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close day details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#16362d]/28 backdrop-blur-[3px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-[121] flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border border-[#e1e8e2] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,251,248,0.97))] shadow-[0_32px_90px_rgba(15,23,42,0.22)] sm:max-h-[calc(100vh-3rem)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#e3e9e4] px-5 py-5 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5c7b67]">
                  Selected Date
                </p>
                <h2 className="mt-2 text-[1.95rem] font-semibold tracking-[-0.05em] text-slate-900">
                  {formatDisplayDate(selectedDate)}
                </h2>
                <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate-600">{selectedNote}</p>
                {selectedCapacityNote && (
                  <p className="mt-2 text-sm font-medium text-slate-500">{selectedCapacityNote}</p>
                )}
                {selectedCamp4Advised && (
                  <span className="mt-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                    Camp 4 advised
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dfe7e1] bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close day details"
              >
                x
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <article
                  className={`rounded-[24px] border p-4 ${
                    selectedDay?.sanState === "full"
                      ? "border-rose-200/90 bg-[linear-gradient(180deg,rgba(255,241,242,0.96),rgba(255,255,255,0.96))] text-rose-800"
                      : "border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(255,255,255,0.96))] text-emerald-800"
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                    San Isidro Trail
                  </p>
                  <p className="mt-2.5 text-3xl font-semibold tracking-[-0.05em]">
                    {selectedDay?.sanIsidro || 0}
                    <span className="ml-1 text-base font-medium opacity-80">/ 30</span>
                  </p>
                  <p className="mt-2 text-sm opacity-90">
                    {formatDayStateLabel(selectedDay?.sanState)}
                  </p>
                </article>

                <article
                  className={`rounded-[24px] border p-4 ${
                    selectedDay?.govState === "full"
                      ? "border-rose-200/90 bg-[linear-gradient(180deg,rgba(255,241,242,0.96),rgba(255,255,255,0.96))] text-rose-800"
                      : "border-[#d7e1db] bg-[linear-gradient(180deg,rgba(238,243,240,0.96),rgba(255,255,255,0.96))] text-[#305648]"
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                    Gov. Generoso Trail
                  </p>
                  <p className="mt-2.5 text-3xl font-semibold tracking-[-0.05em]">
                    {selectedDay?.governorGeneroso || 0}
                    <span className="ml-1 text-base font-medium opacity-80">/ 30</span>
                  </p>
                  <p className="mt-2 text-sm opacity-90">
                    {formatDayStateLabel(selectedDay?.govState)}
                  </p>
                </article>
              </div>

              <div>
                {selectedClosed ? (
                  <div className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 text-sm font-semibold text-slate-600">
                    Closed for Booking
                  </div>
                ) : !canCreateBookings ? (
                  <div className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 text-sm font-semibold text-slate-600">
                    View Only Access
                  </div>
                ) : (
                  <Link
                    href={`/booking?startDate=${selectedDate}`}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#235347] px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(35,83,71,0.24)] transition hover:bg-[#1d463b]"
                  >
                    Open Booking Page
                  </Link>
                )}
              </div>

              <div className="rounded-[24px] border border-[#e2e8e3] bg-[linear-gradient(180deg,rgba(252,253,252,0.98),rgba(247,250,247,0.96))] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Affecting Bookings
                  </p>
                  <span className="rounded-full bg-[#f3f7f4] px-3 py-1 text-xs font-semibold text-[#235347]">
                    {selectedDateBookings.length} record{selectedDateBookings.length === 1 ? "" : "s"}
                  </span>
                </div>

                {selectedDateBookings.length === 0 ? (
                  <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-[#fafbfa] px-4 py-6 text-sm text-slate-600">
                    No active bookings affect this date.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {selectedDateBookings.map((booking) => (
                      <article key={booking.id} className="rounded-[18px] border border-[#e2e8e3] bg-white/95 p-3.5">
                        <p className="text-sm font-semibold text-slate-900">{booking.booking_code}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {booking.start_date} to {booking.end_date}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#f4f7f5] px-3 py-1 text-xs font-semibold text-slate-700">
                            {booking.contact_name}
                          </span>
                          <span className="rounded-full bg-[#f4f7f5] px-3 py-1 text-xs font-semibold text-slate-700">
                            {booking.booking_type}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function CalendarPage() {
  const { user, loading: loadingUser } = useAuth();
  const normalizedRole = String(user?.role || "").trim().toLowerCase();
  const canCreateBookings = normalizedRole === "admin" || normalizedRole === "co_admin";
  const [month, setMonth] = useState(getCurrentMonth());
  const [selectedDate, setSelectedDate] = useState(firstDateOfMonth(getCurrentMonth()));
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<
    ParticipantCategoryOption | typeof ALL_CATEGORIES
  >(ALL_CATEGORIES);
  const [data, setData] = useState<CalendarApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedDate(firstDateOfMonth(month));
  }, [month]);

  function openDayModal(date: string) {
    setSelectedDate(date);
    setIsDayModalOpen(true);
  }

  function closeDayModal() {
    setIsDayModalOpen(false);
  }

  useEffect(() => {
    if (loadingUser || !user) return;

    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          month,
          category: categoryFilter,
        });
        const res = await fetch(`/api/bookings/calendar?${params.toString()}`, {
          cache: "no-store",
          credentials: "include",
        });

        const json = (await res.json().catch(() => null)) as
          | CalendarApiResponse
          | { error?: string }
          | null;

        if (!active) return;

        if (!res.ok) {
          setData(null);
          setError(
            json && "error" in json
              ? json.error || "Failed to load calendar."
              : "Failed to load calendar."
          );
          return;
        }

        setData(json as CalendarApiResponse);
      } catch {
        if (!active) return;
        setData(null);
        setError("Failed to load calendar.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [categoryFilter, loadingUser, month, user]);

  useEffect(() => {
    if (!isDayModalOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDayModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDayModalOpen]);

  const selectedDay = useMemo(
    () => data?.days.find((day) => day.date === selectedDate) || null,
    [data, selectedDate]
  );

  const selectedDateBookings = useMemo(() => {
    return (data?.bookings || []).filter(
      (booking) => selectedDate >= booking.start_date && selectedDate <= booking.end_date
    );
  }, [data, selectedDate]);

  const leadingBlankDays = useMemo(() => {
    if (!data?.days?.length) return 0;
    return getWeekdayIndex(data.days[0].date);
  }, [data]);

  const calendarSlots = useMemo(
    () => [...Array.from({ length: leadingBlankDays }, () => null), ...(data?.days || [])],
    [data, leadingBlankDays]
  );

  const selectedClosed = selectedDateBookings.some(
    (booking) => booking.booking_type === "Off Season" || booking.booking_type === "Block Schedule"
  );
  const selectedSanFull = selectedDay?.sanState === "full";
  const selectedGovFull = selectedDay?.govState === "full";
  const selectedSanLimited = selectedDay?.sanState === "limited";
  const selectedGovLimited = selectedDay?.govState === "limited";
  const selectedLinkedFullWarning =
    (selectedSanFull && (selectedDay?.sanIsidro || 0) === 0) ||
    (selectedGovFull && (selectedDay?.governorGeneroso || 0) === 0);
  const selectedLinkedLimitedWarning =
    (selectedSanLimited && (selectedDay?.sanIsidro || 0) === 0) ||
    (selectedGovLimited && (selectedDay?.governorGeneroso || 0) === 0);
  const selectedCamp4Advised = selectedDateBookings.some((booking) => {
    const secondDay = formatDateOnly(addDays(new Date(`${booking.start_date}T00:00:00.000Z`), 1));
    if (secondDay !== selectedDate) return false;
    const startDay = data?.days.find((day) => day.date === booking.start_date);
    if (!startDay) return false;
    const startTrailState =
      booking.trail === "San Isidro Trail" ? startDay.sanState : startDay.govState;
    return startTrailState === "full" || startTrailState === "limited";
  });

  const selectedNote = selectedClosed
    ? "This date is closed due to an Off Season or Block Schedule entry."
    : selectedDateBookings.some((booking) => booking.booking_type === "Block Schedule")
      ? "A block schedule affects at least one trail on this date."
      : selectedDateBookings.some((booking) => booking.booking_type === "Special Climb")
        ? "This date includes a special climb booking."
        : "No special schedule note is recorded for this date.";

  const selectedCapacityNote =
    selectedLinkedFullWarning
      ? "Camp 3 reached full capacity from the linked deployment schedule."
      : selectedLinkedLimitedWarning
        ? "Camp 3 has limited remaining capacity from the linked deployment schedule."
        : selectedSanFull || selectedGovFull || selectedSanLimited || selectedGovLimited
        ? "This date has high occupancy or one or more full exact schedules. Other trail and 2-3 day schedule combinations may still be available."
      : "";

  const todayMonth = getCurrentMonth();
  const todayDate = getCurrentDate();

  return (
    <section className="min-h-full bg-[radial-gradient(circle_at_top,rgba(223,236,227,0.72),transparent_34%),linear-gradient(180deg,#f4f7f5_0%,#eef4f0_100%)] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[34px] border border-[#e2e9e3] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,248,0.96))] p-5 shadow-[0_18px_44px_rgba(15,23,42,0.07)] md:p-7">
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5c7b67]">
              Mount Hamiguitan Schedule
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900 md:text-5xl">
              Calendar
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              Explore trail availability by date, review live occupancy for each route, and
              move directly into booking when a schedule remains open.
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-6 rounded-[28px] border border-[#e2e9e3] bg-[linear-gradient(180deg,rgba(250,252,251,0.98),rgba(245,248,245,0.96))] p-4 md:p-5">
            <div className="flex flex-col gap-3.5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Travel Month
                </p>
                <h2 className="mt-1.5 text-[1.9rem] font-semibold tracking-[-0.05em] text-slate-900">
                  {formatMonthLabel(month)}
                </h2>
              </div>

              <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-end lg:gap-3">
                <label className="w-full lg:min-w-[220px]">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Category
                  </span>
                  <select
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(
                        event.target.value as ParticipantCategoryOption | typeof ALL_CATEGORIES
                      )
                    }
                    className="min-h-11 w-full rounded-2xl border border-[#d9e4dd] bg-white/95 px-4 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition focus:border-[#235347] focus:ring-4 focus:ring-[#235347]/10"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-3 gap-2.5 lg:flex lg:flex-nowrap lg:items-center lg:justify-end">
                  <button
                    type="button"
                    onClick={() => setMonth((current) => shiftMonth(current, -1))}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#d9e4dd] bg-white/95 px-4 text-sm font-semibold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:border-[#bfd0c5] hover:bg-[#f7faf7] lg:w-auto"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMonth(todayMonth);
                      setSelectedDate(todayDate);
                    }}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#cfe0d6] bg-[linear-gradient(180deg,#eef6f0,#e7f1ea)] px-4 text-sm font-semibold text-[#235347] shadow-[0_10px_22px_rgba(35,83,71,0.08)] transition hover:bg-[#e8f0eb] lg:w-auto"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonth((current) => shiftMonth(current, 1))}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#d9e4dd] bg-white/95 px-4 text-sm font-semibold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:border-[#bfd0c5] hover:bg-[#f7faf7] lg:w-auto"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <section className="min-w-[720px] rounded-[26px] border border-[#e2e8e3] bg-[linear-gradient(180deg,rgba(252,253,252,0.99),rgba(246,249,246,0.97))] p-3 sm:p-4 md:p-5">
              <div className="grid grid-cols-7 border-y border-slate-200/80 text-center">
                {WEEKDAY_LABELS.map((day) => (
                  <div
                    key={day}
                    className="border-r border-slate-200/80 bg-[#fbfcfb] px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="mt-5 rounded-[24px] border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-600">
                  Loading calendar board...
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-7 border-l border-t border-slate-200/80">
                  {calendarSlots.map((entry, index) =>
                    entry ? (
                      <CalendarDayButton
                        key={entry.date}
                        day={entry}
                        selected={entry.date === selectedDate}
                        onSelect={openDayModal}
                      />
                    ) : (
                      <div
                        key={`blank-${index}`}
                        className="min-h-[96px] border-b border-r border-slate-200/90 bg-[#fbfcfb]"
                      />
                    )
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <DayDetailsModal
        open={isDayModalOpen}
        onClose={closeDayModal}
        selectedDate={selectedDate}
        selectedNote={selectedNote}
        selectedCapacityNote={selectedCapacityNote}
        selectedDay={selectedDay}
        selectedDateBookings={selectedDateBookings}
        selectedClosed={selectedClosed}
        canCreateBookings={canCreateBookings}
        selectedCamp4Advised={selectedCamp4Advised}
      />
    </section>
  );
}
  const categoryOptions = [ALL_CATEGORIES, ...PARTICIPANT_CATEGORY_OPTIONS];
