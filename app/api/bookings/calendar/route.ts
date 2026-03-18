export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import { canViewBookings, getCalendarData, ALL_CATEGORIES } from "@/app/lib/bookings";
import { PARTICIPANT_CATEGORY_OPTIONS } from "@/app/lib/bookingTypes";

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canViewBookings(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const month = req.nextUrl.searchParams.get("month") || getCurrentMonth();
    const categoryParam = req.nextUrl.searchParams.get("category") || ALL_CATEGORIES;

    if (
      categoryParam !== ALL_CATEGORIES &&
      !PARTICIPANT_CATEGORY_OPTIONS.includes(categoryParam as (typeof PARTICIPANT_CATEGORY_OPTIONS)[number])
    ) {
      return NextResponse.json({ error: "Invalid participant category." }, { status: 400 });
    }

    const result = await getCalendarData(
      month,
      categoryParam as (typeof PARTICIPANT_CATEGORY_OPTIONS)[number] | typeof ALL_CATEGORIES
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("BOOKING CALENDAR GET ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load calendar data.") },
      { status: 500 }
    );
  }
}
