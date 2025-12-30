import type { Metadata } from "next";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { featureFlags } from "@/src/lib/env";
import { demoFollowups, demoLeads } from "@/lib/demo-data";
import { PageHeader } from "@/src/components/ui/page-header";
import FollowupsClient from "./client";
import { markFollowupDone, snoozeFollowup } from "../leads/actions";

export const metadata: Metadata = {
  title: "Follow-ups",
  description: "Follow-up reminders.",
  robots: { index: false, follow: false },
};

type FollowupItem = {
  id: string;
  lead_id: string;
  note: string;
  due_at?: string;
  done?: boolean;
  leads?: { name?: string };
};

export default async function FollowupsPage() {
  const { supabase } = await requireAuthOrRedirect();
  const followupData =
    (
      await supabase
        .from("followups")
        .select("id, lead_id, note, due_at, done, created_at, leads(name)")
        .order("created_at", { ascending: false })
    ).data || [];

  const items: FollowupItem[] = featureFlags.showcaseMode
    ? Object.entries(demoFollowups).flatMap(([leadId, list]) =>
        list.map((item) => ({
          ...item,
          lead_id: leadId,
          leads: { name: demoLeads.find((l) => l.id === leadId)?.name || "Demo lead" },
        })),
      )
    : (followupData as FollowupItem[]).map((item) => ({
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
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader title="Follow-ups" description="What is due today and next." />
      <FollowupsClient
        followups={items.map((item) => ({
          ...item,
          lead_name: item.leads?.name,
        }))}
        onMarkDone={markDone}
        onSnooze={snooze}
      />
    </div>
  );
}
