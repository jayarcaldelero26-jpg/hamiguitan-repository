"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { PencilSquareIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/app/components/AuthProvider";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { useProtectedTheme } from "@/app/components/ProtectedThemeProvider";
import type { BookingFormPayload, BookingRow } from "@/app/lib/bookingTypes";
import { repoTheme } from "@/app/lib/repoTheme";
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

function isRegularBookingType(bookingType: BookingFormPayload["booking_type"]) {
  return bookingType === "Regular Booking";
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
  "min-h-12 w-full rounded-2xl border border-[var(--ui-border)] bg-white/[0.05] px-3.5 text-sm text-[var(--ui-text-main)] outline-none transition placeholder:text-[color:rgba(151,166,168,0.82)] focus:border-[#395C7A] focus:bg-white/[0.08] focus:ring-4 focus:ring-[#395C7A]/18";

const invalidFieldClassName =
  "border-rose-400/50 bg-rose-500/10 focus:border-rose-400 focus:ring-rose-500/16";

const compactTableActionBaseClassName =
  "app-glass-button app-protected-action-button inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-semibold leading-none transition shadow-sm [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0 [&_svg]:stroke-[1.9]";

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

function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  helper,
  invalid = false,
  className = "",
  inputClassName = "",
  required = false,
  disabled = false,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "email" | "number";
  min?: number | string;
  max?: number | string;
  helper?: string;
  invalid?: boolean;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const labelTone = invalid
    ? "bg-rose-50 text-rose-600"
    : "bg-white/[0.05] text-[var(--ui-text-soft)] peer-focus:bg-white/[0.08] peer-focus:text-[var(--ui-text-main)]";

  return (
    <label className={`block ${className}`}>
      <div className="relative">
        <input
          type={type}
          value={value}
          min={min}
          max={max}
          placeholder=" "
          required={required}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={`peer ${baseFieldClassName} px-3.5 pb-2 pt-5 ${invalid ? invalidFieldClassName : ""} ${inputClassName}`}
        />
        <span
          className={`pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 px-1 text-sm transition-all duration-200 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:translate-y-[-50%] peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:translate-y-[-50%] peer-[:not(:placeholder-shown)]:text-[11px] ${labelTone}`}
        >
          {label}
          {required ? " *" : ""}
        </span>
      </div>
      {helper && <span className="mt-1 block text-xs leading-5 text-slate-500">{helper}</span>}
    </label>
  );
}

