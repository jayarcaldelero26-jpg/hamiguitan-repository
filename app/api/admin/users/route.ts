import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (me.role !== "admin" && me.role !== "co_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select(
        [
          "id",
          "name",
          "email",
          "role",
          "userCode",
          "employmentType",
          "contact",
          "position",
          "department",
          "createdAt",
        ].join(",")
      )
      .order("id", { ascending: false });

    if (error) {
      console.error("USERS FETCH ERROR:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    return NextResponse.json(
      { users: data || [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (e) {
    console.error("USERS ROUTE ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}