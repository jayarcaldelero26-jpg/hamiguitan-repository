import { NextResponse } from "next/server";

function clearCookie() {
  const res = NextResponse.json({ success: true });

  res.cookies.set("auth_token", "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });

  return res;
}

export async function GET() {
  return clearCookie();
}

export async function POST() {
  return clearCookie();
}