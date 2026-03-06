import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";

export async function GET() {
  try {
    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(me);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}