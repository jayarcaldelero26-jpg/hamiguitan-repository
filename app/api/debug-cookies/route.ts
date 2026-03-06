import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const c = await cookies();
  return NextResponse.json({
    auth_token_exists: !!c.get("auth_token")?.value,
    all_cookie_names: c.getAll().map((x) => x.name),
  });
}