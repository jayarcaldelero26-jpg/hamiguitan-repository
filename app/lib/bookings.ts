import "server-only";

import { supabaseAdmin } from "@/app/lib/db";
import {
  addDays,
  bookingCountsTowardCapacity,
  expandDateRange,
  formatDateOnly,
  parseDateOnly,
} from "@/app/lib/bookingUtils";
import type {
  BookingFormPayload,
  BookingRow,
  BookingWritePayload,
  CalendarDayData,
  ParticipantCategoryOption,
  SelectedDateBooking,
  TrailOption,
} from "@/app/lib/bookingTypes";
import {
  APPROVAL_STATUS_OPTIONS,
  BOOKING_STATUS_OPTIONS,
  BOOKING_TYPE_OPTIONS,
  PARTICIPANT_CATEGORY_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  TRAIL_OPTIONS,
} from "@/app/lib/bookingTypes";

const BOOKINGS_TABLE = "bookings";

function wrapBookingsError(error: { code?: string; message?: string } | null, fallback: string) {
  if (error?.code === "PGRST205") {
    return new Error(
      "Bookings table is missing in Supabase. Apply supabase/migrations/20260317_create_bookings.sql and retry."
    );
  }

  return new Error(error?.message || fallback);
}

function validateEnum<T extends readonly string[]>(value: string, allowed: T) {
  return allowed.includes(value as T[number]);
}

function isOffSeasonLikeType(bookingType: string) {
  return bookingType === "Off Season" || bookingType === "Block Schedule";
}

function getScheduleGroupKey(start_date: string, end_date: string) {
  return `${start_date}__${end_date}`;
}

type ValidationResult =
  | { ok: true; payload: BookingFormPayload }
  | { ok: false; error: string };

export type OffSeasonConflict = Pick<
  BookingRow,
  "id" | "booking_code" | "start_date" | "end_date" | "contact_name"
>;

export function validateBookingPayload(raw: unknown): ValidationResult {
  const body = (raw || {}) as Record<string, unknown>;

  const contact_name = String(body.contact_name || "").trim();
  const contact_number = String(body.contact_number || "").trim();
  const emailRaw = String(body.email || "").trim();
  const organizationRaw = String(body.organization_name || "").trim();
  const booking_type = String(body.booking_type || "").trim();
  const participant_category = String(body.participant_category || "").trim();
  const start_date = String(body.start_date || "").trim();
  const end_date = String(body.end_date || "").trim();
  const trail = String(body.trail || "").trim();
  const pax = Number(body.pax);
  const payment_status = String(body.payment_status || "").trim();
  const approval_status = String(body.approval_status || "").trim();
  const booking_status = String(body.booking_status || "").trim();
  const remarks = String(body.remarks || "").trim();
  const internalNotesRaw = String(body.internal_notes || "").trim();
  const rescheduledFromRaw = String(body.rescheduled_from || "").trim();
  const cancelReasonRaw = String(body.cancel_reason || "").trim();

  if (!contact_name) return { ok: false, error: "Guest Name is required." };
  if (!validateEnum(booking_type, BOOKING_TYPE_OPTIONS)) {
    return { ok: false, error: "Invalid Booking Type." };
  }
  if (!validateEnum(participant_category, PARTICIPANT_CATEGORY_OPTIONS)) {
    return { ok: false, error: "Invalid Participant Category." };
  }
  if (!validateEnum(trail, TRAIL_OPTIONS)) {
    return { ok: false, error: "Invalid Trail." };
  }
  if (!validateEnum(payment_status, PAYMENT_STATUS_OPTIONS)) {
    return { ok: false, error: "Invalid Payment Status." };
  }
  if (!validateEnum(approval_status, APPROVAL_STATUS_OPTIONS)) {
    return { ok: false, error: "Invalid Approval Status." };
  }
  if (!validateEnum(booking_status, BOOKING_STATUS_OPTIONS)) {
    return { ok: false, error: "Invalid Booking Status." };
  }

  const start = parseDateOnly(start_date);
  const end = parseDateOnly(end_date);
  if (!start) return { ok: false, error: "Invalid Start Date." };
  if (!end) return { ok: false, error: "Invalid End Date." };
  if (start > end) {
    return { ok: false, error: "End Date must be on or after Start Date." };
  }
  const durationDays = expandDateRange(start_date, end_date).length;
  if (!isOffSeasonLikeType(booking_type) && (durationDays < 2 || durationDays > 3)) {
    return { ok: false, error: "Hike duration must be between 2 and 3 days." };
  }
  if (!Number.isFinite(pax) || pax <= 0 || pax > 30) {
    return { ok: false, error: "No. of Pax must be between 1 and 30." };
  }
  return {
    ok: true,
    payload: {
      contact_name,
      contact_number,
      email: emailRaw || null,
      organization_name: organizationRaw || null,
      booking_type: booking_type as BookingFormPayload["booking_type"],
      participant_category: participant_category as BookingFormPayload["participant_category"],
      start_date,
      end_date,
      trail: trail as TrailOption,
      pax,
      payment_status: payment_status as BookingFormPayload["payment_status"],
      approval_status: approval_status as BookingFormPayload["approval_status"],
      booking_status: booking_status as BookingFormPayload["booking_status"],
      remarks,
      internal_notes: internalNotesRaw || null,
      rescheduled_from: rescheduledFromRaw || null,
      cancel_reason: cancelReasonRaw || null,
    },
  };
}

