export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { getPublicCalendarDays } from "@/app/lib/bookings";

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function GET(req: NextRequest) {
  try {
    const month = req.nextUrl.searchParams.get("month") || getCurrentMonth();
    const days = await getPublicCalendarDays(month);
    return NextResponse.json(
      { days },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("PUBLIC CALENDAR GET ERROR:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load public calendar data.") },
      { status: 500 }
    );
  }
}
