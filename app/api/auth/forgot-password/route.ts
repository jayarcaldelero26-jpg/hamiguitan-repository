export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { supabaseAdmin } from "@/app/lib/db";
import { sendResetCodeEmail } from "@/app/lib/mailer";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email =
      typeof body?.email === "string" ? normalizeEmail(body.email) : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .ilike("email", email)
      .maybeSingle();

    if (userError) {
      console.error("FORGOT PASSWORD USER LOOKUP ERROR:", userError);
      return NextResponse.json(
        { error: "Failed to process request." },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "If the email exists, a verification code has been sent.",
      });
    }

    const code = makeCode();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: deleteError } = await supabaseAdmin
      .from("password_resets")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("DELETE OLD TOKENS ERROR:", deleteError);
      return NextResponse.json(
        { error: "Failed to process request." },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabaseAdmin
      .from("password_resets")
      .insert({
        user_id: user.id,
        token: hashedCode,
        expires_at: expiresAt,
        verified: false,
      });

    if (insertError) {
      console.error("INSERT RESET CODE ERROR:", insertError);
      return NextResponse.json(
        { error: "Failed to process request." },
        { status: 500 }
      );
    }

    try {
      await sendResetCodeEmail(user.email, code);
    } catch (mailError) {
      console.error("SEND RESET CODE EMAIL ERROR:", mailError);

      await supabaseAdmin
        .from("password_resets")
        .delete()
        .eq("user_id", user.id);

      return NextResponse.json(
        { error: "Failed to send verification code." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "If the email exists, a verification code has been sent.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return NextResponse.json(
      { error: "Failed to process forgot password request." },
      { status: 500 }
    );
  }
}