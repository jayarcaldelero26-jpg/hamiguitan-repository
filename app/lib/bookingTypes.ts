export const TRAIL_OPTIONS = [
  "San Isidro Trail",
  "Governor Generoso Trail",
] as const;

export const BOOKING_TYPE_OPTIONS = [
  "Regular Booking",
  "Special Climb",
  "Block Schedule",
  "Off Season",
] as const;

export const PARTICIPANT_CATEGORY_OPTIONS = [
  "DIY",
  "LNJT",
  "Distant Travelers",
  "Kapwa Hiker",
  "Organization / Group",
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  "Paid",
  "Unpaid",
  "No Transaction",
] as const;

export const APPROVAL_STATUS_OPTIONS = [
  "Pending Review",
  "PASu Approved",
  "Approved",
  "Rejected",
] as const;

export const BOOKING_STATUS_OPTIONS = [
  "Active",
  "Rescheduled",
  "Cancelled",
  "Completed",
] as const;

export type TrailOption = (typeof TRAIL_OPTIONS)[number];
export type BookingTypeOption = (typeof BOOKING_TYPE_OPTIONS)[number];
export type ParticipantCategoryOption = (typeof PARTICIPANT_CATEGORY_OPTIONS)[number];
export type PaymentStatusOption = (typeof PAYMENT_STATUS_OPTIONS)[number];
export type ApprovalStatusOption = (typeof APPROVAL_STATUS_OPTIONS)[number];
export type BookingStatusOption = (typeof BOOKING_STATUS_OPTIONS)[number];

export type BookingRow = {
  id: number;
  booking_code: string;
  contact_name: string;
  contact_number: string;
  email: string | null;
  organization_name: string | null;
  booking_type: BookingTypeOption;
  participant_category: ParticipantCategoryOption;
  start_date: string;
  end_date: string;
  trail: TrailOption;
  pax: number;
  payment_status: PaymentStatusOption;
  approval_status: ApprovalStatusOption;
  booking_status: BookingStatusOption;
  remarks: string;
  internal_notes: string | null;
  rescheduled_from: string | null;
  cancel_reason: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type BookingWritePayload = Omit<
  BookingRow,
  "id" | "created_at" | "updated_at"
>;

export type BookingFormPayload = Omit<BookingWritePayload, "booking_code">;

export type CalendarDayData = {
  date: string;
  day: string;
  sanIsidro: number;
  governorGeneroso: number;
  sanState: "available" | "limited" | "full" | "blocked";
  govState: "available" | "limited" | "full" | "blocked";
};

export type SelectedDateBooking = {
  id: number;
  booking_code: string;
  contact_name: string;
  participant_category: ParticipantCategoryOption;
  trail: TrailOption;
  pax: number;
  start_date: string;
  end_date: string;
  booking_type: BookingTypeOption;
  booking_status: BookingStatusOption;
  approval_status: ApprovalStatusOption;
  remarks: string;
};
