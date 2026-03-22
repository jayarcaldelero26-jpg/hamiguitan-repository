"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { useProtectedTheme } from "@/app/components/ProtectedThemeProvider";
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
  getEffectiveBookingStatus,
  shiftMonth,
} from "@/app/lib/bookingUtils";
import { createTiltCardMotion, useModalMotion } from "@/app/lib/modalMotion";
import { repoTheme } from "@/app/lib/repoTheme";

const ALL_CATEGORIES = "All Categories" as const;
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const categoryOptions = [ALL_CATEGORIES, ...PARTICIPANT_CATEGORY_OPTIONS];

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

function getBookingStatusAppearance(booking: SelectedDateBooking) {
  const status = getEffectiveBookingStatus(booking);

  if (status === "Completed") {
    return {
      status,
      cardClassName:
        "border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(241,245,249,0.9))] opacity-90",
      badgeClassName:
        "border-slate-200 bg-slate-100 text-slate-600",
    };
  }

  if (status === "Active") {
    return {
      status,
      cardClassName:
        "border-emerald-200/85 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(255,255,255,0.96))]",
      badgeClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "Rescheduled") {
    return {
      status,
      cardClassName:
        "border-amber-200/85 bg-[linear-gradient(180deg,rgba(255,251,235,0.95),rgba(255,255,255,0.96))]",
      badgeClassName:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (status === "Cancelled") {
    return {
      status,
      cardClassName:
        "border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(241,245,249,0.9))] opacity-80",
      badgeClassName:
        "border-slate-200 bg-slate-100 text-slate-500",
    };
  }

  return {
    status,
    cardClassName:
      "border-[color:var(--ui-panel-border)] [background:var(--ui-panel-soft-bg)]",
    badgeClassName:
      "border-slate-200 bg-slate-100 text-slate-700",
  };
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
  todayDate,
}: {
  day: CalendarDayData;
  selected: boolean;
  onSelect: (date: string) => void;
  todayDate: string;
}) {
  const { theme } = useProtectedTheme();
  const prefersReducedMotion = useReducedMotion();
  const ui = repoTheme(theme);
  const dark = theme === "dark";
  const state = getOverallState(day);
  const isToday = day.date === todayDate;
  const sanFull = day.sanState === "full";
  const govFull = day.govState === "full";

  const dotTone: Record<string, string> = {
    available: "bg-emerald-500",
    limited: "bg-amber-400",
    full: "bg-rose-500",
    blocked: "bg-slate-400",
  };

  const baseCardTone = `${ui.panelSoft} ${ui.textMain}`;
  const selectedTone = dark
    ? "border-[#395C7A]/55 bg-[#22313c]"
    : "border-[#395C7A]/32 bg-[#eef4fa]";
  const stateBorderTone =
    state === "limited"
      ? dark
        ? "border-amber-400/20"
        : "border-amber-200"
      : state === "full"
        ? dark
          ? "border-rose-400/20"
          : "border-rose-200"
        : state === "blocked"
          ? dark
            ? "border-white/12"
            : "border-slate-300"
          : "";
  const hoverTone = dark
    ? "hover:-translate-y-0.5 hover:border-[#547696]/42 hover:shadow-[0_14px_28px_rgba(0,0,0,0.2)]"
    : "hover:-translate-y-0.5 hover:scale-[1.01] hover:border-[#395C7A]/34 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]";
  const cellTone = `border ${baseCardTone} ${selected ? selectedTone : stateBorderTone} ${selected ? "" : hoverTone}`;
  const labelTone = dark
    ? sanFull || govFull
      ? "text-rose-300"
      : "text-white/60"
    : sanFull || govFull
      ? "text-rose-700"
      : "text-gray-500";
  const valueTone = dark
    ? "text-white"
    : "text-gray-800";
  const quotaTone = dark
    ? "text-white/60"
    : "text-gray-500";
  const todayBadgeTone = dark
    ? "border-white/10 bg-white/5 text-white/70"
    : "border-gray-200 bg-gray-50 text-gray-600";

  const { hoverMotion, tapMotion, transition: motionTransition, style: motionStyle } = useMemo(
    () =>
      createTiltCardMotion(prefersReducedMotion ?? false, {
        hoverY: -3,
        hoverScale: 1.012,
        hoverRotateX: 5,
        hoverRotateY: -5,
        tapScale: 0.985,
        tapRotateX: -4,
        tapRotateY: 4,
        reducedHoverY: -2,
        reducedHoverScale: 1.01,
        reducedTapScale: 0.985,
        perspective: 1100,
      }),
    [prefersReducedMotion]
  );

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(day.date)}
      whileHover={selected ? undefined : hoverMotion}
      whileTap={tapMotion}
      transition={motionTransition}
      title="Select date"
      style={motionStyle}
      className={`app-clickable-card group relative min-h-[98px] rounded-xl px-3.5 py-3 text-left transition-[transform,border-color,box-shadow,background-color] duration-200 ease-out ${cellTone}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`mt-1 inline-flex h-2 w-2 rounded-full ${dotTone[state] ?? "bg-slate-300"}`}
          aria-hidden="true"
        />
        <div className="flex items-center gap-2">
          {isToday && (
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${todayBadgeTone}`}>
              Today
            </span>
          )}
          <span className={`text-[24px] font-semibold tracking-[-0.06em] ${ui.textMain}`}>
            {formatDayNumber(day.date)}
          </span>
        </div>
      </div>

      <div className="mt-2.5 space-y-1">
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className={`font-medium uppercase tracking-[0.08em] ${sanFull ? (dark ? "text-rose-300" : "text-rose-700") : labelTone}`}>
            San Isidro
          </span>
          <span className={`font-semibold tracking-[-0.03em] ${sanFull ? (dark ? "text-rose-200" : "text-rose-800") : valueTone}`}>
            {day.sanIsidro}
            <span className={`ml-0.5 ${quotaTone}`}>/30</span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className={`font-medium uppercase tracking-[0.08em] ${govFull ? (dark ? "text-rose-300" : "text-rose-700") : labelTone}`}>
            Gov. Generoso
          </span>
          <span className={`font-semibold tracking-[-0.03em] ${govFull ? (dark ? "text-rose-200" : "text-rose-800") : valueTone}`}>
            {day.governorGeneroso}
            <span className={`ml-0.5 ${quotaTone}`}>/30</span>
          </span>
        </div>
      </div>

      <span className="app-interactive-tooltip hidden rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] md:inline-flex">
        Select date
      </span>
    </motion.button>
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
  shellClassName,
  textMainClassName,
  textMutedClassName,
  textSoftClassName,
  closeButtonClassName,
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
  shellClassName: string;
  textMainClassName: string;
  textMutedClassName: string;
  textSoftClassName: string;
  closeButtonClassName: string;
}) {
  const { overlayMotion, panelMotion } = useModalMotion();
  const modalPanelClassName = "app-solid-surface rounded-[24px]";
  const modalPanelSoftClassName = "app-soft-surface rounded-[18px]";
  return (
    <AnimatePresence mode="wait">
      {open && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center p-3 sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close day details"
            initial={overlayMotion.initial}
            animate={overlayMotion.animate}
            exit={overlayMotion.exit}
            transition={overlayMotion.transition}
            className="app-overlay absolute inset-0"
            onClick={onClose}
          />

          <motion.div
            initial={panelMotion.initial}
            animate={panelMotion.animate}
            exit={panelMotion.exit}
            transition={panelMotion.transition}
            className={`app-dialog-surface relative z-[121] flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden sm:max-h-[calc(100vh-3rem)] ${shellClassName}`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--ui-border)] px-5 py-5 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-accent-soft)]">
                  Selected Date
                </p>
                <h2 className={`mt-2 text-[1.95rem] font-semibold tracking-[-0.05em] ${textMainClassName}`}>
                  {formatDisplayDate(selectedDate)}
                </h2>
                <p className={`mt-2.5 max-w-2xl text-sm leading-6 ${textMutedClassName}`}>{selectedNote}</p>
                {selectedCapacityNote && (
                  <p className={`mt-2 text-sm font-medium ${textSoftClassName}`}>{selectedCapacityNote}</p>
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
                className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl transition ${closeButtonClassName}`}
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
                    className="app-glass-button app-protected-action-button app-sidebar-btn app-sidebar-btn-primary inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition"
                  >
                    Open Booking Page
                  </Link>
                )}
              </div>

              <div className={`${modalPanelClassName} p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${textSoftClassName}`}>
                    Affecting Bookings
                  </p>
                  <span className="app-soft-surface rounded-full px-3 py-1 text-xs font-semibold">
                    {selectedDateBookings.length} record{selectedDateBookings.length === 1 ? "" : "s"}
                  </span>
                </div>

                {selectedDateBookings.length === 0 ? (
                  <div className={`mt-4 rounded-[18px] border border-dashed border-[color:var(--ui-panel-border)] [background:var(--ui-panel-soft-bg)] px-4 py-6 text-sm ${textMutedClassName}`}>
                    No active bookings affect this date.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {selectedDateBookings.map((booking) => {
                      const bookingStatusAppearance = getBookingStatusAppearance(booking);

                      return (
                      <article
                        key={booking.id}
                        className={`${modalPanelSoftClassName} border ${bookingStatusAppearance.cardClassName} p-3.5`}
                      >
                        <p className={`text-sm font-semibold ${textMainClassName}`}>{booking.booking_code}</p>
                        <p className={`mt-1 text-xs ${textSoftClassName}`}>
                          {booking.start_date} to {booking.end_date}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="app-soft-surface rounded-full px-3 py-1 text-xs font-semibold text-[var(--ui-text-main)]">
                            {booking.contact_name}
                          </span>
                          <span className="app-soft-surface rounded-full px-3 py-1 text-xs font-semibold text-[var(--ui-text-main)]">
                            {booking.booking_type}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${bookingStatusAppearance.badgeClassName}`}>
                            {bookingStatusAppearance.status}
                          </span>
                        </div>
                      </article>
                    );})}
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
  const { theme } = useProtectedTheme();
  const prefersReducedMotion = useReducedMotion();
  const ui = repoTheme(theme);
  const dark = theme === "dark";
  const sectionShellClassName = ui.sectionShell;
  const cleanBoardShellClassName = `${ui.shell} rounded-[26px] p-3 sm:p-4 md:p-5 shadow-none`;
  const controlFieldClassName = `app-clickable app-input-surface min-h-11 w-full rounded-2xl px-4 text-sm font-medium ${ui.textMain} outline-none transition focus:border-[#235347] focus:ring-4 focus:ring-[#235347]/10`;
  const controlButtonClassName = `app-clickable inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-semibold transition lg:w-auto ${ui.buttonSecondary}`;
  const boardHeaderCellClassName = dark
    ? "px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:rgba(151,166,168,0.88)]"
    : "px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:rgba(75,85,99,0.68)]";
  const blankCellClassName = "app-soft-surface min-h-[96px] opacity-70";
  const {
    hoverMotion: cardHoverMotion,
    tapMotion: cardTapMotion,
    transition: cardMotionTransition,
    style: cardMotionStyle,
  } = useMemo(
    () =>
      createTiltCardMotion(prefersReducedMotion ?? false, {
        hoverY: -3,
        hoverScale: 1.012,
        hoverRotateX: 5,
        hoverRotateY: -5,
        tapScale: 0.985,
        tapRotateX: -4,
        tapRotateY: 4,
        reducedHoverY: -2,
        reducedHoverScale: 1.01,
        reducedTapScale: 0.985,
        perspective: 1100,
      }),
    [prefersReducedMotion]
  );
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
  const todayDate = getCurrentDate();
  const todayMonth = getCurrentMonth();

  useEffect(() => {
    setSelectedDate(firstDateOfMonth(month));
  }, [month]);

  const openDayModal = useCallback((date: string) => {
    setSelectedDate(date);
    setIsDayModalOpen(true);
  }, []);

  const closeDayModal = useCallback(() => {
    setIsDayModalOpen(false);
  }, []);

  useEffect(() => {
    if (loadingUser || !user) return;

    const controller = new AbortController();

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
          signal: controller.signal,
        });

        const json = (await res.json().catch(() => null)) as
          | CalendarApiResponse
          | { error?: string }
          | null;

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
        if (controller.signal.aborted) return;
        setData(null);
        setError("Failed to load calendar.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [categoryFilter, loadingUser, month, user]);

  useEffect(() => {
    if (!isDayModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDayModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
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

  return (
    <section className={`min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8 ${ui.page}`}>
      <div className="mx-auto max-w-7xl">
        <div className={`${ui.card} rounded-[34px] p-5 md:p-7`}>
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--ui-accent-soft)]">
              Mount Hamiguitan Schedule
            </p>
            <h1 className={`mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-5xl ${ui.textMain}`}>
              Calendar
            </h1>
            <p className={`mt-3 max-w-3xl text-sm leading-7 md:text-base ${ui.textMuted}`}>
              Explore trail availability by date, review live occupancy for each route, and
              move directly into booking when a schedule remains open.
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className={`mt-6 p-4 md:p-5 ${sectionShellClassName}`}>
            <div className="flex flex-col gap-3.5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${ui.textSoft}`}>
                  Travel Month
                </p>
                <h2 className={`mt-1.5 text-[1.9rem] font-semibold tracking-[-0.05em] ${ui.textMain}`}>
                  {formatMonthLabel(month)}
                </h2>
              </div>

              <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-end lg:gap-3">
                <label className="w-full lg:min-w-[220px]">
                  <span className={`mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] ${ui.textSoft}`}>
                    Category
                  </span>
                  <select
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(
                        event.target.value as ParticipantCategoryOption | typeof ALL_CATEGORIES
                      )
                    }
                    className={controlFieldClassName}
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
                    className={controlButtonClassName}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMonth(todayMonth);
                      setSelectedDate(todayDate);
                    }}
                    className="app-clickable app-primary-button app-sidebar-btn app-sidebar-btn-primary inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-semibold lg:w-auto"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonth((current) => shiftMonth(current, 1))}
                    className={controlButtonClassName}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 md:hidden">
            {loading ? (
              <div className={`app-soft-surface rounded-[24px] px-5 py-12 text-center text-sm ${ui.textMuted}`}>
                Loading calendar board...
              </div>
            ) : (
              <div className="grid gap-3">
                {(data?.days || []).map((day) => {
                  const state = getOverallState(day);
                  const stateLabel = formatDayStateLabel(day.sanState === "blocked" || day.govState === "blocked" ? "blocked" : state === "full" ? "full" : state === "limited" ? "limited" : "available");
                  const stateTone =
                    state === "full"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : state === "limited"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : state === "blocked"
                          ? "border-slate-200 bg-slate-100 text-slate-600"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700";

                  return (
                    <motion.button
                      key={day.date}
                      type="button"
                      onClick={() => openDayModal(day.date)}
                      whileHover={day.date === selectedDate ? undefined : cardHoverMotion}
                      whileTap={cardTapMotion}
                      transition={cardMotionTransition}
                      title="Select date"
                      style={cardMotionStyle}
                      className={`app-clickable-card group rounded-[22px] border p-4 text-left transition-[transform,border-color,box-shadow,background-color] duration-200 ease-out ${
                        day.date === selectedDate
                          ? dark
                            ? "border-[#395C7A]/50 bg-[#22313c]"
                            : "border-[#395C7A]/25 bg-[#F8FAFC]"
                          : dark
                            ? "border-white/10 bg-[var(--app-surface-soft-bg)] hover:-translate-y-0.5 hover:border-[#547696]/42 hover:shadow-[0_14px_28px_rgba(0,0,0,0.2)]"
                            : "border-[var(--app-surface-border)] bg-[var(--app-surface-bg)] hover:-translate-y-0.5 hover:scale-[1.01] hover:border-[#395C7A]/28 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>
                            {formatDisplayDate(day.date)}
                          </p>
                          <p className={`mt-2 text-3xl font-semibold tracking-[-0.05em] ${ui.textMain}`}>
                            {formatDayNumber(day.date)}
                          </p>
                        </div>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${stateTone}`}>
                          {stateLabel}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2.5">
                        <div className="app-soft-surface rounded-[18px] p-3">
                          <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${ui.textSoft}`}>
                            San Isidro
                          </p>
                          <p className={`mt-1.5 text-base font-semibold ${ui.textMain}`}>
                            {day.sanIsidro} <span className={ui.textMuted}>/ 30</span>
                          </p>
                        </div>
                        <div className="app-soft-surface rounded-[18px] p-3">
                          <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${ui.textSoft}`}>
                            Gov. Generoso
                          </p>
                          <p className={`mt-1.5 text-base font-semibold ${ui.textMain}`}>
                            {day.governorGeneroso} <span className={ui.textMuted}>/ 30</span>
                          </p>
                        </div>
                      </div>
                      <span className="app-interactive-tooltip hidden rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] sm:inline-flex">
                        Select date
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 hidden overflow-x-auto md:block">
            <section className={`min-w-[720px] ${cleanBoardShellClassName}`}>
              <div className="grid grid-cols-7 text-center">
                {WEEKDAY_LABELS.map((day) => (
                  <div key={day} className={boardHeaderCellClassName}>
                    {day}
                  </div>
                ))}
              </div>

              {loading ? (
                <div className={`app-soft-surface mt-5 rounded-[24px] px-5 py-12 text-center text-sm ${ui.textMuted}`}>
                  Loading calendar board...
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-7 gap-2">
                  {calendarSlots.map((entry, index) =>
                    entry ? (
                      <CalendarDayButton
                        key={entry.date}
                        day={entry}
                        selected={entry.date === selectedDate}
                        onSelect={openDayModal}
                        todayDate={todayDate}
                      />
                    ) : (
                      <div key={`blank-${index}`} className={blankCellClassName} />
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
        shellClassName={sectionShellClassName}
        textMainClassName={ui.textMain}
        textMutedClassName={ui.textMuted}
        textSoftClassName={ui.textSoft}
        closeButtonClassName={ui.buttonSecondary}
      />
    </section>
  );
}
