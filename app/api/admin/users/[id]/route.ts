import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

const ALLOWED_ROLES = ["admin", "co_admin", "staff"];
const ALLOWED_EMPLOYMENT = ["Job Order", "Contract of Service", "Casual", "Permanent"];

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (me.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idRaw } = await context.params;
    const id = Number(idRaw);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const body = await req.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const role = String(body.role ?? "").trim();
    const position = String(body.position ?? "").trim();
    const department = String(body.department ?? "").trim();
    const employmentType = String(body.employmentType ?? "").trim();
    const contact = String(body.contact ?? "").trim();
    const birthdate = String(body.birthdate ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    if (employmentType && !ALLOWED_EMPLOYMENT.includes(employmentType)) {
      return NextResponse.json({ error: "Invalid employment type." }, { status: 400 });
    }

    const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const emailTaken = db
      .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
      .get(email, id) as any;

    if (emailTaken) {
      return NextResponse.json({ error: "Email already exists." }, { status: 400 });
    }

    if (existing.role === "admin" && role !== "admin") {
      const adminCount = db
        .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
        .get() as any;

      if (adminCount.count <= 1) {
        return NextResponse.json({ error: "Cannot demote the last admin." }, { status: 400 });
      }
    }

    const noChanges =
      String(existing.name ?? "").trim() === name &&
      String(existing.email ?? "").trim().toLowerCase() === email &&
      String(existing.role ?? "").trim() === role &&
      String(existing.position ?? "").trim() === String(position || "").trim() &&
      String(existing.department ?? "").trim() === String(department || "").trim() &&
      String(existing.employmentType ?? "").trim() === String(employmentType || "").trim() &&
      String(existing.contact ?? "").trim() === String(contact || "").trim() &&
      String(existing.birthdate ?? "").trim() === String(birthdate || "").trim();

    if (noChanges) {
      return NextResponse.json({
        success: true,
        unchanged: true,
        message: "No changes were made.",
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
          userCode: existing.userCode,
          firstName: existing.firstName,
          middleName: existing.middleName,
          lastName: existing.lastName,
          suffix: existing.suffix,
          birthdate: existing.birthdate,
          employmentType: existing.employmentType,
          contact: existing.contact,
          position: existing.position,
          department: existing.department,
          createdAt: existing.createdAt,
        },
      });
    }

    db.prepare(
      `UPDATE users
       SET
         name = ?,
         email = ?,
         role = ?,
         position = ?,
         department = ?,
         employmentType = ?,
         contact = ?,
         birthdate = ?
       WHERE id = ?`
    ).run(
      name,
      email,
      role,
      position || null,
      department || null,
      employmentType || null,
      contact || null,
      birthdate || null,
      id
    );

    const updated = db
      .prepare(
        `SELECT
          id,
          name,
          email,
          role,
          userCode,
          firstName,
          middleName,
          lastName,
          suffix,
          birthdate,
          employmentType,
          contact,
          position,
          department,
          createdAt
        FROM users
        WHERE id = ?`
      )
      .get(id);

    return NextResponse.json({
      success: true,
      message: "User information updated successfully.",
      user: updated,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (me.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idRaw } = await context.params;
    const id = Number(idRaw);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    if (me.id === id) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    const target = db.prepare("SELECT id, role, name FROM users WHERE id = ?").get(id) as any;
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (target.role === "admin") {
      const adminCount = db
        .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
        .get() as any;

      if (adminCount.count <= 1) {
        return NextResponse.json({ error: "Cannot delete the last admin." }, { status: 400 });
      }
    }

    db.prepare("DELETE FROM users WHERE id = ?").run(id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}