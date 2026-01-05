import type { Metadata } from "next";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { PageShell } from "@/src/components/ui/page-shell";
import { ZoneHeader } from "@/src/components/ui/zone-header";
import { SupportClientV2 } from "@/app/tanjia/support/support-client-v2";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_WORKSPACE_ID } from "@/src/lib/workspaces/constants";

export const metadata: Metadata = {
  title: "Support - Demo",
  description: "What should I say next? (Demo)",
};

export default async function DemoSupportPage() {
  await requireAuthOrRedirect();
  
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch leads for the selector scoped to demo workspace
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, website, notes")
    .eq("workspace_id", DEMO_WORKSPACE_ID)
    .order("updated_at", { ascending: false })
    .limit(50);

  const formattedLeads = (leads || []).map((l: { id: string; name: string; website?: string | null; notes?: string | null }) => ({
    id: l.id,
    name: l.name,
    website: l.website || undefined,
    notes: l.notes || undefined,
  }));

  return (
    <PageShell maxWidth="xl">
      <ZoneHeader
        zone="support"
        title="Support"
        anchor="Draft"
        question="What should I say next?"
        useWhen="When you need to draft a message, reply, or follow-up."
      />

      <SupportClientV2 leads={formattedLeads} />
    </PageShell>
  );
}

