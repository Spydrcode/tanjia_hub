import type { Metadata } from "next";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { AppShell } from "../tanjia/components/app-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

async function signOutAction() {
  "use server";
  const { supabase } = await requireAuthOrRedirect();
  await supabase.auth.signOut();
}

export default async function DemoLayout({ children }: { children: React.ReactNode }) {
  await requireAuthOrRedirect();

  return (
    <AppShell onSignOut={signOutAction}>
      {children}
    </AppShell>
  );
}
