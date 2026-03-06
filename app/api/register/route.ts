import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import db from "@/app/lib/db";

function isValidEmail(email: string) {
  // simple + solid email check
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const userCode = String(body?.userCode || "").trim();

    const firstName = String(body?.firstName || "").trim();
    const middleName = String(body?.middleName || "").trim();
    const lastName = String(body?.lastName || "").trim();
    const suffix = String(body?.suffix || "").trim(); // "None" or "Jr" etc
    const birthdate = String(body?.birthdate || "").trim(); // YYYY-MM-DD
    const employmentType = String(body?.employmentType || "").trim();

    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    const contact = String(body?.contact || "").trim();
    const department = String(body?.department || "").trim();
    const position = String(body?.position || "").trim();

    // required
    if (!firstName || !lastName || !birthdate || !employmentType || !email || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as any;
    if (exists) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    // build display name for current system compatibility
    const suffixText = suffix && suffix !== "None" ? `, ${suffix}` : "";
    const fullName = `${firstName}${middleName ? ` ${middleName}` : ""} ${lastName}${suffixText}`.trim();

    db.prepare(`
      INSERT INTO users (
        name, email, password, role,
        userCode, firstName, middleName, lastName, suffix, birthdate, employmentType,
        contact, department, position,
        createdAt, mustChangePassword
      )
      VALUES (
        ?, ?, ?, 'staff',
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, 0
      )
    `).run(
      fullName, email, hashed,
      userCode, firstName, middleName, lastName, suffix, birthdate, employmentType,
      contact, department, position,
      createdAt
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}