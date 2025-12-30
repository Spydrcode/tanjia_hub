import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAuthOrRedirect(pathname: string = "/tanjia/login") {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.user) {
    return redirect(pathname);
  }

  return { supabase, user: data.session.user };
}
