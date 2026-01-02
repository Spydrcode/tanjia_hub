import type { Metadata } from "next";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { PageShell } from "@/src/components/ui/page-shell";
import { ZoneHeader } from "@/src/components/ui/zone-header";
import { ClarifyClientV2 } from "./clarify-client-v2";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Clarify - Tanjia",
  description: "What should I focus on today, and what's slipping?",
};

export default async function ClarifyPage() {
  await requireAuthOrRedirect();
  
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return (
    <PageShell maxWidth="xl">
      <ZoneHeader
        zone="clarify"
        title="Clarify"
        anchor="Focus"
        question="What should I focus on today, and what's slipping?"
        useWhen="Every morning to set direction, or anytime priorities shift."
      />

      <ClarifyClientV2 />
    </PageShell>
  );
}