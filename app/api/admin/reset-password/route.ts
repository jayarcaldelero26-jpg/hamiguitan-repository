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

    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (String(newPassword).length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as any;
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const hashed = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE email = ?").run(hashed, email);

    return NextResponse.json({ success: true, email });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}