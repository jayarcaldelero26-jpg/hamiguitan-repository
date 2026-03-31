import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/db";
import { serverEnv } from "@/app/lib/serverEnv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const AUTH_COOKIE_NAME = "auth_token";
const JWT_EXPIRES_IN = "7d";
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;

type LoginRateLimitEntry = {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
};

const loginRateLimitStore = new Map<string, LoginRateLimitEntry>();

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

function getRateLimitKeys(req: Request, email: string) {
  const ip = getClientIp(req);
  return [`ip:${ip}`, `email:${email}`];
}

function getActiveRateLimitEntry(key: string, now: number) {
  const entry = loginRateLimitStore.get(key);
  if (!entry) return null;

  if (entry.blockedUntil && entry.blockedUntil > now) {
    return entry;
  }

  if (now - entry.firstAttemptAt >= LOGIN_RATE_LIMIT_WINDOW_MS) {
    loginRateLimitStore.delete(key);
    return null;
  }

  if (entry.blockedUntil && entry.blockedUntil <= now) {
    loginRateLimitStore.delete(key);
    return null;
  }

  return entry;
}

function isRateLimited(key: string, now: number) {
  const entry = getActiveRateLimitEntry(key, now);
  return Boolean(entry?.blockedUntil && entry.blockedUntil > now);
}

function registerFailedAttempt(key: string, now: number) {
  const existing = getActiveRateLimitEntry(key, now);

  if (!existing) {
    loginRateLimitStore.set(key, {
      count: 1,
      firstAttemptAt: now,
      blockedUntil: null,
    });
    return;
  }

  const nextCount = existing.count + 1;
  const blockedUntil =
    nextCount >= LOGIN_RATE_LIMIT_MAX_ATTEMPTS ? now + LOGIN_RATE_LIMIT_WINDOW_MS : null;

  loginRateLimitStore.set(key, {
    count: nextCount,
    firstAttemptAt: existing.firstAttemptAt,
    blockedUntil,
  });
}

function clearRateLimitKey(key: string) {
  loginRateLimitStore.delete(key);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const cleanEmail = String(body?.email || "").trim().toLowerCase();
    const cleanPassword = String(body?.password || "");
    const now = Date.now();

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const rateLimitKeys = getRateLimitKeys(req, cleanEmail);
    if (rateLimitKeys.some((key) => isRateLimited(key, now))) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, role, password, mustChangePassword")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (error) {
      console.error("LOGIN FETCH ERROR:", error);
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    if (!user) {
      rateLimitKeys.forEach((key) => registerFailedAttempt(key, now));
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "Account password is not properly configured." },
        { status: 500 }
      );
    }

    const match = await bcrypt.compare(cleanPassword, user.password);

    if (!match) {
      rateLimitKeys.forEach((key) => registerFailedAttempt(key, now));
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      serverEnv.jwtSecret,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        mustChangePassword: user.mustChangePassword ?? 0,
      },
    });

    rateLimitKeys.forEach(clearRateLimitKey);

    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
      expires: new Date(now + AUTH_COOKIE_MAX_AGE_SECONDS * 1000),
    });

    return res;
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
