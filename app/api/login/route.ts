import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/db";
import { serverEnv } from "@/app/lib/serverEnv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const cleanEmail = String(body?.email || "").trim().toLowerCase();
    const cleanPassword = String(body?.password || "");

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, role, password, mustChangePassword")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (error) {
      console.error("LOGIN FETCH ERROR:", error);
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "Account password is not properly configured." },
        { status: 500 }
      );
    }

    const match = await bcrypt.compare(cleanPassword, user.password);

    if (!match) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      serverEnv.jwtSecret,
      { expiresIn: "7d" }
    );

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        mustChangePassword: user.mustChangePassword ?? 0,
      },
    });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
