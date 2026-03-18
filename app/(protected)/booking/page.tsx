"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import type { BookingFormPayload, BookingRow } from "@/app/lib/bookingTypes";
import {
  APPROVAL_STATUS_OPTIONS,
  BOOKING_STATUS_OPTIONS,
  BOOKING_TYPE_OPTIONS,
  PARTICIPANT_CATEGORY_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  TRAIL_OPTIONS,
} from "@/app/lib/bookingTypes";
import {
  bookingCountsTowardCapacity,
  computeTrailDayOccupancy,
  expandDateRange,
  formatDisplayDate,
  trailPillTone,
} from "@/app/lib/bookingUtils";

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function createEmptyForm(): BookingFormPayload {
  return {
    contact_name: "",
    contact_number: "",
    email: "",
    organization_name: "",
    booking_type: "Regular Booking",
    participant_category: "DIY",
    start_date: "",
    end_date: "",
    trail: "San Isidro Trail",
    pax: 1,
    payment_status: "Unpaid",
    approval_status: "Pending Review",
    booking_status: "Active",
    remarks: "",
    internal_notes: "",
    rescheduled_from: "",
    cancel_reason: "",
  };
}

function isOffSeasonLikeType(bookingType: BookingFormPayload["booking_type"]) {
  return bookingType === "Off Season" || bookingType === "Block Schedule";
}

function isSpecialClimbType(bookingType: BookingFormPayload["booking_type"]) {
  return bookingType === "Special Climb";
}

function clearClosurePlaceholderName(contactName: string) {
  return contactName === "Off Season" || contactName === "Block Schedule" ? "" : contactName;
}

const OFF_SEASON_FORM_DEFAULTS: Pick<
  BookingFormPayload,
  "participant_category" | "trail" | "pax"
> = {
  participant_category: "Organization / Group",
  trail: "Governor Generoso Trail",
  pax: 2,
};

function normalizeOffSeasonLikeForm(
  form: BookingFormPayload,
  bookingType: Extract<BookingFormPayload["booking_type"], "Off Season" | "Block Schedule">
): BookingFormPayload {
  const regularDefaults = createEmptyForm();

  return {
    ...form,
    booking_type: bookingType,
    contact_name: form.contact_name.trim() || bookingType,
    participant_category:
      form.participant_category === regularDefaults.participant_category
        ? OFF_SEASON_FORM_DEFAULTS.participant_category
        : form.participant_category,
    trail:
      form.trail === regularDefaults.trail ? OFF_SEASON_FORM_DEFAULTS.trail : form.trail,
    pax: form.pax === regularDefaults.pax ? OFF_SEASON_FORM_DEFAULTS.pax : form.pax,
  };
}

function getScheduleDurationDays(start_date: string, end_date: string) {
  return expandDateRange(start_date, end_date).length;
}

function getCamp3NightPax(
  bookings: BookingRow[],
  input: {
    start_date: string;
    excludeBookingId?: number | null;
  }
) {
  return bookings
    .filter((booking) => booking.id !== input.excludeBookingId)
    .filter((booking) => !isOffSeasonLikeType(booking.booking_type))
    .filter((booking) => bookingCountsTowardCapacity(booking))
    .filter((booking) => booking.start_date === input.start_date)
    .reduce((total, booking) => total + booking.pax, 0);
}

const baseFieldClassName =
  "min-h-12 w-full rounded-2xl border border-slate-200 bg-[#f8faf8] px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#235347] focus:bg-white focus:ring-4 focus:ring-[#235347]/10";

const invalidFieldClassName =
  "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-500/10";

