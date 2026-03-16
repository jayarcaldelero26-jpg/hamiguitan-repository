import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { supabaseAdmin } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeOptional(value: unknown) {
  return normalizeSpaces(String(value || ""));
}

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (me.role !== "admin" && me.role !== "co_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const userCode = normalizeOptional(body?.userCode);

    const firstName = normalizeOptional(body?.firstName);
    const middleName = normalizeOptional(body?.middleName);
    const lastName = normalizeOptional(body?.lastName);
    const suffix = normalizeOptional(body?.suffix);
    const birthdate = normalizeOptional(body?.birthdate);
    const employmentType = normalizeOptional(body?.employmentType);

    const email = normalizeOptional(body?.email).toLowerCase();
    const password = String(body?.password || "");

    const contact = normalizeOptional(body?.contact);
    const department = normalizeOptional(body?.department);
    const position = normalizeOptional(body?.position);

    if (!firstName || !lastName || !birthdate || !employmentType || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
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
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    const cleanSuffix = suffix && suffix !== "None" ? suffix : "";
    const fullName = normalizeSpaces(
      `${firstName}${middleName ? ` ${middleName}` : ""} ${lastName}${cleanSuffix ? `, ${cleanSuffix}` : ""}`
    );

    const { error: insertError } = await supabaseAdmin.from("users").insert([
      {
        name: fullName,
        email,
        password: hashed,
        role: "staff",

        userCode: userCode || null,
        firstName,
        middleName: middleName || null,
        lastName,
        suffix: cleanSuffix || null,
        birthdate,
        employmentType,

        contact: contact || null,
        department: department || null,
        position: position || null,

        createdAt,
        mustChangePassword: 1,
      },
    ]);

    if (insertError) {
      console.error("REGISTER INSERT ERROR:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to create user." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}