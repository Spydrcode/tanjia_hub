import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/src/lib/env";

export function createSupabaseServiceRoleClient() {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for service operations.");
  }

  return createClient(publicEnv.supabaseUrl, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
