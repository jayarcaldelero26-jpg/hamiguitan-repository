import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/app/lib/publicEnv";

export const supabaseBrowser = createClient(
  publicEnv.supabaseUrl,
  publicEnv.supabaseAnonKey
);
