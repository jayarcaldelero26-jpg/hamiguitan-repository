import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

const ALLOWED_ROLES = ["admin", "co_admin", "staff"];
const ALLOWED_EMPLOYMENT = ["Job Order", "Contract of Service", "Casual", "Permanent"];

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("users")
      .select(`
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
      `)
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error("PATCH USER FETCH ERROR:", existingError);
      return NextResponse.json({ error: "Failed to fetch user." }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const { data: emailTaken, error: emailTakenError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .neq("id", id)
      .maybeSingle();

    if (emailTakenError) {
      console.error("PATCH USER EMAIL CHECK ERROR:", emailTakenError);
      return NextResponse.json({ error: "Failed to validate email." }, { status: 500 });
    }

    if (emailTaken) {
      return NextResponse.json({ error: "Email already exists." }, { status: 400 });
    }

    if (existing.role === "admin" && role !== "admin") {
      const { count: adminCount, error: adminCountError } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      if (adminCountError) {
        console.error("PATCH USER ADMIN COUNT ERROR:", adminCountError);
        return NextResponse.json({ error: "Failed to validate admin count." }, { status: 500 });
      }

      if ((adminCount || 0) <= 1) {
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
        user: existing,
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        name,
        email,
        role,
        position: position || null,
        department: department || null,
        employmentType: employmentType || null,
        contact: contact || null,
        birthdate: birthdate || null,
      })
      .eq("id", id);

    if (updateError) {
      console.error("PATCH USER UPDATE ERROR:", updateError);
      return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
    }

    const { data: updated, error: updatedError } = await supabaseAdmin
      .from("users")
      .select(`
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
      `)
      .eq("id", id)
      .maybeSingle();

    if (updatedError) {
      console.error("PATCH USER REFRESH ERROR:", updatedError);
      return NextResponse.json({ error: "Failed to fetch updated user." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "User information updated successfully.",
      user: updated,
    });
  } catch (e) {
    console.error("PATCH USER ROUTE ERROR:", e);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { data: target, error: targetError } = await supabaseAdmin
      .from("users")
      .select("id, role, name")
      .eq("id", id)
      .maybeSingle();

    if (targetError) {
      console.error("DELETE USER FETCH ERROR:", targetError);
      return NextResponse.json({ error: "Failed to fetch user." }, { status: 500 });
    }

    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (target.role === "admin") {
      const { count: adminCount, error: adminCountError } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      if (adminCountError) {
        console.error("DELETE USER ADMIN COUNT ERROR:", adminCountError);
        return NextResponse.json({ error: "Failed to validate admin count." }, { status: 500 });
      }

      if ((adminCount || 0) <= 1) {
        return NextResponse.json({ error: "Cannot delete the last admin." }, { status: 400 });
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("DELETE USER ERROR:", deleteError);
      return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE USER ROUTE ERROR:", e);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}