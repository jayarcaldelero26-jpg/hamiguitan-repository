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
}) {
  const approval = String(booking.approval_status || "").trim().toLowerCase();
  const status = String(booking.booking_status || "").trim().toLowerCase();

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
