import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { supabaseAdmin, ensureAdminUser } from "@/app/lib/db";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

export async function POST(req: Request) {
  try {
    await ensureAdminUser();

    const body = await req.json();

    const userCode = String(body?.userCode || "").trim();

    const firstName = String(body?.firstName || "").trim();
    const middleName = String(body?.middleName || "").trim();
    const lastName = String(body?.lastName || "").trim();
    const suffix = String(body?.suffix || "").trim();
    const birthdate = String(body?.birthdate || "").trim();
    const employmentType = String(body?.employmentType || "").trim();

    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    const contact = String(body?.contact || "").trim();
    const department = String(body?.department || "").trim();
    const position = String(body?.position || "").trim();

    if (!firstName || !lastName || !birthdate || !employmentType || !email || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const { data: existingUser, error: findError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (findError) {
      console.error("REGISTER CHECK ERROR:", findError);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    const suffixText = suffix && suffix !== "None" ? `, ${suffix}` : "";
    const fullName = `${firstName}${middleName ? ` ${middleName}` : ""} ${lastName}${suffixText}`.trim();

    const { error: insertError } = await supabaseAdmin.from("users").insert([
      {
        name: fullName,
        email,
        password: hashed,
        role: "staff",

        userCode,
        firstName,
        middleName,
        lastName,
        suffix,
        birthdate,
        employmentType,

        contact,
        department,
        position,

        createdAt,
        mustChangePassword: 0,
      },
    ]);

    if (insertError) {
      console.error("REGISTER INSERT ERROR:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}