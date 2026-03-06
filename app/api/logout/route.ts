import { NextResponse } from "next/server";

function clearCookie() {
  const res = NextResponse.json({ success: true });

  // ✅ delete cookie properly
  res.cookies.set("auth_token", "", {
    path: "/",
    maxAge: 0,
  });

  return res;
}

// support both
export async function GET() {
  return clearCookie();
}

export async function POST() {
  return clearCookie();
}