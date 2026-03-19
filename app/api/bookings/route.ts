export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import { writeAuditLog } from "@/app/lib/auditLog";
import {
  canCreateBookings,
  canDeleteBookings,
  canEditBookings,
  canViewBookings,
  createBooking,
  findOffSeasonOverlaps,
  getBookingById,
  getConflictMessage,
  getOffSeasonConflictMessage,
  listBookings,
  softDeleteBooking,
  updateBooking,
  validateBookingCapacity,
  validateBookingPayload,
} from "@/app/lib/bookings";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function GET() {
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canViewBookings(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rows = await listBookings();
    return NextResponse.json(rows);
  } catch (error) {
    console.error("BOOKINGS GET ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load bookings.") },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canCreateBookings(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = validateBookingPayload(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    if (validated.payload.booking_type === "Off Season" && !canEditBookings(me.role)) {
      return NextResponse.json({ error: "Only admin can create Off Season closures." }, { status: 403 });
    }

    if (validated.payload.booking_type !== "Off Season") {
      const overlaps = await findOffSeasonOverlaps({
        start_date: validated.payload.start_date,
        end_date: validated.payload.end_date,
      });

      if (overlaps.length > 0) {
        return NextResponse.json(
          {
            error: getOffSeasonConflictMessage(overlaps),
            offSeasonClosures: overlaps,
          },
          { status: 409 }
        );
      }
    }

    const capacity = await validateBookingCapacity({
      start_date: validated.payload.start_date,
      end_date: validated.payload.end_date,
      trail: validated.payload.trail,
      pax: validated.payload.pax,
    });

    if (!capacity.ok) {
      return NextResponse.json(
        {
          error: getConflictMessage(validated.payload.trail, capacity.conflictingDates),
          conflictingDates: capacity.conflictingDates,
        },
        { status: 409 }
      );
    }

    const booking = await createBooking(validated.payload);

    await writeAuditLog({
      userId: me.id,
      userEmail: me.email,
      action: "booking_create",
      fileName: booking.booking_code,
      fromPath: null,
      toPath: `${booking.trail} | ${booking.start_date} -> ${booking.end_date}`,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("BOOKING CREATE ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to create booking.") },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canEditBookings(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const id = Number(body?.id);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid booking id." }, { status: 400 });
    }

    const existing = await getBookingById(id);
    if (!existing) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const validated = validateBookingPayload(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    if (validated.payload.booking_type !== "Off Season") {
      const overlaps = await findOffSeasonOverlaps({
        start_date: validated.payload.start_date,
        end_date: validated.payload.end_date,
        excludeBookingId: id,
      });

      if (overlaps.length > 0) {
        return NextResponse.json(
          {
            error: getOffSeasonConflictMessage(overlaps),
            offSeasonClosures: overlaps,
          },
          { status: 409 }
        );
      }
    }

    const capacity = await validateBookingCapacity({
      start_date: validated.payload.start_date,
      end_date: validated.payload.end_date,
      trail: validated.payload.trail,
      pax: validated.payload.pax,
      excludeBookingId: id,
    });

    if (!capacity.ok) {
      return NextResponse.json(
        {
          error: getConflictMessage(validated.payload.trail, capacity.conflictingDates),
          conflictingDates: capacity.conflictingDates,
        },
        { status: 409 }
      );
    }

    const booking = await updateBooking(id, {
      ...validated.payload,
      booking_code: existing.booking_code,
    });

    await writeAuditLog({
      userId: me.id,
      userEmail: me.email,
      action: "booking_update",
      fileName: booking.booking_code,
      fromPath: `${existing.trail} | ${existing.start_date} -> ${existing.end_date}`,
      toPath: `${booking.trail} | ${booking.start_date} -> ${booking.end_date}`,
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("BOOKING UPDATE ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to update booking.") },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canDeleteBookings(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid booking id." }, { status: 400 });
    }

    const existing = await getBookingById(id);
    if (!existing) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const deleted = await softDeleteBooking(id, me.id);
    if (!deleted) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    await writeAuditLog({
      userId: me.id,
      userEmail: me.email,
      action: "booking_soft_delete",
      fileName: deleted.booking_code,
      fromPath: `${deleted.trail} | ${deleted.start_date} -> ${deleted.end_date}`,
      toPath: "soft_deleted",
    });

    return NextResponse.json({
      ok: true,
      id: deleted.id,
      booking_code: deleted.booking_code,
    });
  } catch (error) {
    console.error("BOOKING DELETE ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to delete booking.") },
      { status: 500 }
    );
  }
}
