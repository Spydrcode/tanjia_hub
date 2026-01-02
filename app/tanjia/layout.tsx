import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { featureFlags } from "@/src/lib/env";
import { Button } from "@/src/components/ui/button";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { NavLink } from "./components/nav-link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

async function signOutAction() {
  "use server";
  const { supabase } = await requireAuthOrRedirect();
  await supabase.auth.signOut();
}

export default async function TanjiaLayout({ children }: { children: React.ReactNode }) {
  const showcase = featureFlags.showcaseMode;
  const cookieStore = await cookies();
  const isAuth = Boolean(cookieStore.get("sb-access-token"));
  
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#f9fafb] via-[#fdfcf8] to-[#f6efe3] text-neutral-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,0,0,0.03),transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(0,0,0,0.02),transparent_35%)]" />
      
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6">
          {/* Top row: Brand + Actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Link
                  href="/tanjia"
                  className="rounded-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:opacity-90"
                >
                  2ndmynd Hub
                </Link>
                {showcase && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                    Showcase
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 tracking-wide">
                Listen → Clarify → Map → Decide → Support
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {isAuth && (
                <Link
                  href="/tanjia/share"
                  className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-emerald-700"
                >
                  Share View
                </Link>
              )}
              {isAuth && (
                <form action={signOutAction}>
                  <Button type="submit" variant="ghost" size="sm" aria-label="Logout">
                    Logout
                  </Button>
                </form>
              )}
            </div>
          </div>
          
          {/* Navigation row: Zones */}
          {isAuth && (
            <nav className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1">
              <NavLink href="/tanjia" exact>Hub</NavLink>
              <span className="text-neutral-300 px-0.5">·</span>
              <NavLink href="/tanjia/listen">Listen</NavLink>
              <NavLink href="/tanjia/clarify">Clarify</NavLink>
              <NavLink href="/tanjia/map">Map</NavLink>
              <NavLink href="/tanjia/decide">Decide</NavLink>
              <NavLink href="/tanjia/support">Support</NavLink>
              <NavLink href="/tanjia/tools">Tools</NavLink>
              <span className="text-neutral-300 px-0.5">·</span>
              <NavLink href="/tanjia/leads">Leads</NavLink>
              <NavLink href="/tanjia/system">System</NavLink>
            </nav>
          )}
        </div>
      </header>
      
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        {children}
      </main>
      
      <footer className="pb-8 pt-6 text-center text-xs text-neutral-500">
        <Link href={tanjiaConfig.siteUrl} className="hover:text-neutral-800" target="_blank" rel="noreferrer">
          2ndmynd
        </Link>
      </footer>
    </div>
  );
}
