import type { Metadata } from "next";
import HelperClient from "./helper-client";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { PageHeader } from "@/src/components/ui/page-header";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { demoLeads } from "@/lib/demo-data";
import { featureFlags } from "@/src/lib/env";

export const metadata: Metadata = {
  title: "Tanjia Reply Helper",
  description: "A quiet helper to draft replies. Keep it human and permission-based.",
  robots: { index: false, follow: false },
};

export default async function TanjiaHelperPage({ searchParams }: { searchParams?: { leadId?: string } }) {
  const params = await searchParams;
  const leadId = params?.leadId;
  let leadName: string | undefined;
  let emythHints: { overload?: string; follow?: string } | undefined;

  if (leadId) {
    if (featureFlags.showcaseMode) {
      leadName = demoLeads.find((l) => l.id === leadId)?.name;
    } else {
      const { supabase } = await requireAuthOrRedirect();
      const { data: lead } = await supabase.from("leads").select("name").eq("id", leadId).single();
      leadName = lead?.name || undefined;
      const { data: snap } = await supabase
        .from("lead_snapshots")
        .select("extracted_json")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      const emyth = (snap?.extracted_json as any)?.emyth;
      if (emyth) {
        emythHints = {
          overload: emyth.role_map?.overload_hotspots?.[0],
          follow: emyth.follow_through?.stall_risk,
        };
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Message reply"
        anchor="Helper"
        eyebrow="Tanjia"
        description="Calm replies in under a minute. Use only what feels true."
        size="lg"
      />
      <HelperClient
        cal15Url={tanjiaConfig.calEvent15Url}
        cal30Url={tanjiaConfig.calEvent30Url}
        initialLeadId={leadId}
        initialLeadName={leadName}
        emythHints={emythHints}
      />
    </div>
  );
}
