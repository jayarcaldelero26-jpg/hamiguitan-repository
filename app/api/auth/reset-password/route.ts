export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { supabaseAdmin } from "@/app/lib/db";

function isStrongPassword(password: string) {
  return typeof password === "string" && password.length >= 8;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json(
        { error: "Invalid reset token." },
        { status: 400 }
      );
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const { data: resetRow, error: tokenError } = await supabaseAdmin
      .from("password_resets")
      .select("id, user_id, expires_at, verified")
      .eq("token", token)
      .eq("verified", true)
      .maybeSingle();

    if (tokenError) {
      console.error("RESET TOKEN LOOKUP ERROR:", tokenError);
      return NextResponse.json(
        { error: "Failed to reset password." },
        { status: 500 }
      );
    }

    if (!resetRow) {
      return NextResponse.json(
        { error: "Invalid or expired reset session." },
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
        { error: "Reset session expired. Please request a new code." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", resetRow.user_id);

    if (updateError) {
      console.error("UPDATE PASSWORD ERROR:", updateError);
      return NextResponse.json(
        { error: "Failed to update password." },
        { status: 500 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("password_resets")
      .delete()
      .eq("id", resetRow.id);

    if (deleteError) {
      console.error("DELETE RESET TOKEN ERROR:", deleteError);
      return NextResponse.json(
        { error: "Password updated but cleanup failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json(
      { error: "Failed to reset password." },
      { status: 500 }
    );
  }
}