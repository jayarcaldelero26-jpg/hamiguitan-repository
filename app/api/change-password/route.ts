import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { supabaseAdmin } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/auth";
import { assertTrustedOrigin, isInvalidOriginError } from "@/app/lib/requestSecurity";

export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);

    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      .eq("id", me.id)
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
      .eq("id", me.id);

    if (updateError) {
      console.error("CHANGE PASSWORD UPDATE ERROR:", updateError);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (isInvalidOriginError(e)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    console.error("CHANGE PASSWORD ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
