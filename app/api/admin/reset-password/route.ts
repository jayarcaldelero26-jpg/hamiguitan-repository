import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { supabaseAdmin } from "@/app/lib/db";

const SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, newPassword } = await req.json();

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(newPassword || "");

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
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
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hashed = await bcrypt.hash(cleanPassword, 10);

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ password: hashed })
      .eq("email", cleanEmail);

    if (updateError) {
      console.error("RESET PASSWORD UPDATE ERROR:", updateError);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, email: cleanEmail });
  } catch (e) {
    console.error("RESET PASSWORD ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}