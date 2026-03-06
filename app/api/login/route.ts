import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as any;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      SECRET,
      { expiresIn: "7d" }
    );

    const res = NextResponse.json({ success: true });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });

    return res;
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}