import "server-only";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "@/app/lib/db";
import { serverEnv } from "@/app/lib/serverEnv";

type TokenPayload = {
  id: number;
  name?: string;
  email?: string;
  role?: string;
};

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

  let payload: TokenPayload;

  try {
    payload = jwt.verify(token, serverEnv.jwtSecret) as TokenPayload;
  } catch {
    return null;
  }

  if (!payload?.id || !Number.isInteger(Number(payload.id))) {
    return null;
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select(`
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
    `)
    .eq("id", payload.id)
    .maybeSingle();

  if (error) {
    console.error("GET CURRENT USER ERROR:", error);
    return null;
  }

  return (user as CurrentUser) || null;
}