const statusTone: Record<string, string> = {
  Paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Unpaid: "border-rose-200 bg-rose-50 text-rose-700",
  Partial: "border-amber-200 bg-amber-50 text-amber-700",
  "No Transaction": "border-slate-200 bg-slate-100 text-slate-600",
  "Pending Review": "border-amber-200 bg-amber-50 text-amber-700",
  "PASu Approved": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Rejected: "border-rose-200 bg-rose-50 text-rose-700",
  Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Rescheduled: "border-amber-200 bg-amber-50 text-amber-700",
  Cancelled: "border-slate-200 bg-slate-100 text-slate-600",
  Completed: "border-slate-200 bg-slate-100 text-slate-700",
};

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  helper,
  placeholder,
  invalid = false,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "date" | "number";
  min?: number | string;
  max?: number | string;
  helper?: string;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`${baseFieldClassName} ${invalid ? invalidFieldClassName : ""}`}
      />
      {helper && <span className="mt-1 block text-xs leading-5 text-slate-500">{helper}</span>}
    </label>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
  invalid = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  invalid?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${baseFieldClassName} ${invalid ? invalidFieldClassName : ""}`}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

type ApiError = {
  error?: string;
  conflictingDates?: string[];
  offSeasonClosures?: Array<Pick<BookingRow, "id" | "booking_code" | "start_date" | "end_date" | "contact_name">>;
};

type CapacityState =
  | { kind: "idle" }
  | { kind: "valid"; title: string; message: string }
  | { kind: "invalid"; title: string; message: string; conflictingDates: string[] };

type OffSeasonWarningState =
  | { kind: "idle" }
  | {
      kind: "warning";
      message: string;
      closures: Array<Pick<BookingRow, "id" | "booking_code" | "start_date" | "end_date" | "contact_name">>;
    };

export default function BookingPage() {
  const { user, loading: loadingUser } = useAuth();
  const searchParams = useSearchParams();
  const startDateParam = searchParams.get("startDate") || "";

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [trailFilter, setTrailFilter] = useState("All Trails");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("All");
  const [approvalFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [form, setForm] = useState<BookingFormPayload>(createEmptyForm());
  const isOffSeasonLike = isOffSeasonLikeType(form.booking_type);
  const isSpecialClimb = isSpecialClimbType(form.booking_type);
  const showParticipantCategory = !isOffSeasonLike;
  const showTrail = !isOffSeasonLike;
  const showPax = !isOffSeasonLike && !isSpecialClimb;
  const showStatusControls = !isOffSeasonLike;
  const isEditDialogOpen = editingId !== null;
  const normalizedRole = useMemo(() => normalizeRole(user?.role), [user?.role]);
  const isAdmin = normalizedRole === "admin";
  const canViewBookings = normalizedRole === "admin" || normalizedRole === "co_admin" || normalizedRole === "registered_staff" || normalizedRole === "staff";
  const canCreateBookings = normalizedRole === "admin" || normalizedRole === "co_admin";
  const canEditBookings = normalizedRole === "admin";

  const visibleBookingTypeOptions = useMemo(
    () =>
      isAdmin
        ? BOOKING_TYPE_OPTIONS
        : BOOKING_TYPE_OPTIONS.filter((option) => option !== "Off Season"),
    [isAdmin]
  );

  async function refreshBookings() {
    const res = await fetch("/api/bookings", {
      cache: "no-store",
      credentials: "include",
    });
    const data = (await res.json().catch(() => null)) as BookingRow[] | ApiError | null;
    if (!res.ok) {
      throw new Error((data as ApiError | null)?.error || "Failed to refresh bookings.");
    }
    setBookings(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    if (loadingUser || !user) return;

    let active = true;

    (async () => {
      try {
        setLoading(true);
        setLoadError("");
        const res = await fetch("/api/bookings", {
          cache: "no-store",
          credentials: "include",
        });
        const data = (await res.json().catch(() => null)) as BookingRow[] | ApiError | null;
        if (!active) return;

        if (!res.ok) {
          setBookings([]);
          setLoadError((data as ApiError | null)?.error || "Failed to load booking records.");
          return;
        }

        setBookings(Array.isArray(data) ? data : []);
      } catch {
        if (!active) return;
        setBookings([]);
        setLoadError("Failed to load booking records.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [loadingUser, user]);

  useEffect(() => {
    if (isAdmin) return;

    setBookingTypeFilter((current) => (current === "Off Season" ? "All" : current));
    setForm((current) =>
      current.booking_type === "Off Season"
        ? {
            ...current,
            booking_type: "Regular Booking",
            contact_name: clearClosurePlaceholderName(current.contact_name),
          }
        : current
    );
  }, [isAdmin]);

  useEffect(() => {
    if (!startDateParam || editingId !== null) return;

    setForm((current) =>
      current.start_date || current.booking_type !== "Regular Booking"
        ? current
        : { ...current, start_date: startDateParam }
    );
  }, [editingId, startDateParam]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm({
      ...createEmptyForm(),
      start_date: startDateParam,
    });
    setSubmitError("");
    setSubmitSuccess("");
  }, [startDateParam]);

  useEffect(() => {
    if (!isEditDialogOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        resetForm();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditDialogOpen, resetForm]);

  const summary = useMemo(() => {
    const activeBookings = bookings.filter(bookingCountsTowardCapacity);
    const occupancy = computeTrailDayOccupancy(activeBookings);
    let nearCapacity = 0;

    for (const value of occupancy.values()) {
      if (value["San Isidro Trail"] >= 24 && value["San Isidro Trail"] < 30) nearCapacity += 1;
      if (value["Governor Generoso Trail"] >= 24 && value["Governor Generoso Trail"] < 30) nearCapacity += 1;
    }

    return {
      active: activeBookings.length,
      pending: bookings.filter(
        (booking) =>
          booking.booking_type !== "Off Season" &&
          booking.approval_status === "Pending Review"
      ).length,
      nearCapacity,
      specialOrBlock: bookings.filter(
        (booking) =>
          booking.booking_type === "Special Climb" ||
          booking.booking_type === "Block Schedule" ||
          booking.booking_type === "Off Season"
      ).length,
    };
  }, [bookings]);

  const visibleRecordBookings = useMemo(
    () =>
      isAdmin
        ? bookings
        : bookings.filter((booking) => booking.booking_type !== "Off Season"),
    [bookings, isAdmin]
  );

  const filteredBookings = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();

    return visibleRecordBookings.filter((booking) => {
      if (trailFilter !== "All Trails" && booking.trail !== trailFilter) return false;
      if (bookingTypeFilter !== "All" && booking.booking_type !== bookingTypeFilter) return false;
      if (approvalFilter !== "All" && booking.approval_status !== approvalFilter) return false;
      if (
        monthFilter &&
        !booking.start_date.startsWith(monthFilter) &&
        !booking.end_date.startsWith(monthFilter)
      ) {
        return false;
      }
      if (
        query &&
        ![
          booking.booking_code,
          booking.contact_name,
          booking.booking_type,
          booking.trail,
          booking.participant_category,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [approvalFilter, bookingTypeFilter, monthFilter, searchFilter, trailFilter, visibleRecordBookings]);

  const scheduleDurationDays = useMemo(
    () => getScheduleDurationDays(form.start_date, form.end_date),
    [form.end_date, form.start_date]
  );

  const camp3NightPax = useMemo(
    () =>
      form.start_date
        ? getCamp3NightPax(bookings, {
            start_date: form.start_date,
            excludeBookingId: editingId,
          })
        : 0,
    [bookings, editingId, form.start_date]
  );

  const capacityState = useMemo<CapacityState>(() => {
    if (isOffSeasonLike) {
      return { kind: "idle" };
    }
    if (!form.start_date || !Number.isFinite(form.pax) || form.pax <= 0) {
      return { kind: "idle" };
    }

    const remainingSlots = Math.max(30 - camp3NightPax, 0);

    if (camp3NightPax + form.pax > 30) {
      return {
        kind: "invalid",
        title: "Camp 3 at capacity",
        message: "Camp 3 is at capacity for this night. Please choose a different start date.",
        conflictingDates: [form.start_date],
      };
    }

    if (!form.end_date || !form.trail) {
      return {
        kind: "valid",
        title: "Camp 3 night available",
        message: `${Math.max(
          remainingSlots - form.pax,
          0
        )} Camp 3 slots remaining for hikers starting on ${formatDisplayDate(form.start_date)}.`,
      };
    }

    if (scheduleDurationDays === 0) {
      return { kind: "idle" };
    }

    if (scheduleDurationDays < 2 || scheduleDurationDays > 3) {
      return {
        kind: "invalid",
        title: "Invalid hike duration",
        message: "Hike duration must be between 2 and 3 days.",
        conflictingDates: [],
      };
    }

    return {
      kind: "valid",
      title: "Camp 3 night available",
      message: `${Math.max(
        remainingSlots - form.pax,
        0
      )} Camp 3 slots remaining for hikers starting on ${formatDisplayDate(form.start_date)}.`,
    };
  }, [
    camp3NightPax,
    form.end_date,
    form.pax,
    form.start_date,
    form.trail,
    isOffSeasonLike,
    scheduleDurationDays,
  ]);

  const offSeasonWarning = useMemo<OffSeasonWarningState>(() => {
    if (isOffSeasonLike) {
      return { kind: "idle" };
    }

    if (!form.start_date || !form.end_date || !form.trail) {
      return { kind: "idle" };
    }

    const overlaps = bookings
      .filter((booking) => booking.id !== editingId)
      .filter((booking) => booking.booking_type === "Off Season")
      .filter(
        (booking) =>
          form.start_date <= booking.end_date && form.end_date >= booking.start_date
      )
      .sort((a, b) => a.start_date.localeCompare(b.start_date));

    if (overlaps.length === 0) {
      return { kind: "idle" };
    }

    const rangePreview = overlaps
      .map((booking) => `${formatDisplayDate(booking.start_date)} to ${formatDisplayDate(booking.end_date)}`)
      .join(", ");

    return {
      kind: "warning",
      message:
        overlaps.length === 1
          ? `Selected dates overlap the Off Season closure from ${rangePreview}.`
          : `Selected dates overlap Off Season closures on ${rangePreview}.`,
      closures: overlaps.map((booking) => ({
        id: booking.id,
        booking_code: booking.booking_code,
        start_date: booking.start_date,
        end_date: booking.end_date,
        contact_name: booking.contact_name,
      })),
    };
  }, [bookings, editingId, form.end_date, form.start_date, form.trail, isOffSeasonLike]);

  function setField<K extends keyof BookingFormPayload>(key: K, value: BookingFormPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setBookingType(value: BookingFormPayload["booking_type"]) {
    setForm((current) =>
      isOffSeasonLikeType(value)
        ? normalizeOffSeasonLikeForm(
            current,
            value as Extract<BookingFormPayload["booking_type"], "Off Season" | "Block Schedule">
          )
        : {
            ...current,
            booking_type: value,
            contact_name: clearClosurePlaceholderName(current.contact_name),
          }
    );
  }

  function startEdit(booking: BookingRow) {
    if (!canEditBookings) return;

    setEditingId(booking.id);
    const nextForm: BookingFormPayload = {
      contact_name: booking.contact_name,
      contact_number: booking.contact_number,
      email: booking.email || "",
      organization_name: booking.organization_name || "",
      booking_type: booking.booking_type,
      participant_category: booking.participant_category,
      start_date: booking.start_date,
      end_date: booking.end_date,
      trail: booking.trail,
      pax: booking.pax,
      payment_status:
        String(booking.payment_status) === "Partial" ? "Unpaid" : booking.payment_status,
      approval_status: booking.approval_status,
      booking_status: booking.booking_status,
      remarks: booking.remarks,
      internal_notes: booking.internal_notes || "",
      rescheduled_from: booking.rescheduled_from || "",
      cancel_reason: booking.cancel_reason || "",
    };
    setForm(
      isOffSeasonLikeType(booking.booking_type)
        ? normalizeOffSeasonLikeForm(
            nextForm,
            booking.booking_type as Extract<BookingFormPayload["booking_type"], "Off Season" | "Block Schedule">
          )
        : nextForm
    );
    setSubmitError("");
    setSubmitSuccess("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canCreateBookings && !editingId) {
      setSubmitError("Only co-admin and admin can create bookings.");
      return;
    }

    if (!canEditBookings && editingId) {
      setSubmitError("Only admin can edit existing bookings.");
      return;
    }

    if (form.booking_type === "Off Season" && !isAdmin) {
      setSubmitError("Only admin can create or update Off Season closures.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");
      setSubmitSuccess("");

      const payload = isOffSeasonLike
        ? normalizeOffSeasonLikeForm(
            form,
            form.booking_type as Extract<BookingFormPayload["booking_type"], "Off Season" | "Block Schedule">
          )
        : form;

      const res = await fetch("/api/bookings", {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });

      const data = (await res.json().catch(() => null)) as BookingRow | ApiError | null;
      if (!res.ok) {
        const conflictText =
          Array.isArray((data as ApiError | null)?.conflictingDates) &&
          (data as ApiError).conflictingDates!.length > 0
            ? ` Conflicting schedule: ${(data as ApiError).conflictingDates!.join(", ")}.`
            : "";
        const offSeasonText =
          Array.isArray((data as ApiError | null)?.offSeasonClosures) &&
          (data as ApiError).offSeasonClosures!.length > 0
            ? ` Closures: ${(data as ApiError).offSeasonClosures!
                .map((closure) => `${closure.start_date} to ${closure.end_date}`)
                .join(", ")}.`
            : "";
        setSubmitError(
          `${(data as ApiError | null)?.error || "Failed to save booking."}${conflictText}${offSeasonText}`
        );
        return;
      }

      await refreshBookings();
      resetForm();
      setSubmitSuccess(editingId ? "Booking updated successfully." : "Booking created successfully.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to save booking.");
    } finally {
      setSubmitting(false);
    }
  }

  const regularSubmitDisabled =
    ((editingId ? !canEditBookings : !canCreateBookings) || submitting || capacityState.kind === "invalid");

  return (
    <section className="min-h-full bg-[#f4f7f5] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:p-5 md:p-8">
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5c7b67]">
              Booking Transactions
            </p>
            <h1 className="mt-3 text-[1.7rem] font-semibold tracking-tight text-slate-900 sm:text-3xl md:text-5xl">
              Booking
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base md:leading-7">
              Persisted booking records with server-side validation against
              Camp 3 first-night capacity for hikers sharing the same start date.
            </p>
          </div>

          {canViewBookings && !canCreateBookings && user && (
            <div className="mt-5 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              You can view booking records, but only co-admin and admin can create bookings. Only admin can edit existing bookings.
            </div>
          )}

          {loadError && (
            <div className="mt-5 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {loadError}
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Active Bookings", value: summary.active, note: "Records with scheduling impact.", accent: "bg-emerald-500/70" },
              { label: "Pending Review", value: summary.pending, note: "Awaiting office approval action.", accent: "bg-amber-500/70" },
              { label: "Near Capacity", value: summary.nearCapacity, note: "Trail-days between 24 and 29 pax.", accent: "bg-rose-500/70" },
              { label: "Special / Block", value: summary.specialOrBlock, note: "Special Climb or Block Schedule records.", accent: "bg-slate-400/80" },
            ].map((card) => (
              <article
                key={card.label}
                className="rounded-[24px] border border-slate-200 bg-[#f8fbf8] p-4 shadow-sm sm:p-5"
              >
                <div className={`h-1.5 w-16 rounded-full ${card.accent}`} />
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:mt-4 sm:text-[11px]">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900 sm:mt-3 sm:text-3xl">
                  {card.value}
                </p>
                <p className="mt-1.5 text-sm leading-6 text-slate-600 sm:mt-2">{card.note}</p>
              </article>
            ))}
          </div>

          <AnimatePresence>
            {isEditDialogOpen && (
              <motion.button
                type="button"
                aria-label="Close edit dialog"
                onClick={resetForm}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="fixed inset-0 z-[79] bg-[#16362d]/26 backdrop-blur-[3px]"
              />
            )}
          </AnimatePresence>

          <motion.form
            onSubmit={handleSubmit}
            initial={isEditDialogOpen ? { opacity: 0, scale: 0.985, y: 10 } : false}
            animate={
              isEditDialogOpen
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={
              isEditDialogOpen
                ? "fixed inset-x-2 top-3 z-[80] mx-auto max-h-[calc(100vh-1.5rem)] w-full max-w-6xl overflow-y-auto rounded-[28px] border border-slate-200 bg-[#fbfcfb] p-4 shadow-[0_28px_90px_rgba(15,23,42,0.26)] sm:inset-x-4 sm:top-6 sm:max-h-[calc(100vh-3rem)] sm:p-5 md:p-6"
                : "mt-5 rounded-[28px] border border-slate-200 bg-[#fbfcfb] p-4 shadow-sm sm:p-5 md:p-6"
            }
          >
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {isEditDialogOpen ? "Edit Booking" : "Booking Form"}
                </p>
                <h2 className="mt-1.5 text-lg font-semibold text-slate-900 sm:mt-2 sm:text-2xl">
                  {editingId ? "Edit booking record" : "Add booking record"}
                </h2>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                <p className="max-w-md text-sm leading-6 text-slate-600">
                  Use this form to create or update persisted booking records before filtering and reviewing the booking table below.
                </p>
                {isEditDialogOpen && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Booking Code:</span>{" "}
              {editingId
                ? bookings.find((booking) => booking.id === editingId)?.booking_code || "Unavailable"
                : "Auto-generated on save using the MHRWS-YYYY-XXXX format."}
            </div>

            {submitError && (
              <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {submitSuccess}
              </div>
            )}

            <div className={`mt-4 grid gap-3 ${isOffSeasonLike ? "xl:grid-cols-[1.15fr_0.85fr]" : "lg:grid-cols-[1.25fr_0.75fr]"}`}>
              <div className="rounded-[20px] border border-slate-200 bg-white p-3.5 sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Booking Details
                </p>
                <div className="mt-2.5 grid max-h-[34rem] gap-2.5 overflow-y-auto pr-1 [scrollbar-color:#c8d8cf_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#c8d8cf] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
                  {isOffSeasonLike ? (
                    <div
                      className="grid gap-4 md:grid-cols-2"
                    >
                      <LabeledSelect
                        label="Booking Type"
                        value={form.booking_type}
                        onChange={(value) => setBookingType(value as BookingFormPayload["booking_type"])}
                        options={visibleBookingTypeOptions}
                      />
                      <LabeledInput
                        label="Start Date"
                        type="date"
                        value={form.start_date}
                        onChange={(value) => setField("start_date", value)}
                        helper="First covered day"
                        invalid={capacityState.kind === "invalid"}
                      />
                      <LabeledInput
                        label="End Date"
                        type="date"
                        value={form.end_date}
                        onChange={(value) => setField("end_date", value)}
                        helper="Last covered day"
                        invalid={capacityState.kind === "invalid"}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-12">
                        <div className="xl:col-span-4">
                          <LabeledInput
                            label="Guest Name"
                            value={form.contact_name}
                            onChange={(value) => setField("contact_name", value)}
                            placeholder="Enter guest name"
                          />
                        </div>
                        <div className="xl:col-span-3">
                          <LabeledSelect
                            label="Booking Type"
                            value={form.booking_type}
                            onChange={(value) =>
                              setBookingType(value as BookingFormPayload["booking_type"])
                            }
                            options={visibleBookingTypeOptions}
                          />
                        </div>
                        {showParticipantCategory && (
                          <div className="xl:col-span-2">
                            <LabeledSelect
                              label="Participant Category"
                              value={form.participant_category}
                              onChange={(value) =>
                                setField(
                                  "participant_category",
                                  value as BookingFormPayload["participant_category"]
                                )
                              }
                              options={PARTICIPANT_CATEGORY_OPTIONS}
                            />
                          </div>
                        )}
                        {showTrail && (
                          <div className="xl:col-span-3">
                            <LabeledSelect
                              label="Trail"
                              value={form.trail}
                              onChange={(value) => setField("trail", value as BookingFormPayload["trail"])}
                              options={TRAIL_OPTIONS}
                              invalid={capacityState.kind === "invalid"}
                            />
                          </div>
                        )}
                      </div>

                      <div className="rounded-[18px] border border-slate-200 bg-[#fbfcfb] p-3 lg:p-4">
                        <div className={`grid gap-2.5 md:grid-cols-2 ${showPax ? "xl:grid-cols-12" : "xl:grid-cols-8"}`}>
                          <div className="xl:col-span-4">
                            <LabeledInput
                              label="Start Date"
                              type="date"
                              value={form.start_date}
                              onChange={(value) => setField("start_date", value)}
                              helper="First hiking day (2-3 day schedule)"
                              invalid={capacityState.kind === "invalid"}
                            />
                          </div>
                          <div className="xl:col-span-4">
                            <LabeledInput
                              label="End Date"
                              type="date"
                              value={form.end_date}
                              onChange={(value) => setField("end_date", value)}
                              helper="Last hiking day"
                              invalid={capacityState.kind === "invalid"}
                            />
                          </div>
                          {showPax && (
                            <div className="xl:col-span-4">
                              <LabeledInput
                                label="Number of Participants"
                                type="number"
                                min={1}
                                max={30}
                                value={form.pax}
                                onChange={(value) => setField("pax", Number(value || 0))}
                                helper="Camp 3 first-night capacity is shared by hikers with the same start date"
                                invalid={capacityState.kind === "invalid"}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {!isOffSeasonLike && capacityState.kind !== "idle" && (
                    <div
                      className={`rounded-2xl border px-4 py-3 text-sm ${
                        capacityState.kind === "invalid"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <p className="font-semibold">
                        {capacityState.title}
                      </p>
                      <p className="mt-1 leading-6">{capacityState.message}</p>
                    </div>
                  )}
                  {!isOffSeasonLike && offSeasonWarning.kind === "warning" && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <p className="font-semibold text-amber-900">Off Season overlap</p>
                      <p className="mt-1 leading-6">{offSeasonWarning.message}</p>
                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        {offSeasonWarning.closures
                          .map((closure) =>
                            `${closure.booking_code || closure.contact_name}: ${closure.start_date} to ${closure.end_date}`
                          )
                          .join(" | ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {isOffSeasonLike ? (
                <div className="rounded-[20px] border border-slate-200 bg-white p-3.5 sm:p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {form.booking_type}
                  </p>
                  <div className="mt-3 rounded-[18px] border border-[#d9e4dd] bg-[#f6faf7] p-5">
                    <p className="text-base font-semibold text-slate-900">
                      Selected dates will be marked unavailable.
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {form.booking_type} uses the closure-style form. Participant category, trail, pax, and status fields stay hidden while the selected date range is recorded for schedule management.
                    </p>
                  </div>

                  <div className="mt-4">
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Remarks
                    </span>
                    <textarea value={form.remarks} onChange={(e) => setField("remarks", e.target.value)} placeholder="Remarks (optional)" rows={4} className="w-full rounded-2xl border border-slate-200 bg-[#f8faf8] px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-[#235347] focus:bg-white focus:ring-4 focus:ring-[#235347]/10" />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="submit" disabled={(editingId ? !canEditBookings : !canCreateBookings) || submitting} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#235347] px-5 text-sm font-semibold text-white transition hover:bg-[#1d463b] disabled:cursor-not-allowed disabled:opacity-60">
                      {submitting ? "Saving..." : editingId ? `Update ${form.booking_type}` : `Create ${form.booking_type}`}
                    </button>
                    <button type="button" onClick={resetForm} className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      {editingId ? "Cancel Edit" : "Reset"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-[20px] border border-slate-200 bg-white p-3.5 sm:p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Status and Notes
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {showStatusControls && (
                      <>
                        <LabeledSelect
                          label="Payment Status"
                          value={form.payment_status}
                          onChange={(value) =>
                            setField("payment_status", value as BookingFormPayload["payment_status"])
                          }
                          options={PAYMENT_STATUS_OPTIONS}
                        />
                        <LabeledSelect
                          label="Approval Status"
                          value={form.approval_status}
                          onChange={(value) =>
                            setField("approval_status", value as BookingFormPayload["approval_status"])
                          }
                          options={APPROVAL_STATUS_OPTIONS}
                        />
                        <div className="sm:col-span-2">
                          <LabeledSelect
                            label="Booking Status"
                            value={form.booking_status}
                            onChange={(value) =>
                              setField("booking_status", value as BookingFormPayload["booking_status"])
                            }
                            options={BOOKING_STATUS_OPTIONS}
                          />
                        </div>
                      </>
                    )}
                    <textarea value={form.remarks} onChange={(e) => setField("remarks", e.target.value)} placeholder="Remarks (optional)" rows={3} className="rounded-2xl border border-slate-200 bg-[#f8faf8] px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-[#235347] focus:bg-white focus:ring-4 focus:ring-[#235347]/10 sm:col-span-2" />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="submit" disabled={regularSubmitDisabled} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#235347] px-5 text-sm font-semibold text-white transition hover:bg-[#1d463b] disabled:cursor-not-allowed disabled:opacity-60">
                      {submitting
                        ? "Saving..."
                        : capacityState.kind === "invalid" &&
                            capacityState.title === "Camp 3 at capacity"
                          ? "Camp 3 Full"
                          : editingId
                            ? "Update Booking"
                            : "Create Booking"}
                    </button>
                    <button type="button" onClick={resetForm} className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      {editingId ? "Cancel Edit" : "Reset"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.form>

          <div className="mt-5 rounded-[28px] border border-slate-200 bg-[#fbfcfb] p-4 shadow-sm sm:p-5 md:p-6">
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-end sm:justify-between sm:pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Booking Records
                </p>
                <h2 className="mt-1.5 text-lg font-semibold text-slate-900 sm:mt-2 sm:text-2xl">
                  Filters and records
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-slate-600">
                Booking conflicts are based on Camp 3 first-night overlap, not full date-range matching.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 items-end gap-2.5 sm:gap-3 lg:grid-cols-[1.15fr_1fr_1fr_1fr]">
              <label className="col-span-2 rounded-[18px] border border-slate-200 bg-white p-3 sm:p-4 lg:col-span-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Search</span>
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(event) => setSearchFilter(event.target.value)}
                  placeholder="Booking code, guest name, type, trail..."
                  className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-[#f8faf8] px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#235347] focus:bg-white focus:ring-4 focus:ring-[#235347]/10"
                />
              </label>

              <label className="rounded-[18px] border border-slate-200 bg-white p-3 sm:p-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Trail</span>
                <select value={trailFilter} onChange={(event) => setTrailFilter(event.target.value)} className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-[#f8faf8] px-3 text-sm text-slate-900 outline-none">
                  <option>All Trails</option>
                  {TRAIL_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="rounded-[18px] border border-slate-200 bg-white p-3 sm:p-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Booking Type</span>
                <select value={bookingTypeFilter} onChange={(event) => setBookingTypeFilter(event.target.value)} className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-[#f8faf8] px-3 text-sm text-slate-900 outline-none">
                  <option>All</option>
                  {visibleBookingTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="col-span-2 rounded-[18px] border border-slate-200 bg-white p-3 sm:col-span-1 sm:p-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Month</span>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(event) => setMonthFilter(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-[#f8faf8] px-3 text-sm text-slate-900 outline-none"
                />
              </label>

            </div>

            <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
              <div className="hidden grid-cols-[1.15fr_1.1fr_1fr_1fr_1fr_1fr_1.1fr_0.6fr_0.85fr_0.95fr_0.85fr_0.75fr] gap-3 border-b border-slate-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 lg:grid">
                <span>Booking Code</span>
                <span>Guest Name</span>
                <span>Type</span>
                <span>Category</span>
                <span>Start Date</span>
                <span>End Date</span>
                <span>Trail</span>
                <span>Pax</span>
                <span>Payment</span>
                <span>Approval</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {loading ? (
                <div className="px-5 py-8 text-sm text-slate-600">Loading booking records...</div>
              ) : filteredBookings.length === 0 ? (
                <div className="px-5 py-8 text-sm text-slate-600">No booking records match the current filters.</div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredBookings.map((row) => (
                    <article key={row.id}>
                      <div className="grid gap-3 px-4 py-4 lg:hidden">
                        <div className="flex flex-wrap items-start justify-between gap-2.5">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{row.booking_code}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{row.contact_name}</p>
                          </div>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone[row.booking_status]}`}>
                            {row.booking_status}
                          </span>
                        </div>

                        <div className="grid gap-2.5 sm:grid-cols-2">
                          <div className="rounded-[18px] border border-slate-200 bg-[#f8faf8] p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Schedule</p>
                            <p className="mt-1.5 text-sm text-slate-900">{row.start_date} to {row.end_date}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {isOffSeasonLikeType(row.booking_type) ? "All trails closed" : row.trail}
                            </p>
                          </div>
                          <div className="rounded-[18px] border border-slate-200 bg-[#f8faf8] p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Type and Pax</p>
                            <p className="mt-1.5 text-sm text-slate-900">
                              {row.booking_type}
                              {isOffSeasonLikeType(row.booking_type) ? "" : ` | ${row.pax} pax`}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {isOffSeasonLikeType(row.booking_type) ? "Closure record" : row.participant_category}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone[row.payment_status]}`}>
                            {isOffSeasonLikeType(row.booking_type) ? "Closure" : row.payment_status}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone[row.approval_status]}`}>
                            {isOffSeasonLikeType(row.booking_type) ? "Closure" : row.approval_status}
                          </span>
                        </div>

                        {canEditBookings && (
                          <div className="flex gap-2">
                            <button type="button" onClick={() => startEdit(row)} className="inline-flex min-h-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
                              Edit
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="hidden grid-cols-[1.15fr_1.1fr_1fr_1fr_1fr_1fr_1.1fr_0.6fr_0.85fr_0.95fr_0.85fr_0.75fr] items-center gap-3 px-5 py-5 text-sm text-slate-700 lg:grid">
                        <div className="font-semibold text-slate-900">{row.booking_code}</div>
                        <div>
                          <p className="font-medium text-slate-900">{row.contact_name}</p>
                          {!isOffSeasonLikeType(row.booking_type) && (
                            <p className="mt-1 text-xs text-slate-500">{row.participant_category}</p>
                          )}
                        </div>
                        <span>{row.booking_type}</span>
                        <span>{isOffSeasonLikeType(row.booking_type) ? "Closure" : row.participant_category}</span>
                        <span>{row.start_date}</span>
                        <span>{row.end_date}</span>
                        {isOffSeasonLikeType(row.booking_type) ? (
                          <span className="text-slate-500">All trails</span>
                        ) : (
                          <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${trailPillTone(row.trail)}`}>
                            {row.trail === "San Isidro Trail" ? "San Isidro" : "Governor Generoso"}
                          </span>
                        )}
                        <span>{isOffSeasonLikeType(row.booking_type) ? "Closure" : row.pax}</span>
                        <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone[row.payment_status]}`}>
                          {isOffSeasonLikeType(row.booking_type) ? "Closure" : row.payment_status}
                        </span>
                        <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone[row.approval_status]}`}>
                          {isOffSeasonLikeType(row.booking_type) ? "Closure" : row.approval_status}
                        </span>
                        <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone[row.booking_status]}`}>{row.booking_status}</span>
                        <div>
                          {canEditBookings ? (
                            <button type="button" onClick={() => startEdit(row)} className="inline-flex min-h-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
                              Edit
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Read only</span>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
