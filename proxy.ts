import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "auth_token";
const encoder = new TextEncoder();

async function hasValidAuthToken(token: string) {
  const secret = process.env.JWT_SECRET;

  if (!secret || !secret.trim()) {
    console.error("PROXY AUTH ERROR: JWT_SECRET is not configured.");
    return false;
  }

  try {
    await jwtVerify(token, encoder.encode(secret.trim()));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/api/auth/forgot-password")
  ) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const valid = await hasValidAuthToken(token);
  if (!valid) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/research/:path*",
    "/calendar/:path*",
    "/booking/:path*",
    "/porters-identification/:path*",
    "/organizational-chart/:path*",
    "/audit/:path*",
    "/upload/:path*",
    "/settings/:path*",
  ],
};
