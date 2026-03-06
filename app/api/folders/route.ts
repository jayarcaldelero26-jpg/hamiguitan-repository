import { NextResponse, type NextRequest } from "next/server";
import db from "@/app/lib/db";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    jwt.verify(token, SECRET);

    const rows = db
      .prepare(
        `
        SELECT DISTINCT
          TRIM(COALESCE(folder,'')) AS folder,
          LOWER(TRIM(COALESCE(category,''))) AS category
        FROM documents
        WHERE TRIM(COALESCE(folder,'')) <> ''
        ORDER BY folder ASC
        `
      )
      .all() as { folder: string; category: string }[];

    // group by category
    const academe = rows.filter(r => r.category === "academe").map(r => r.folder);
    const stakeholders = rows
      .filter(r => r.category === "stakeholder" || r.category === "stakeholders")
      .map(r => r.folder);

    return NextResponse.json({ academe, stakeholders });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}