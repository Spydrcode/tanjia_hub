import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAuthOrRedirect(pathname: string = "/tanjia/login") {
  const supabase = await createSupabaseServerClient();

  // 🔒 Test-only auth bypass (local / Playwright only)
  // Never active in production unless explicitly misconfigured
  if (process.env.NODE_ENV !== "production" && process.env.E2E_BYPASS_AUTH === "1") {
    return {
      supabase,
      user: {
        id: process.env.E2E_OWNER_ID || "e2e-owner",
        email: "e2e@local.test",
      } as any,
    };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return redirect(pathname);
  }

  return { supabase, user: data.user };
}
