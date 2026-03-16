import "server-only";

import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/app/lib/publicEnv";
import { serverEnv } from "@/app/lib/serverEnv";

export const supabase = createClient(
  publicEnv.supabaseUrl,
  publicEnv.supabaseAnonKey
);
export const supabaseAdmin = createClient(
  publicEnv.supabaseUrl,
  serverEnv.supabaseServiceRoleKey
);