async function generateBookingCode() {
  const year = new Date().getUTCFullYear();
  const prefix = `MHRWS-${year}-`;

  const { data, error } = await supabaseAdmin
    .from(BOOKINGS_TABLE)
    .select("booking_code")
    .ilike("booking_code", `${prefix}%`)
    .order("booking_code", { ascending: false })
    .limit(200);

  if (error) {
    throw wrapBookingsError(error, "Failed to generate booking code.");
  }

  let maxSequence = 0;
  for (const row of (data || []) as Pick<BookingRow, "booking_code">[]) {
    const match = row.booking_code.match(/^MHRWS-(\d{4})-(\d{4})$/);
    if (!match) continue;
    if (Number(match[1]) !== year) continue;
    const sequence = Number(match[2]);
    if (Number.isFinite(sequence) && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  const nextSequence = String(maxSequence + 1).padStart(4, "0");
  return `${prefix}${nextSequence}`;
}

export async function listBookings() {
  const { data, error } = await supabaseAdmin
    .from(BOOKINGS_TABLE)
    .select("*")
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw wrapBookingsError(error, "Failed to load bookings.");
  }

  return (data || []) as BookingRow[];
}

export async function getBookingById(id: number) {
  const { data, error } = await supabaseAdmin
    .from(BOOKINGS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw wrapBookingsError(error, "Failed to load booking.");
  }

  return (data as BookingRow | null) || null;
}

export async function validateBookingCapacity(input: {
  start_date: string;
  end_date: string;
  trail: TrailOption;
  pax: number;
  excludeBookingId?: number | null;
}) {
  const { data, error } = await supabaseAdmin
    .from(BOOKINGS_TABLE)
    .select("id,start_date,end_date,pax,approval_status,booking_status,booking_type")
    .eq("start_date", input.start_date)
    .eq("end_date", input.end_date);

  if (error) {
    throw wrapBookingsError(error, "Failed to validate booking capacity.");
  }

  const existing = ((data || []) as Partial<BookingRow>[])
    .filter((row) => row.id !== input.excludeBookingId)
    .filter((row) => bookingCountsTowardCapacity(row))
    .filter((row) => !isOffSeasonLikeType(String(row.booking_type || "")));

  const scheduledPax = existing.reduce(
    (total, row) => total + (typeof row.pax === "number" ? row.pax : 0),
    0
  );
  const conflicts =
    scheduledPax + input.pax > 30 ? [`${input.start_date} to ${input.end_date}`] : [];

  return {
    ok: conflicts.length === 0,
    conflictingDates: conflicts,
  };
}

export async function findOffSeasonOverlaps(input: {
  start_date: string;
  end_date: string;
  excludeBookingId?: number | null;
}) {
  const { data, error } = await supabaseAdmin
    .from(BOOKINGS_TABLE)
    .select("id,booking_code,start_date,end_date,contact_name")
    .eq("booking_type", "Off Season")
    .lte("start_date", input.end_date)
    .gte("end_date", input.start_date)
    .order("start_date", { ascending: true });

  if (error) {
    throw wrapBookingsError(error, "Failed to validate Off Season overlap.");
  }

  return ((data || []) as OffSeasonConflict[]).filter(
    (row) => row.id !== input.excludeBookingId
  );
}

type CalendarData = {
  days: CalendarDayData[];
  summary: {
    sanOpenDays: number;
    govOpenDays: number;
    fullTrailDays: number;
    specialOrBlockedDays: number;
  };
  bookings: SelectedDateBooking[];
};

export const ALL_CATEGORIES = "All Categories" as const;

function matchesParticipantCategory(
  booking: BookingRow,
  category: ParticipantCategoryOption | typeof ALL_CATEGORIES
) {
  if (category === ALL_CATEGORIES) return true;
  if (isOffSeasonLikeType(booking.booking_type)) return true;
  return booking.participant_category === category;
}

function inferDayState(input: {
  occupancy: number;
  blocked: boolean;
  fullSchedule: boolean;
}): CalendarDayData["sanState"] {
  if (input.blocked) return "blocked";
  if (input.fullSchedule) return "full";
  if (input.occupancy >= 24) return "limited";
  return "available";
}

export async function getCalendarData(
  month: string,
  category: ParticipantCategoryOption | typeof ALL_CATEGORIES = ALL_CATEGORIES
): Promise<CalendarData> {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("Invalid month.");
  }

  const monthStart = `${month}-01`;
  const monthStartDate = parseDateOnly(monthStart);
  if (!monthStartDate) {
    throw new Error("Invalid month.");
  }

  const nextMonth = new Date(Date.UTC(monthStartDate.getUTCFullYear(), monthStartDate.getUTCMonth() + 1, 1));
  const monthEndDate = addDays(nextMonth, -1);
  const monthEnd = formatDateOnly(monthEndDate);
  const { data, error } = await supabaseAdmin
    .from(BOOKINGS_TABLE)
    .select("*")
    .lte("start_date", monthEnd)
    .gte("end_date", monthStart)
    .order("start_date", { ascending: true });

  if (error) {
    throw wrapBookingsError(error, "Failed to load calendar data.");
  }

  const relevantBookings = ((data || []) as BookingRow[]).filter((row) =>
    bookingCountsTowardCapacity(row)
  );
  const filteredBookings = relevantBookings.filter((booking) =>
    matchesParticipantCategory(booking, category)
  );
  const occupancyBookings = filteredBookings.filter(
    (booking) => !isOffSeasonLikeType(booking.booking_type)
  );

  const blockedDates = new Map<string, Set<TrailOption>>();
  const fullScheduleDates = new Map<string, Set<TrailOption>>();
  const occupancy = new Map<
    string,
    {
      sanIsidro: number;
      governorGeneroso: number;
    }
  >();

  for (const booking of filteredBookings) {
    const days = expandDateRange(booking.start_date, booking.end_date);

    if (booking.booking_type === "Off Season") {
      for (const day of days) {
        blockedDates.set(day, new Set<TrailOption>(TRAIL_OPTIONS));
      }
      continue;
    }

    const isBlockedSchedule = booking.booking_type === "Block Schedule";

    for (const day of days) {
      if (isBlockedSchedule) {
        const set = blockedDates.get(day) || new Set<TrailOption>();
        set.add(booking.trail);
        blockedDates.set(day, set);
      }
    }
  }

  const scheduleGroupPax = new Map<string, number>();
  for (const booking of occupancyBookings) {
    const key = getScheduleGroupKey(booking.start_date, booking.end_date);
    scheduleGroupPax.set(key, (scheduleGroupPax.get(key) || 0) + booking.pax);
  }

  for (const booking of occupancyBookings) {
    const key = getScheduleGroupKey(booking.start_date, booking.end_date);
    if ((scheduleGroupPax.get(key) || 0) < 30) continue;

    for (const day of expandDateRange(booking.start_date, booking.end_date)) {
      const set = fullScheduleDates.get(day) || new Set<TrailOption>();
      set.add("San Isidro Trail");
      set.add("Governor Generoso Trail");
      fullScheduleDates.set(day, set);
    }
  }

  for (const booking of occupancyBookings) {
    const days = expandDateRange(booking.start_date, booking.end_date);
    for (const day of days) {
      const entry = occupancy.get(day) || { sanIsidro: 0, governorGeneroso: 0 };

      if (booking.trail === "San Isidro Trail") {
        entry.sanIsidro += booking.pax;
      } else if (booking.trail === "Governor Generoso Trail") {
        entry.governorGeneroso += booking.pax;
      }
      occupancy.set(day, entry);
    }
  }

  const days: CalendarDayData[] = [];
  let sanOpenDays = 0;
  let govOpenDays = 0;
  let fullTrailDays = 0;
  let specialOrBlockedDays = 0;

  for (let current = monthStartDate; current <= monthEndDate; current = addDays(current, 1)) {
    const date = formatDateOnly(current);
    const entry = occupancy.get(date) || { sanIsidro: 0, governorGeneroso: 0 };
    const blockedSet = blockedDates.get(date) || new Set<TrailOption>();
    const fullSet = fullScheduleDates.get(date) || new Set<TrailOption>();

    const sanState = inferDayState({
      occupancy: entry.sanIsidro,
      blocked: blockedSet.has("San Isidro Trail"),
      fullSchedule: fullSet.has("San Isidro Trail"),
    });
    const govState = inferDayState({
      occupancy: entry.governorGeneroso,
      blocked: blockedSet.has("Governor Generoso Trail"),
      fullSchedule: fullSet.has("Governor Generoso Trail"),
    });

    if (sanState !== "full" && sanState !== "blocked") sanOpenDays += 1;
    if (govState !== "full" && govState !== "blocked") govOpenDays += 1;
    if (sanState === "full") fullTrailDays += 1;
    if (govState === "full") fullTrailDays += 1;
    if (sanState === "blocked" || govState === "blocked") specialOrBlockedDays += 1;

    days.push({
      date,
      day: date.slice(-2),
      sanIsidro: entry.sanIsidro,
      governorGeneroso: entry.governorGeneroso,
      sanState,
      govState,
    });
  }

  const monthBookings = filteredBookings.map((booking) => ({
      id: booking.id,
      booking_code: booking.booking_code,
      contact_name: booking.contact_name,
      participant_category: booking.participant_category,
      trail: booking.trail,
      pax: booking.pax,
      start_date: booking.start_date,
      end_date: booking.end_date,
      booking_type: booking.booking_type,
      booking_status: booking.booking_status,
      approval_status: booking.approval_status,
      remarks: booking.remarks,
    }));

  return {
    days,
    summary: {
      sanOpenDays,
      govOpenDays,
      fullTrailDays,
      specialOrBlockedDays,
    },
    bookings: monthBookings,
  };
}

