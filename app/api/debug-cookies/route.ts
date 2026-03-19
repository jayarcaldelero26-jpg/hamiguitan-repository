import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/app/lib/auth";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const me = await getCurrentUser();

  if (!me || String(me.role || "").trim().toLowerCase() !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const c = await cookies();
  return NextResponse.json({
    auth_token_exists: !!c.get("auth_token")?.value,
    all_cookie_names: c.getAll().map((x) => x.name),
  });
}
