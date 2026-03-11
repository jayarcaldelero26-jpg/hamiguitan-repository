export const runtime = "nodejs";

import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/db";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email =
      typeof body?.email === "string" ? normalizeEmail(body.email) : "";
    const code =
      typeof body?.code === "string" ? body.code.trim() : "";

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .ilike("email", email)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid email or code." },
        { status: 400 }
      );
    }

    const { data: resetRow, error: resetError } = await supabaseAdmin
      .from("password_resets")
      .select("id, user_id, token, expires_at, verified")
      .eq("user_id", user.id)
      .eq("token", code)
      .maybeSingle();

    if (resetError || !resetRow) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 }
      );
    }

    const expiresAt = new Date(resetRow.expires_at);
    if (expiresAt.getTime() < Date.now()) {
      await supabaseAdmin
        .from("password_resets")
        .delete()
        .eq("id", resetRow.id);

      return NextResponse.json(
        { error: "Verification code expired. Please request a new one." },
        { status: 400 }
      );
    }

    const resetToken = randomBytes(32).toString("hex");

    const { error: updateError } = await supabaseAdmin
      .from("password_resets")
      .update({
        token: resetToken, // replace code with actual reset token
        verified: true,
      })
      .eq("id", resetRow.id);

    if (updateError) {
      console.error("VERIFY CODE UPDATE ERROR:", updateError);
      return NextResponse.json(
        { error: "Failed to verify code." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      token: resetToken,
      message: "Code verified successfully.",
    });
  } catch (error) {
    console.error("VERIFY RESET CODE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to verify reset code." },
      { status: 500 }
    );
  }
}