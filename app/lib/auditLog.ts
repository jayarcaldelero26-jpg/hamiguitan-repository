import "server-only";

import { supabaseAdmin } from "@/app/lib/db";

type AuditLogInput = {
  userId: number | string | null | undefined;
  userEmail?: string | null;
  action: string;
  fileName?: string | null;
  fromPath?: string | null;
  toPath?: string | null;
};

export async function writeAuditLog(input: AuditLogInput) {
  try {
    const { error } = await supabaseAdmin.from("audit_logs").insert([
      {
        user_id: input.userId ?? null,
        user_email: input.userEmail?.trim() || null,
        action: input.action,
        file_name: input.fileName?.trim() || null,
        from_path: input.fromPath?.trim() || null,
        to_path: input.toPath?.trim() || null,
      },
    ]);

    if (error) {
      console.error("AUDIT LOG INSERT ERROR:", error);
    }
  } catch (error) {
    console.error("AUDIT LOG WRITE FAILED:", error);
  }
}
