import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureDirectorMembership } from "@/src/lib/workspaces/ensure-membership";

export async function requireAuthOrRedirect(pathname: string = "/tanjia/login") {
  const supabase = await createSupabaseServerClient();

  // 🔒 Test-only auth bypass (local / Playwright only)
  // - Supports environment var `E2E_BYPASS_AUTH=1` OR an incoming header `x-dev-bypass: 1`.
  // - Header allows Playwright to simulate an authenticated user without restarting the dev server.
  if (process.env.NODE_ENV !== "production") {
    const hdrs = await headers();
    const headerBypass = hdrs.get("x-dev-bypass") === "1";
    const headerOwner = hdrs.get("x-dev-owner");
    if (process.env.E2E_BYPASS_AUTH === "1" || headerBypass) {
      return {
        supabase,
        user: {
          id: headerOwner || process.env.E2E_OWNER_ID || "e2e-owner",
          email: "e2e@local.test",
        } as any,
      };
    }
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return redirect(pathname);
  }

  // Best-effort: ensure the authenticated user has a director workspace_members row
  try {
    if (data.user?.id) await ensureDirectorMembership(data.user.id);
  } catch (err) {
    // swallow; membership ensure is non-blocking for auth
    console.warn('ensureDirectorMembership failed', err);
  }

  return { supabase, user: data.user };
}
