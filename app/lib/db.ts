import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function ensureAdminUser() {
  const adminEmail = "mthamiguitan@denr.gov.ph";
  const adminPassword = "MHRWS9303";
  const adminEmploymentType = "Permanent";

  const { data: existingAdmin, error: findError } = await supabaseAdmin
    .from("users")
    .select("id, employmentType, role")
    .eq("email", adminEmail)
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  if (!existingAdmin) {
    const hashed = bcrypt.hashSync(adminPassword, 10);
    const createdAt = new Date().toISOString();

    const { error: insertError } = await supabaseAdmin.from("users").insert([
      {
        name: "MHRWS Admin",
        email: adminEmail,
        password: hashed,
        role: "admin",
        employmentType: adminEmploymentType,
        createdAt,
        mustChangePassword: 0,
      },
    ]);

    if (insertError) {
      throw new Error(insertError.message);
    }
  } else {
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        role: "admin",
        employmentType:
          existingAdmin.employmentType && existingAdmin.employmentType.trim() !== ""
            ? existingAdmin.employmentType
            : adminEmploymentType,
      })
      .eq("email", adminEmail);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}