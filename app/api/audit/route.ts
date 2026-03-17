export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/auth";

function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

export async function GET() {
  const me = await getCurrentUser();

  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole(me.role);
  if (role !== "admin" && role !== "co_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select("id,user_id,user_email,action,file_name,from_path,to_path,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("AUDIT LOGS GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load audit logs." }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