export async function createBooking(payload: BookingFormPayload) {
  const now = new Date().toISOString();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const booking_code = await generateBookingCode();
    const { data, error } = await supabaseAdmin
      .from(BOOKINGS_TABLE)
      .insert([{ ...payload, booking_code, created_at: now, updated_at: now }])
      .select("*")
      .single();

    if (!error) {
      return data as BookingRow;
    }

    const message = String(error.message || "");
    if (message.toLowerCase().includes("duplicate") || message.toLowerCase().includes("unique")) {
      lastError = new Error("Booking code collision encountered while generating the next sequence.");
      continue;
    }

    throw wrapBookingsError(error, "Failed to create booking.");
  }

  throw lastError || new Error("Failed to generate a unique booking code.");
}

export async function updateBooking(id: number, payload: BookingWritePayload) {
  const { data, error } = await supabaseAdmin
    .from(BOOKINGS_TABLE)
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw wrapBookingsError(error, "Failed to update booking.");
  }

  return data as BookingRow;
}

export function getConflictMessage(_trail: TrailOption, conflictingDates: string[]) {
  if (conflictingDates.length === 0) {
    return "The selected hiking schedule stays within the 30-pax shared limit across both trails.";
  }

  const preview = conflictingDates.join(", ");
  return `The selected hiking schedule is already full across both trails: ${preview}.`;
}

export function getOffSeasonConflictMessage(overlaps: OffSeasonConflict[]) {
  if (overlaps.length === 0) {
    return "Selected dates do not overlap an Off Season closure.";
  }

  const preview = overlaps
    .map((closure) => `${closure.start_date} to ${closure.end_date}`)
    .join(", ");

  return `Selected dates overlap an Off Season closure on: ${preview}.`;
}

export function canCreateBookings(role?: string) {
  const normalized = String(role || "").trim().toLowerCase();
  return normalized === "admin" || normalized === "co_admin";
}

export function canEditBookings(role?: string) {
  return String(role || "").trim().toLowerCase() === "admin";
}

export function canViewBookings(role?: string) {
  const normalized = String(role || "").trim().toLowerCase();
  return (
    normalized === "admin" ||
    normalized === "co_admin" ||
    normalized === "staff" ||
    normalized === "registered_staff"
  );
}

export function canManageBookings(role?: string) {
  return canCreateBookings(role);
}
