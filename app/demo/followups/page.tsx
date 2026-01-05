import type { Metadata } from "next";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { DEMO_WORKSPACE_ID } from "@/src/lib/workspaces/constants";
import { PageShell } from "@/src/components/ui/page-shell";
import { IntentHeader } from "@/src/components/ui/intent-header";
import FollowupsClient from "@/app/tanjia/followups/client";
import { markFollowupDone, snoozeFollowup } from "@/app/tanjia/leads/actions";

export const metadata: Metadata = {
  title: "Demo Follow-ups",
  description: "Demo follow-ups scoped to demo workspace.",
};

type FollowupItem = {
  id: string;
  lead_id: string;
  note: string;
  due_at?: string;
  done?: boolean;
  leads?: { name?: string };
};

export default async function DemoFollowupsPage() {
  const { supabase, user } = await requireAuthOrRedirect();

  const withWorkspace = await supabase
    .from("followups")
    .select("id, lead_id, note, due_at, done, created_at, leads(name)")
    .eq('workspace_id', DEMO_WORKSPACE_ID)
    .order("created_at", { ascending: false });

  let followupData: any[] = (withWorkspace.data || []) as any[];
  if (withWorkspace.error?.message?.includes("workspace_id")) {
    const leadsRes = await supabase.from("leads").select("id").eq("owner_id", user.id);
    const leadIds = (leadsRes.data || []).map((l: any) => l.id).filter(Boolean);
    if (leadIds.length) {
      const legacy = await supabase
        .from("followups")
        .select("id, lead_id, note, due_at, done, created_at, leads(name)")
        .in("lead_id", leadIds)
        .order("created_at", { ascending: false });
      followupData = (legacy.data || []) as any[];
    } else {
      followupData = [];
    }
  }

  const items: FollowupItem[] = (followupData as FollowupItem[]).map((item) => ({
    ...item,
    leads: Array.isArray(item.leads) ? item.leads[0] : item.leads,
  }));

  async function markDone(id: string) {
    "use server";
    await markFollowupDone(id);
  }

  async function snooze(id: string, days: number) {
    "use server";
    await snoozeFollowup(id, days);
  }

  return (
    <PageShell maxWidth="lg">
      <IntentHeader
        badge="Operator only"
        badgeVariant="operator"
        title="Follow-up"
        anchor="Queue"
        subtitle="What is due today and next."
      />
      <FollowupsClient
        followups={items.map((item) => ({
          ...item,
          lead_name: item.leads?.name,
        }))}
        onMarkDone={markDone}
        onSnooze={snooze}
      />
    </PageShell>
  );
}

