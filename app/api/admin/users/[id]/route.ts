import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/auth";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

const ALLOWED_ROLES = ["admin", "co_admin", "staff"] as const;
const ALLOWED_EMPLOYMENT = [
  "Job Order",
  "Contract of Service",
  "Casual",
  "Permanent",
] as const;

function isValidUserId(value: number) {
  return Number.isInteger(value) && value > 0;
}

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getCurrentUser();

    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (normalizeRole(me.role) !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idRaw } = await context.params;
    const id = Number(idRaw);

    if (!isValidUserId(id)) {
      return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
    }

    const body = await req.json();

    const name = normalizeSpaces(String(body?.name ?? ""));
    const email = normalizeSpaces(String(body?.email ?? "")).toLowerCase();
    const role = normalizeSpaces(String(body?.role ?? "")).toLowerCase();
    const position = normalizeSpaces(String(body?.position ?? ""));
    const department = normalizeSpaces(String(body?.department ?? ""));
    const employmentType = normalizeSpaces(String(body?.employmentType ?? ""));
    const contact = normalizeSpaces(String(body?.contact ?? ""));
    const birthdate = normalizeSpaces(String(body?.birthdate ?? ""));

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Valid email is required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    if (
      employmentType &&
      !ALLOWED_EMPLOYMENT.includes(
        employmentType as (typeof ALLOWED_EMPLOYMENT)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Invalid employment type." },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Failed to fetch user." },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: "Failed to validate email." },
        { status: 500 }
      );
    }

    if (emailTaken) {
      return NextResponse.json(
        { error: "Email already exists." },
        { status: 400 }
      );
    }

    if (existing.role === "admin" && role !== "admin") {
      const { count: adminCount, error: adminCountError } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      if (adminCountError) {
        console.error("PATCH USER ADMIN COUNT ERROR:", adminCountError);
        return NextResponse.json(
          { error: "Failed to validate admin count." },
          { status: 500 }
        );
      }

      if ((adminCount || 0) <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last admin." },
          { status: 400 }
        );
      }
    }

    const noChanges =
      normalizeSpaces(String(existing.name ?? "")) === name &&
      normalizeSpaces(String(existing.email ?? "")).toLowerCase() === email &&
      normalizeSpaces(String(existing.role ?? "")).toLowerCase() === role &&
      normalizeSpaces(String(existing.position ?? "")) === position &&
      normalizeSpaces(String(existing.department ?? "")) === department &&
      normalizeSpaces(String(existing.employmentType ?? "")) === employmentType &&
      normalizeSpaces(String(existing.contact ?? "")) === contact &&
      normalizeSpaces(String(existing.birthdate ?? "")) === birthdate;

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
      return NextResponse.json(
        { error: "Failed to update user." },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: "Failed to fetch updated user." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User information updated successfully.",
      user: updated,
    });
  } catch (error) {
    console.error("PATCH USER ROUTE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getCurrentUser();
    console.log("DELETE USER DEBUG: current user lookup", {
      requestPath: req.nextUrl.pathname,
      hasSession: Boolean(me),
      currentUserId: me?.id ?? null,
      currentUserRole: me?.role ?? null,
    });

    if (!me) {
      console.warn("DELETE USER DEBUG: denied due to missing or invalid session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (normalizeRole(me.role) !== "admin") {
      console.warn("DELETE USER DEBUG: denied due to non-admin role", {
        currentUserId: me.id,
        currentUserRole: me.role,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idRaw } = await context.params;
    const id = Number(idRaw);
    console.log("DELETE USER DEBUG: parsed target id", {
      idRaw,
      parsedId: id,
    });

    if (!isValidUserId(id)) {
      console.warn("DELETE USER DEBUG: denied due to invalid user id", {
        currentUserId: me.id,
        idRaw,
        parsedId: id,
      });
      return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
    }

    if (me.id === id) {
      console.warn("DELETE USER DEBUG: denied due to self-delete protection", {
        currentUserId: me.id,
        targetUserId: id,
      });
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    const { data: target, error: targetError } = await supabaseAdmin
      .from("users")
      .select("id, role, name")
      .eq("id", id)
      .maybeSingle();

    if (targetError) {
      console.error("DELETE USER FETCH ERROR:", targetError);
      return NextResponse.json(
        { error: "Failed to fetch user." },
        { status: 500 }
      );
    }

    if (!target) {
      console.warn("DELETE USER DEBUG: denied because target user was not found", {
        currentUserId: me.id,
        targetUserId: id,
      });
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    console.log("DELETE USER DEBUG: target user lookup", {
      currentUserId: me.id,
      currentUserRole: me.role,
      targetUserId: target.id,
      targetUserRole: target.role ?? null,
      targetUserName: target.name ?? null,
    });

    if (String(target.role || "").trim().toLowerCase() === "admin") {
      const { count: adminCount, error: adminCountError } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      if (adminCountError) {
        console.error("DELETE USER ADMIN COUNT ERROR:", adminCountError);
        return NextResponse.json(
          { error: "Failed to validate admin count." },
          { status: 500 }
        );
      }

      if ((adminCount || 0) <= 1) {
        console.warn("DELETE USER DEBUG: denied due to last-admin protection", {
          currentUserId: me.id,
          targetUserId: target.id,
          adminCount,
        });
        return NextResponse.json(
          { error: "Cannot delete the last admin." },
          { status: 400 }
        );
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("DELETE USER ERROR:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete user." },
        { status: 500 }
      );
    }

    console.log("DELETE USER DEBUG: delete succeeded", {
      currentUserId: me.id,
      targetUserId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE USER ROUTE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to delete user." },
      { status: 500 }
    );
  }
}