function FloatingTextarea({
  label,
  value,
  onChange,
  rows = 3,
  helper,
  invalid = false,
  className = "",
  textareaClassName = "",
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  helper?: string;
  invalid?: boolean;
  className?: string;
  textareaClassName?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const labelTone = invalid
    ? "bg-rose-50 text-rose-600"
    : "bg-white/[0.05] text-[var(--ui-text-soft)] peer-focus:bg-white/[0.08] peer-focus:text-[var(--ui-text-main)]";

  return (
    <label className={`block ${className}`}>
      <div className="relative">
        <textarea
          value={value}
          rows={rows}
          placeholder=" "
          required={required}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={`peer w-full rounded-2xl border border-[var(--ui-border)] bg-white/[0.05] px-3.5 pb-3 pt-6 text-sm text-[var(--ui-text-main)] outline-none transition placeholder:text-[color:rgba(151,166,168,0.82)] focus:border-[#395C7A] focus:bg-white/[0.08] focus:ring-4 focus:ring-[#395C7A]/18 ${invalid ? invalidFieldClassName : ""} ${textareaClassName}`}
        />
        <span
          className={`pointer-events-none absolute left-3 top-6 z-[1] -translate-y-1/2 px-1 text-sm transition-all duration-200 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:translate-y-[-50%] peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:translate-y-[-50%] peer-[:not(:placeholder-shown)]:text-[11px] ${labelTone}`}
        >
          {label}
          {required ? " *" : ""}
        </span>
      </div>
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
  const { theme } = useProtectedTheme();
  const dark = theme === "dark";
  const optionStyle = dark
    ? { backgroundColor: "#F8FAFC", color: "#0F172A" }
    : undefined;

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
          <option key={option} style={optionStyle}>
            {option}
          </option>
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
  const { theme } = useProtectedTheme();
  const ui = repoTheme(theme);
  const dark = theme === "dark";
  const sectionShellClassName = ui.sectionShell;
  const panelSoftClassName = ui.panelSoft;
  const cleanSectionShellClassName = `${ui.shell} p-4 sm:p-5 md:p-6 shadow-none`;
  const cleanPanelClassName = dark
    ? "rounded-[20px] bg-white/[0.03]"
    : "rounded-[20px] bg-white/72";
  const cleanPanelSoftClassName = dark
    ? "rounded-[18px] bg-white/[0.03]"
    : "rounded-[18px] bg-white/78";
  const dialogOverlayClassName = dark
    ? "bg-black/28 backdrop-blur-[2px]"
    : "bg-slate-900/10 backdrop-blur-[2px]";
  const recordsDividerClassName = dark ? "divide-y divide-white/8" : "divide-y divide-slate-200/70";
  const recordsRowTextClassName = dark
    ? "text-[color:rgba(230,237,243,0.82)]"
    : "text-slate-700";
  const recordsMetaTextClassName = dark
    ? "text-[color:rgba(230,237,243,0.68)]"
    : "text-slate-500";
  const recordsDesktopGridClassName =
    "lg:grid lg:grid-cols-[2.2fr_1.1fr_1.1fr_0.8fr_1fr_1fr] lg:items-center lg:gap-4";
  const recordsDesktopSpacingClassName = "lg:px-5";
  const detailDialogPanelClassName = `${ui.modal} relative w-full max-w-5xl overflow-hidden rounded-[28px] shadow-[0_32px_90px_rgba(0,0,0,0.34)]`;
  const detailSectionCardClassName = dark
    ? "rounded-[20px] border border-white/8 bg-white/[0.04] p-4"
    : "rounded-[20px] border border-white/60 bg-white/72 p-4";
  const detailValueClassName = dark ? "text-[#E6EDF3]" : "text-slate-900";
  const detailLabelClassName = dark
    ? "text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:rgba(151,166,168,0.82)]"
    : "text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500";
  const detailMutedCardClassName = dark
    ? "rounded-[18px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[color:rgba(151,166,168,0.88)]"
    : "rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500";
  const { user, loading: loadingUser } = useAuth();
  const searchParams = useSearchParams();
  const startDateParam = searchParams.get("startDate") || "";

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailBooking, setDetailBooking] = useState<BookingRow | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [trailFilter, setTrailFilter] = useState("All Trails");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("All");
  const [approvalFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const deferredSearchFilter = useDeferredValue(searchFilter);
  const [form, setForm] = useState<BookingFormPayload>(createEmptyForm());
  const isOffSeasonLike = isOffSeasonLikeType(form.booking_type);
  const showParticipantCategory = !isOffSeasonLike;
  const showTrail = !isOffSeasonLike;
  const showPax = !isOffSeasonLike;
  const showStatusControls = !isOffSeasonLike;
  const isEditDialogOpen = editingId !== null;
  const normalizedRole = useMemo(() => normalizeRole(user?.role), [user?.role]);
  const isAdmin = normalizedRole === "admin";
  const canViewBookings = normalizedRole === "admin" || normalizedRole === "co_admin" || normalizedRole === "registered_staff" || normalizedRole === "staff";
  const canCreateBookings = normalizedRole === "admin" || normalizedRole === "co_admin";
  const canEditBookings = normalizedRole === "admin";
  const canDeleteBookings = normalizedRole === "admin";

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
    setPortalReady(true);
  }, []);

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

  useEffect(() => {
    if (!submitSuccess) return;

    const timer = window.setTimeout(() => {
      setSubmitSuccess("");
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [submitSuccess]);

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
    const query = deferredSearchFilter.trim().toLowerCase();

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
  }, [
    approvalFilter,
    bookingTypeFilter,
    deferredSearchFilter,
    monthFilter,
    trailFilter,
    visibleRecordBookings,
  ]);

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

    if (isRegularBookingType(form.booking_type) && (scheduleDurationDays < 2 || scheduleDurationDays > 3)) {
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
    form.booking_type,
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

    setDetailBooking(null);
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

  async function handleDeleteBooking() {
    if (!deleteTargetId || !canDeleteBookings) return;

    try {
      setDeleting(true);
      setSubmitError("");
      setSubmitSuccess("");

      const res = await fetch(`/api/bookings?id=${deleteTargetId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = (await res.json().catch(() => null)) as ApiError | { booking_code?: string } | null;
      if (!res.ok) {
        setSubmitError((data as ApiError | null)?.error || "Failed to delete booking.");
        return;
      }

      await refreshBookings();
      if (editingId === deleteTargetId) {
        resetForm();
      }
      if (detailBooking?.id === deleteTargetId) {
        setDetailBooking(null);
      }
      setDeleteTargetId(null);
      setSubmitSuccess(
        `Booking ${(data as { booking_code?: string } | null)?.booking_code || ""} deleted successfully.`.trim()
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to delete booking.");
    } finally {
      setDeleting(false);
    }
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
  const bookingFormContent = (
    <>
      <div className="flex flex-col gap-2 border-b border-[var(--ui-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${ui.textSoft}`}>
            {isEditDialogOpen ? "Edit Booking" : "Booking Form"}
          </p>
          <h2 className={`mt-1.5 text-lg font-semibold sm:mt-2 sm:text-2xl ${ui.textMain}`}>
            {editingId ? "Edit booking record" : "Add booking record"}
          </h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          <p className={`max-w-md text-sm leading-6 ${ui.textMuted}`}>
            Use this form to create or update persisted booking records before filtering and reviewing the booking table below.
          </p>
          {isEditDialogOpen && (
            <button
              type="button"
              onClick={resetForm}
              className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${ui.buttonSecondary}`}
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className={`mt-4 px-4 py-3 text-sm ${panelSoftClassName} ${ui.textMuted}`}>
        <span className={`font-semibold ${ui.textMain}`}>Booking Code:</span>{" "}
        {editingId
          ? bookings.find((booking) => booking.id === editingId)?.booking_code || "Unavailable"
          : "Auto-generated on save using the MHRWS-YYYY-XXXX format."}
      </div>

      {submitError && (
        <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      )}

      <div className={`mt-4 grid gap-3 ${isOffSeasonLike ? "xl:grid-cols-[1.15fr_0.85fr]" : "lg:grid-cols-[1.25fr_0.75fr]"}`}>
        <div className={`${cleanPanelClassName} p-3.5 sm:p-4`}>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>
            Booking Details
          </p>
          <div className="mt-4 grid max-h-[34rem] gap-2.5 overflow-y-auto pr-1 [scrollbar-color:#c8d8cf_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#c8d8cf] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
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
                <div className="grid items-start gap-3 md:grid-cols-2 lg:grid-cols-12">
                  <div className="lg:col-span-4 lg:pt-[1.625rem]">
                    <FloatingInput
                      label="Guest Name"
                      value={form.contact_name}
                      onChange={(value) => setField("contact_name", value)}
                    />
                  </div>
                  <div className="lg:col-span-3">
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
                    <div className="lg:col-span-2">
                      <LabeledSelect
                        label="Category"
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
                    <div className="lg:col-span-3">
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

                <div className={`${cleanPanelSoftClassName} p-3 lg:p-4`}>
                  <div className={`grid items-start gap-2.5 md:grid-cols-2 ${showPax ? "xl:grid-cols-12" : "xl:grid-cols-8"}`}>
                    <div className="xl:col-span-4">
                      <LabeledInput
                        label="Start Date"
                        type="date"
                        value={form.start_date}
                        onChange={(value) => setField("start_date", value)}
                        helper={
                          isRegularBookingType(form.booking_type)
                            ? "First hiking day (2-3 day schedule)"
                            : "First hiking day"
                        }
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
                      <div className="xl:col-span-4 xl:pt-[1.625rem]">
                        <FloatingInput
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
          <div className={`${cleanPanelClassName} p-3.5 sm:p-4`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>
              {form.booking_type}
            </p>
            <div className={`mt-3 p-5 ${cleanPanelSoftClassName}`}>
              <p className={`text-base font-semibold ${ui.textMain}`}>
                Selected dates will be marked unavailable.
              </p>
              <p className={`mt-3 text-sm leading-7 ${ui.textMuted}`}>
                {form.booking_type} uses the closure-style form. Participant category, trail, pax, and status fields stay hidden while the selected date range is recorded for schedule management.
              </p>
            </div>

            <div className="mt-4">
              <FloatingTextarea
                label="Remarks"
                value={form.remarks}
                onChange={(value) => setField("remarks", value)}
                rows={4}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button type="submit" disabled={(editingId ? !canEditBookings : !canCreateBookings) || submitting} className="app-primary-button inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? "Saving..." : editingId ? `Update ${form.booking_type}` : `Create ${form.booking_type}`}
              </button>
              <button type="button" onClick={resetForm} className={`app-glass-button inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition ${ui.buttonSecondary}`}>
                {editingId ? "Cancel Edit" : "Reset"}
              </button>
            </div>
          </div>
        ) : (
          <div className={`${cleanPanelClassName} p-3.5 sm:p-4`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>
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
              <FloatingTextarea
                label="Remarks"
                value={form.remarks}
                onChange={(value) => setField("remarks", value)}
                rows={3}
                className="sm:col-span-2"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button type="submit" disabled={regularSubmitDisabled} className="app-primary-button inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
                {submitting
                  ? "Saving..."
                  : capacityState.kind === "invalid" &&
                      capacityState.title === "Camp 3 at capacity"
                    ? "Camp 3 Full"
                    : editingId
                      ? "Update Booking"
                      : "Create Booking"}
              </button>
              <button type="button" onClick={resetForm} className={`app-glass-button inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition ${ui.buttonSecondary}`}>
                {editingId ? "Cancel Edit" : "Reset"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const detailEditButtonClassName = dark
    ? `${compactTableActionBaseClassName} border-white/10 bg-[rgba(255,255,255,0.08)] text-[#E6EDF3] [&_svg]:text-inherit`
    : `${compactTableActionBaseClassName} border-slate-200/80 bg-[#F3F4F6] text-[#1F2937] [&_svg]:text-inherit`;
  const detailDeleteButtonClassName = dark
    ? `${compactTableActionBaseClassName} border-[rgba(220,38,38,0.26)] bg-[rgba(220,38,38,0.22)] text-[#FEE2E2] [&_svg]:text-inherit`
    : `${compactTableActionBaseClassName} border-[rgba(220,38,38,0.18)] bg-[rgba(220,38,38,0.12)] text-[#991B1B] [&_svg]:text-inherit`;
  const bookingNativeOptionStyle = dark
    ? { backgroundColor: "#F8FAFC", color: "#0F172A" }
    : undefined;
  const recordsTable = useMemo(
    () => (
      <div className={`mt-5 overflow-hidden rounded-[22px] ${ui.tableWrap}`}>
        <div className="hidden overflow-y-hidden booking-scroll-gutter lg:block">
          <div className={`${recordsDesktopGridClassName} ${recordsDesktopSpacingClassName} py-3 text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.tableHead}`}>
            <span>Guest Name</span>
            <span>Category</span>
            <span>Trail</span>
            <span>Pax</span>
            <span>Start Date</span>
            <span>End Date</span>
          </div>
        </div>

        {loading ? (
          <div className={`px-5 py-8 text-sm ${ui.textMuted}`}>Loading booking records...</div>
        ) : filteredBookings.length === 0 ? (
          <div className={`px-5 py-8 text-sm ${ui.textMuted}`}>No booking records match the current filters.</div>
        ) : (
          <div className={`scroll-docs booking-scroll-gutter ${filteredBookings.length > 6 ? "max-h-[456px] overflow-y-auto" : ""}`}>
            <div className={recordsDividerClassName}>
              {filteredBookings.map((row) => (
                <article key={row.id}>
                  <button
                    type="button"
                    onClick={() => setDetailBooking(row)}
                    className={`grid w-full gap-3 px-4 py-4 text-left transition lg:hidden ${
                      dark
                        ? "hover:bg-white/[0.04] focus-visible:bg-white/[0.04]"
                        : "hover:bg-slate-50/80 focus-visible:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2.5">
                      <div>
                        <p className={`text-sm font-semibold ${ui.textMain}`}>{row.contact_name}</p>
                        <p className={`mt-1 text-xs leading-5 ${ui.textMuted}`}>
                          {isOffSeasonLikeType(row.booking_type) ? "Closure" : row.participant_category}
                        </p>
                      </div>
                      {isOffSeasonLikeType(row.booking_type) ? (
                        <span className={`text-xs ${recordsMetaTextClassName}`}>All trails</span>
                      ) : (
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${trailPillTone(row.trail)}`}>
                          {row.trail === "San Isidro Trail" ? "San Isidro" : "Governor Generoso"}
                        </span>
                      )}
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-4">
                      <div className={`${cleanPanelSoftClassName} p-3`}>
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${ui.textSoft}`}>Category</p>
                        <p className={`mt-1.5 text-sm ${ui.textMain}`}>
                          {isOffSeasonLikeType(row.booking_type) ? "Closure" : row.participant_category}
                        </p>
                      </div>
                      <div className={`${cleanPanelSoftClassName} p-3`}>
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${ui.textSoft}`}>Pax</p>
                        <p className={`mt-1.5 text-sm ${ui.textMain}`}>{isOffSeasonLikeType(row.booking_type) ? "Closure" : row.pax}</p>
                      </div>
                      <div className={`${cleanPanelSoftClassName} p-3`}>
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${ui.textSoft}`}>Start</p>
                        <p className={`mt-1.5 text-sm ${ui.textMain}`}>{row.start_date}</p>
                      </div>
                      <div className={`${cleanPanelSoftClassName} p-3`}>
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${ui.textSoft}`}>End</p>
                        <p className={`mt-1.5 text-sm ${ui.textMain}`}>{row.end_date}</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailBooking(row)}
                    className={`hidden w-full ${recordsDesktopGridClassName} ${recordsDesktopSpacingClassName} py-5 text-sm text-left transition lg:grid ${
                      dark
                        ? "hover:bg-white/[0.04] focus-visible:bg-white/[0.04]"
                        : "hover:bg-slate-50/80 focus-visible:bg-slate-50/80"
                    } ${recordsRowTextClassName}`}
                  >
                    <div>
                      <p className={`font-medium ${ui.textMain}`}>{row.contact_name}</p>
                      <p className={`mt-1 text-xs ${recordsMetaTextClassName}`}>{row.booking_code}</p>
                    </div>
                    <span>{isOffSeasonLikeType(row.booking_type) ? "Closure" : row.participant_category}</span>
                    {isOffSeasonLikeType(row.booking_type) ? (
                      <span className={recordsMetaTextClassName}>All trails</span>
                    ) : (
                      <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${trailPillTone(row.trail)}`}>
                        {row.trail === "San Isidro Trail" ? "San Isidro" : "Governor Generoso"}
                      </span>
                    )}
                    <span>{isOffSeasonLikeType(row.booking_type) ? "Closure" : row.pax}</span>
                    <span>{row.start_date}</span>
                    <span>{row.end_date}</span>
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    ),
    [
      cleanPanelSoftClassName,
      dark,
      filteredBookings,
      loading,
      recordsDesktopGridClassName,
      recordsDesktopSpacingClassName,
      recordsDividerClassName,
      recordsMetaTextClassName,
      recordsRowTextClassName,
      setDetailBooking,
      ui.tableHead,
      ui.tableWrap,
      ui.textMain,
      ui.textMuted,
      ui.textSoft,
    ]
  );

  return (
    <section className={`min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8 ${ui.page}`}>
      <AnimatePresence>
        {submitSuccess ? (
          <motion.div
            key={submitSuccess}
            initial={{ opacity: 0, x: 18, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 18, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-none fixed right-4 top-4 z-[95] w-full max-w-sm sm:right-6 sm:top-6"
          >
            <div
              className={`pointer-events-auto rounded-[22px] border px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl ${
                dark
                  ? "border-emerald-300/18 bg-[rgba(15,23,42,0.84)] text-emerald-100"
                  : "border-emerald-200/80 bg-[rgba(255,255,255,0.88)] text-emerald-700"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-500/90">
                Success
              </p>
              <p className="mt-1 text-sm font-medium leading-6">{submitSuccess}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl">
        <div className={`${ui.card} rounded-[34px] p-5 md:p-7`}>
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--ui-accent-soft)]">
              Booking Transactions
            </p>
            <h1 className={`mt-3 text-[1.7rem] font-semibold tracking-tight sm:text-3xl md:text-5xl ${ui.textMain}`}>
              Booking
            </h1>
            <p className={`mt-3 max-w-3xl text-sm leading-6 md:text-base md:leading-7 ${ui.textMuted}`}>
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
                className={`${ui.cardSoft} p-4 sm:p-5`}
              >
                <div className={`h-1.5 w-16 rounded-full ${card.accent}`} />
                <p className={`mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] sm:mt-4 sm:text-[11px] ${ui.textSoft}`}>
                  {card.label}
                </p>
                <p className={`mt-2 text-2xl font-semibold tracking-[-0.03em] sm:mt-3 sm:text-3xl ${ui.textMain}`}>
                  {card.value}
                </p>
                <p className={`mt-1.5 text-sm leading-6 sm:mt-2 ${ui.textMuted}`}>{card.note}</p>
              </article>
            ))}
          </div>

          {isEditDialogOpen && portalReady
            ? createPortal(
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    data-protected-theme={theme}
                    className="fixed inset-0 z-[79] flex items-center justify-center p-3 sm:p-4 md:p-6"
                  >
                    <motion.button
                      type="button"
                      aria-label="Close edit dialog"
                      onClick={resetForm}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className={`absolute inset-0 ${dialogOverlayClassName}`}
                    />
                    <motion.form
                      onSubmit={handleSubmit}
                      initial={{ opacity: 0, scale: 0.985, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.985, y: 10 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className={`relative z-[80] max-h-[calc(100vh-1.5rem)] w-full max-w-6xl overflow-y-auto p-4 shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:max-h-[calc(100vh-2rem)] sm:p-5 md:max-h-[calc(100vh-3rem)] md:p-6 ${sectionShellClassName}`}
                    >
                      {bookingFormContent}
                    </motion.form>
                  </motion.div>
                </AnimatePresence>,
                document.body
              )
            : (
              <motion.form
                onSubmit={handleSubmit}
                initial={false}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`mt-5 ${cleanSectionShellClassName}`}
              >
                {bookingFormContent}
              </motion.form>
            )}

          <div className={`mt-5 ${cleanSectionShellClassName}`}>
            <div className="flex flex-col gap-2 border-b border-[var(--ui-border)] pb-3 sm:flex-row sm:items-end sm:justify-between sm:pb-4">
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${ui.textSoft}`}>
                  Booking Records
                </p>
                <h2 className={`mt-1.5 text-lg font-semibold sm:mt-2 sm:text-2xl ${ui.textMain}`}>
                  Filters and records
                </h2>
              </div>
              <p className={`max-w-md text-sm leading-6 ${ui.textMuted}`}>
                Booking conflicts are based on Camp 3 first-night overlap, not full date-range matching.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 items-end gap-2.5 sm:gap-3 lg:grid-cols-[1.15fr_1fr_1fr_1fr]">
              <label className={`col-span-2 p-3 sm:p-4 lg:col-span-1 ${cleanPanelSoftClassName}`}>
                <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>Search</span>
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(event) => setSearchFilter(event.target.value)}
                  placeholder="Booking code, guest name, type, trail..."
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--ui-border)] bg-white/[0.05] px-3 text-sm text-[var(--ui-text-main)] outline-none transition placeholder:text-[color:rgba(151,166,168,0.82)] focus:border-[#395C7A] focus:bg-white/[0.08] focus:ring-4 focus:ring-[#395C7A]/18"
                />
              </label>

              <label className={`p-3 sm:p-4 ${cleanPanelSoftClassName}`}>
                <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>Trail</span>
                <select value={trailFilter} onChange={(event) => setTrailFilter(event.target.value)} className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--ui-border)] bg-white/[0.05] px-3 text-sm text-[var(--ui-text-main)] outline-none">
                  <option style={bookingNativeOptionStyle}>All Trails</option>
                  {TRAIL_OPTIONS.map((option) => (
                    <option key={option} value={option} style={bookingNativeOptionStyle}>{option}</option>
                  ))}
                </select>
              </label>

              <label className={`p-3 sm:p-4 ${cleanPanelSoftClassName}`}>
                <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>Booking Type</span>
                <select value={bookingTypeFilter} onChange={(event) => setBookingTypeFilter(event.target.value)} className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--ui-border)] bg-white/[0.05] px-3 text-sm text-[var(--ui-text-main)] outline-none">
                  <option style={bookingNativeOptionStyle}>All</option>
                  {visibleBookingTypeOptions.map((option) => (
                    <option key={option} value={option} style={bookingNativeOptionStyle}>{option}</option>
                  ))}
                </select>
              </label>

              <label className={`col-span-2 p-3 sm:col-span-1 sm:p-4 ${cleanPanelSoftClassName}`}>
                <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.textSoft}`}>Month</span>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(event) => setMonthFilter(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--ui-border)] bg-white/[0.05] px-3 text-sm text-[var(--ui-text-main)] outline-none"
                />
              </label>

            </div>

            {recordsTable}
          </div>
        </div>
      </div>

      {detailBooking && portalReady
        ? createPortal(
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                data-protected-theme={theme}
                className="fixed inset-0 z-[81] flex items-center justify-center p-3 sm:p-4 md:p-6"
              >
                <motion.button
                  type="button"
                  aria-label="Close booking details"
                  onClick={() => setDetailBooking(null)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className={`absolute inset-0 ${dialogOverlayClassName}`}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.985, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.985, y: 10 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={`scroll-docs relative z-[82] max-h-[calc(100vh-1.5rem)] w-full overflow-y-auto p-4 sm:max-h-[calc(100vh-2rem)] sm:p-5 md:max-h-[calc(100vh-3rem)] md:p-6 ${detailDialogPanelClassName}`}
                >
                  <div className="flex items-start justify-between gap-4 border-b border-[var(--ui-border)] pb-4 sm:pb-5">
                    <div>
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${ui.textSoft}`}>
                        Booking details
                      </p>
                      <h3 className={`mt-2 text-xl font-semibold tracking-tight sm:text-2xl ${ui.textMain}`}>
                        {detailBooking.contact_name}
                      </h3>
                      <p className={`mt-2 text-sm leading-6 ${ui.textMuted}`}>
                        Review the booking summary, status signals, and record timestamps.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailBooking(null)}
                      className={`${ui.buttonSecondary} inline-flex h-11 w-11 items-center justify-center rounded-full p-0`}
                      aria-label="Close booking details dialog"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-[1.18fr_0.82fr] xl:items-start">
                    <div className="grid gap-4">
                      <section className={detailSectionCardClassName}>
                        <p className={detailLabelClassName}>Primary Info</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className={detailLabelClassName}>Booking Code</p>
                            <p className={`mt-1.5 text-base font-semibold ${detailValueClassName}`}>
                              {detailBooking.booking_code}
                            </p>
                          </div>
                          <div>
                            <p className={detailLabelClassName}>Guest Name</p>
                            <p className={`mt-1.5 text-base font-semibold ${detailValueClassName}`}>
                              {detailBooking.contact_name}
                            </p>
                          </div>
                          <div>
                            <p className={detailLabelClassName}>Booking Type</p>
                            <p className={`mt-1.5 text-sm ${detailValueClassName}`}>
                              {detailBooking.booking_type}
                            </p>
                          </div>
                          <div>
                            <p className={detailLabelClassName}>Category</p>
                            <p className={`mt-1.5 text-sm ${detailValueClassName}`}>
                              {isOffSeasonLikeType(detailBooking.booking_type)
                                ? "Closure"
                                : detailBooking.participant_category}
                            </p>
                          </div>
                        </div>
                      </section>

                      <section className={detailSectionCardClassName}>
                        <p className={detailLabelClassName}>Schedule</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className={detailLabelClassName}>Trail</p>
                            <div className="mt-1.5">
                              {isOffSeasonLikeType(detailBooking.booking_type) ? (
                                <p className={`text-sm ${detailValueClassName}`}>All trails</p>
                              ) : (
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${trailPillTone(detailBooking.trail)}`}>
                                  {detailBooking.trail}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className={detailLabelClassName}>Participants / Pax</p>
                            <p className={`mt-1.5 text-sm ${detailValueClassName}`}>
                              {isOffSeasonLikeType(detailBooking.booking_type)
                                ? "Closure"
                                : detailBooking.pax}
                            </p>
                          </div>
                          <div>
                            <p className={detailLabelClassName}>Start Date</p>
                            <p className={`mt-1.5 text-sm ${detailValueClassName}`}>
                              {formatDisplayDate(detailBooking.start_date)}
                            </p>
                          </div>
                          <div>
                            <p className={detailLabelClassName}>End Date</p>
                            <p className={`mt-1.5 text-sm ${detailValueClassName}`}>
                              {formatDisplayDate(detailBooking.end_date)}
                            </p>
                          </div>
                        </div>
                      </section>
                    </div>

                    <div className="grid gap-4">
                      <section className={detailSectionCardClassName}>
                        <p className={detailLabelClassName}>Statuses</p>
                        <div className="mt-4 grid gap-3">
                          <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--ui-border)] px-4 py-3">
                            <span className={`text-sm ${detailValueClassName}`}>Payment</span>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone[detailBooking.payment_status]}`}>
                              {detailBooking.payment_status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--ui-border)] px-4 py-3">
                            <span className={`text-sm ${detailValueClassName}`}>Approval</span>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone[detailBooking.approval_status]}`}>
                              {detailBooking.approval_status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--ui-border)] px-4 py-3">
                            <span className={`text-sm ${detailValueClassName}`}>Booking Status</span>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone[detailBooking.booking_status]}`}>
                              {detailBooking.booking_status}
                            </span>
                          </div>
                        </div>
                      </section>
                      <section className={`${detailSectionCardClassName} xl:min-h-full`}>
                        <p className={detailLabelClassName}>Record Metadata</p>
                        <div className="mt-4 space-y-4">
                          <div>
                            <p className={detailLabelClassName}>Created</p>
                            <p className={`mt-1.5 text-sm ${detailValueClassName}`}>
                              {detailBooking.created_at
                                ? new Date(detailBooking.created_at).toLocaleString()
                                : "Not available"}
                            </p>
                          </div>
                          <div>
                            <p className={detailLabelClassName}>Last Updated</p>
                            <p className={`mt-1.5 text-sm ${detailValueClassName}`}>
                              {detailBooking.updated_at
                                ? new Date(detailBooking.updated_at).toLocaleString()
                                : "Not available"}
                            </p>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>

                  <section className={`${detailSectionCardClassName} mt-4`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <div>
                        <p className={detailLabelClassName}>Actions</p>
                        <p className={`mt-1 text-sm ${ui.textMuted}`}>
                          Existing booking actions are available here without changing current behavior.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        {canEditBookings ? (
                          <button
                            type="button"
                            onClick={() => startEdit(detailBooking)}
                            className={detailEditButtonClassName}
                          >
                            <PencilSquareIcon />
                            Edit booking
                          </button>
                        ) : null}
                        {canDeleteBookings ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDetailBooking(null);
                              setDeleteTargetId(detailBooking.id);
                            }}
                            className={detailDeleteButtonClassName}
                          >
                            <TrashIcon />
                            Delete booking
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {!canEditBookings && !canDeleteBookings ? (
                      <div className={`mt-4 ${detailMutedCardClassName}`}>
                        You can review booking details here, but only authorized roles can edit or delete records.
                      </div>
                    ) : null}
                  </section>
                </motion.div>
              </motion.div>
            </AnimatePresence>,
            document.body
          )
        : null}

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Delete booking?"
        message="This will soft delete the booking record. It will be removed from the booking table, calendar, capacity checks, and reporting views."
        confirmText={deleting ? "Deleting..." : "Delete Booking"}
        cancelText="Cancel"
        danger
        loading={deleting}
        onCancel={() => {
          if (!deleting) setDeleteTargetId(null);
        }}
        onConfirm={handleDeleteBooking}
      />
    </section>
  );
}
