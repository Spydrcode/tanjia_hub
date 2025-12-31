import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { featureFlags } from "@/src/lib/env";
import { Button } from "@/src/components/ui/button";
import { ViewModesProvider } from "@/src/components/ui/view-modes";
import { ViewModeControls } from "@/src/components/ui/view-mode-controls";
import { ViewModeIndicator } from "@/src/components/ui/view-mode-indicator";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";

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
    <ViewModesProvider>
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <ViewModeIndicator />
        <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white">
                    Tanjia Hub
                  </span>
                  {showcase ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                      Showcase Mode
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-neutral-500">Networking workspace</p>
              </div>
              <div className="flex items-center gap-2">
                {isAuth ? <ViewModeControls showCopyLink /> : null}
                {isAuth ? (
                  <form action={signOutAction}>
                    <Button type="submit" variant="ghost" size="sm" aria-label="Logout">
                      Logout
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/tanjia" className="text-sm font-medium text-neutral-800 hover:text-neutral-950">
                Dashboard
              </Link>
              <Link href="/tanjia/tools/helper" className="text-sm font-medium text-neutral-800 hover:text-neutral-950">
                Tools
              </Link>
              <Link href="/tanjia/presentation" className="text-sm font-medium text-neutral-800 hover:text-neutral-950">
                Presentation
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">{children}</main>
        <footer className="pb-8 pt-6 text-center text-xs text-neutral-500">
          <Link href={tanjiaConfig.siteUrl} className="hover:text-neutral-800" target="_blank" rel="noreferrer">
            2ndmynd
          </Link>
        </footer>
      </div>
    </ViewModesProvider>
  );
}
