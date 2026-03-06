import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import db from "@/app/lib/db";

const SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const user = db
      .prepare("SELECT id, password FROM users WHERE id = ?")
      .get(payload.id) as any;

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });

    const hashed = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashed, payload.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}