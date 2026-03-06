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

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (String(newPassword).length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const { data: user, error: findError } = await supabaseAdmin
      .from("users")
      .select("id, password")
      .eq("id", payload.id)
      .maybeSingle();

    if (findError) {
      console.error("CHANGE PASSWORD FIND ERROR:", findError);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ password: hashed })
      .eq("id", payload.id);

    if (updateError) {
      console.error("CHANGE PASSWORD UPDATE ERROR:", updateError);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("CHANGE PASSWORD ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}