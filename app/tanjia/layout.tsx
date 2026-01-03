import type { Metadata } from "next";
import { cookies } from "next/headers";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { AppShell } from "./components/app-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

async function signOutAction() {
  "use server";
  const { supabase } = await requireAuthOrRedirect();
  await supabase.auth.signOut();
}

export default async function TanjiaLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isAuth = Boolean(cookieStore.get("sb-access-token"));
  
  if (!isAuth) {
    // If not authenticated, show basic layout without shell
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-[#f9fafb] via-[#fdfcf8] to-[#f6efe3] text-neutral-900">
        <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <AppShell onSignOut={signOutAction}>
      {children}
    </AppShell>
  );
}
