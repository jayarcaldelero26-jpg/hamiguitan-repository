import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/auth";

export async function GET() {
  try {
    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (me.role !== "admin" && me.role !== "co_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = db
      .prepare(
        `SELECT
          id,
          name,
          email,
          role,
          userCode,
          firstName,
          middleName,
          lastName,
          suffix,
          birthdate,
          employmentType,
          contact,
          position,
          department,
          createdAt
        FROM users
        ORDER BY id DESC`
      )
      .all();

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}