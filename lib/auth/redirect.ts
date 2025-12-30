import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAuthOrRedirect(pathname: string = "/tanjia/login") {
  // AUTH DISABLED FOR DEVELOPMENT: Always return supabase and fake user
  const supabase = await createSupabaseServerClient();
  const user = { id: 'dev-user', email: 'dev@example.com' };
  return { supabase, user };
}
