import type { BookingRow, TrailOption } from "@/app/lib/bookingTypes";

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseDateOnly(value: string) {
  if (!isDateOnly(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function getTodayDateOnlyUtc(now = new Date()) {
  return formatDateOnly(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  );
}

export function getEffectiveBookingStatus<T extends {
  booking_type?: string | null;
  booking_status?: string | null;
  end_date?: string | null;
}>(booking: T, now = new Date()) {
  const bookingType = String(booking.booking_type || "").trim();
  const bookingStatus = String(booking.booking_status || "").trim();
  const endDate = String(booking.end_date || "").trim();

  if (
    bookingType !== "Regular Booking" &&
    bookingType !== "Special Climb"
  ) {
    return bookingStatus;
  }

  if (bookingStatus.toLowerCase() === "cancelled") {
    return bookingStatus;
  }

  const parsedEndDate = parseDateOnly(endDate);
  if (!parsedEndDate) {
    return bookingStatus;
  }

  return getTodayDateOnlyUtc(now) > endDate ? "Completed" : bookingStatus;
}

export function expandDateRange(startDate: string, endDate: string) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (!start || !end || start > end) {
    return [];
  }

  const days: string[] = [];
  let current = start;

  while (current <= end) {
    days.push(formatDateOnly(current));
    current = addDays(current, 1);
  }

  return days;
}

export function bookingCountsTowardCapacity(booking: {
  approval_status?: string | null;
  booking_status?: string | null;
  booking_type?: string | null;
  end_date?: string | null;
}) {
  const approval = String(booking.approval_status || "").trim().toLowerCase();
  const status = getEffectiveBookingStatus(booking).trim().toLowerCase();

  if (approval === "rejected") return false;
  if (status === "cancelled") return false;
  return true;
}

export function formatMonthLabel(month: string) {
  const date = parseDateOnly(`${month}-01`);
  if (!date) return month;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDisplayDate(date: string) {
  const parsed = parseDateOnly(date);
  if (!parsed) return date;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function normalizeGuestName(name: string) {
  return String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function isClosureLikeBookingType(bookingType?: string | null) {
  const normalizedBookingType = String(bookingType || "").trim().toLowerCase();
  return normalizedBookingType === "off season" || normalizedBookingType === "block schedule";
}

function isSpecialScheduleBookingType(bookingType?: string | null) {
  return String(bookingType || "").trim().toLowerCase() === "special climb";
}

function isCancelledBookingStatus(bookingStatus?: string | null) {
  return String(bookingStatus || "").trim().toLowerCase() === "cancelled";
}

function isRescheduledBookingStatus(bookingStatus?: string | null) {
  return String(bookingStatus || "").trim().toLowerCase() === "rescheduled";
}

export type SameYearDuplicateBookingMatch = {
  hasDuplicate: boolean;
  matches: BookingRow[];
  highlightedRowIds: number[];
  previousBooking: BookingRow | null;
  previousBookingDateText: string;
};

export function findSameYearDuplicateBookings({
  guestName,
  category,
  startDate,
  bookings,
  currentBookingId,
}: {
  guestName: string;
  category: string;
  startDate: string;
  bookings: BookingRow[];
  currentBookingId?: number | null;
}): SameYearDuplicateBookingMatch {
  if (String(category || "").trim() !== "DIY") {
    return {
      hasDuplicate: false,
      matches: [],
      highlightedRowIds: [],
      previousBooking: null,
      previousBookingDateText: "",
    };
  }

  const normalizedName = normalizeGuestName(guestName);
  const selectedYear = String(startDate || "").slice(0, 4);

  if (!normalizedName || selectedYear.length !== 4 || bookings.length === 0) {
    return {
      hasDuplicate: false,
      matches: [],
      highlightedRowIds: [],
      previousBooking: null,
      previousBookingDateText: "",
    };
  }

  const matches = bookings
    .filter((booking) => booking.id !== currentBookingId)
    .filter((booking) => String(booking.start_date || "").slice(0, 4) === selectedYear)
    .filter(
      (booking) => normalizeGuestName(String(booking.contact_name || "")) === normalizedName
    )
    .filter((booking) => !isRescheduledBookingStatus(booking.booking_status))
    .filter((booking) => !isCancelledBookingStatus(booking.booking_status))
    .filter((booking) => !isClosureLikeBookingType(booking.booking_type))
    .filter((booking) => !isSpecialScheduleBookingType(booking.booking_type))
    .sort((left, right) => {
      const dateCompare = left.start_date.localeCompare(right.start_date);
      if (dateCompare !== 0) return dateCompare;
      return left.id - right.id;
    });

  const previousBooking = matches[0] || null;

  return {
    hasDuplicate: matches.length > 0,
    matches,
    highlightedRowIds: matches.map((booking) => booking.id),
    previousBooking,
    previousBookingDateText: previousBooking ? formatDisplayDate(previousBooking.start_date) : "",
  };
}

export type MonthlyBookingStats = {
  monthlyTotals: number[];
  categoryTotals: Record<string, number[]>;
  totalPax: number;
};

export function getMonthlyStats(bookings: BookingRow[], year: number): MonthlyBookingStats {
  const monthlyTotals = Array.from({ length: 12 }, () => 0);
  const categoryTotals: Record<string, number[]> = {};
  let totalPax = 0;

  for (const booking of bookings) {
    const startDate = String(booking.start_date || "");
    const bookingYear = Number(startDate.slice(0, 4));
    const bookingMonth = Number(startDate.slice(5, 7)) - 1;

    if (!Number.isInteger(bookingYear) || bookingYear !== year) continue;
    if (!Number.isInteger(bookingMonth) || bookingMonth < 0 || bookingMonth > 11) continue;
    if (isCancelledBookingStatus(booking.booking_status)) continue;
    if (isClosureLikeBookingType(booking.booking_type)) continue;
    if (isSpecialScheduleBookingType(booking.booking_type)) continue;

    const category = String(booking.participant_category || "").trim() || "Uncategorized";
    const pax = Number.isFinite(booking.pax) ? booking.pax : 0;

    monthlyTotals[bookingMonth] += pax;
    totalPax += pax;

    if (!categoryTotals[category]) {
      categoryTotals[category] = Array.from({ length: 12 }, () => 0);
    }

    categoryTotals[category][bookingMonth] += pax;
  }

  return {
    monthlyTotals,
    categoryTotals,
    totalPax,
  };
}

export function shiftMonth(month: string, offset: number) {
  const parsed = parseDateOnly(`${month}-01`);
  if (!parsed) return month;
  const shifted = new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + offset, 1)
  );
  return formatDateOnly(shifted).slice(0, 7);
}

export function firstDateOfMonth(month: string) {
  return `${month}-01`;
}

export function computeTrailDayOccupancy(bookings: BookingRow[]) {
  const occupancy = new Map<
    string,
    {
      "San Isidro Trail": number;
      "Governor Generoso Trail": number;
    }
  >();

  for (const booking of bookings.filter(bookingCountsTowardCapacity)) {
    for (const day of expandDateRange(booking.start_date, booking.end_date)) {
      const entry = occupancy.get(day) || {
        "San Isidro Trail": 0,
        "Governor Generoso Trail": 0,
      };
      entry[booking.trail] += booking.pax;
      occupancy.set(day, entry);
    }
  }

  return occupancy;
}

export function trailPillTone(trail: TrailOption) {
  return trail === "San Isidro Trail"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-700";
}
