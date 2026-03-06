import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/db";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    jwt.verify(token, SECRET);

    const { data: rows, error } = await supabaseAdmin
      .from("documents")
      .select("folder, category")
      .neq("folder", "")
      .order("folder", { ascending: true });

    if (error) {
      console.error("FOLDERS GET ERROR:", error);
      return NextResponse.json({ error: "Failed to load folders" }, { status: 500 });
    }

    const normalizedRows = (rows || [])
      .map((r: any) => ({
        folder: String(r.folder || "").trim(),
        category: String(r.category || "").trim().toLowerCase(),
      }))
      .filter((r) => r.folder !== "");

    const uniqueMap = new Map<string, { folder: string; category: string }>();

    for (const row of normalizedRows) {
      const key = `${row.category}::${row.folder.toLowerCase()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, row);
      }
    }

    const uniqueRows = Array.from(uniqueMap.values()).sort((a, b) =>
      a.folder.localeCompare(b.folder)
    );

    const academe = uniqueRows
      .filter((r) => r.category === "academe")
      .map((r) => r.folder);

    const stakeholders = uniqueRows
      .filter((r) => r.category === "stakeholder" || r.category === "stakeholders")
      .map((r) => r.folder);

    return NextResponse.json({ academe, stakeholders });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}