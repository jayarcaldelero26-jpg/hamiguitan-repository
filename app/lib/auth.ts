import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import db from "@/app/lib/db";

const SECRET = process.env.JWT_SECRET!;

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  userCode?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  suffix?: string | null;
  birthdate?: string | null;
  employmentType?: string | null;
  contact?: string | null;
  department?: string | null;
  position?: string | null;
  createdAt?: string | null;
  mustChangePassword?: number | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  let payload: any;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    return null;
  }

  const user = db
    .prepare(
      `SELECT
        id,
        name,
        email,
        role,
        avatar,
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
        mustChangePassword
      FROM users
      WHERE id = ?`
    )
    .get(payload.id) as CurrentUser | undefined;

  return user || null;
}