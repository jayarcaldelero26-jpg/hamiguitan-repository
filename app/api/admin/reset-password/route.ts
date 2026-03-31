import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { supabaseAdmin } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/auth";
import { assertTrustedOrigin, isInvalidOriginError } from "@/app/lib/requestSecurity";

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);

    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (normalizeRole(me.role) !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const cleanEmail = String(body?.email || "").trim().toLowerCase();
    const cleanPassword = String(body?.newPassword || "");

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }

    if (cleanPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const { data: user, error: findError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (findError) {
      console.error("RESET PASSWORD FIND ERROR:", findError);
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const hashed = await bcrypt.hash(cleanPassword, 10);

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        password: hashed,
        mustChangePassword: 1,
      })
      .eq("email", cleanEmail);

    if (updateError) {
      console.error("RESET PASSWORD UPDATE ERROR:", updateError);
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    return NextResponse.json({ success: true, email: cleanEmail });
  } catch (error) {
    if (isInvalidOriginError(error)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
