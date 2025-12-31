import type { Metadata } from "next";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { featureFlags } from "@/src/lib/env";
import { demoFollowups, demoLeads } from "@/lib/demo-data";
import DashboardClient, { FollowupSummary, LeadSummary, MeetingSummary } from "./dashboard-client";

const pageTitle = "Tanjia - Networking for 2ndmynd";
const pageDescription =
  "A simple way to connect. If a 2nd Look feels helpful, here is the quiet hub to manage it.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: `${tanjiaConfig.siteUrl}/tanjia`,
  },
};

type LeadRow = {
  id: string;
  name: string;
  website?: string | null;
  status?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type MeetingRow = {
  id: string;
  title: string;
  start_at: string;
  location_name?: string | null;
  status?: string | null;
};

export default function TanjiaPage() {
  return <TanjiaContent />;
}

async function TanjiaContent() {
  const { supabase, user } = await requireAuthOrRedirect();
  const leads: LeadRow[] =
    featureFlags.showcaseMode
      ? demoLeads
      : (
          await supabase
            .from("leads")
            .select("id, name, website, status, updated_at, created_at")
            .order("updated_at", { ascending: false })
            .limit(20)
        ).data || [];

  const leadIds = leads.map((l) => l.id);
  const nowIso = new Date().toISOString();
  const upcomingMeetings =
    (
      await supabase
        .from("meetings")
        .select("id, title, start_at, location_name, status")
        .eq("owner_id", user.id)
        .gte("start_at", nowIso)
        .order("start_at", { ascending: true })
        .limit(5)
    ).data || [];

  const snapshots = featureFlags.showcaseMode
    ? demoLeads.map((l) => ({ lead_id: l.id, created_at: l.updated_at || l.created_at || "" }))
    : leadIds.length
      ? (await supabase
          .from("lead_snapshots")
          .select("lead_id, created_at")
          .in("lead_id", leadIds)
          .order("created_at", { ascending: false })).data || []
      : [];

  const followups = featureFlags.showcaseMode
    ? Object.entries(demoFollowups).flatMap(([lead_id, list]) =>
        list.map((f) => ({ ...f, lead_id })),
      )
    : leadIds.length
      ? (await supabase
          .from("followups")
          .select("id, lead_id, due_at, done, note")
          .in("lead_id", leadIds)
          .eq("done", false)
          .order("due_at", { ascending: true })).data || []
      : [];

  const todayDue = followups.filter((f) => f.due_at && new Date(f.due_at) <= new Date());

  const lastSnapshotMap = new Map<string, string>();
  for (const snap of snapshots) {
    if (!lastSnapshotMap.has(snap.lead_id)) {
      lastSnapshotMap.set(snap.lead_id, snap.created_at || "");
    }
  }

  const nextFollowupMap = new Map<string, string>();
  for (const f of followups) {
    if (!nextFollowupMap.has(f.lead_id) && f.due_at) {
      nextFollowupMap.set(f.lead_id, f.due_at);
    }
  }

  const leadSummaries: LeadSummary[] = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    website: lead.website,
    status: lead.status,
    lastSnapshot: lastSnapshotMap.get(lead.id) || null,
    nextFollowup: nextFollowupMap.get(lead.id) || null,
  }));

  const followupsDue: FollowupSummary[] = todayDue.map((item) => ({
    id: item.id,
    lead_id: item.lead_id,
    note: item.note,
    due_at: item.due_at,
    lead_name: leads.find((l) => l.id === item.lead_id)?.name || "Lead",
  }));

  const meetingSummaries: MeetingSummary[] = (upcomingMeetings as MeetingRow[]).map((m) => ({
    id: m.id,
    title: m.title,
    start_at: m.start_at,
    location_name: m.location_name,
    status: m.status,
  }));

  return (
    <DashboardClient
      description={pageDescription}
      nextMeeting={meetingSummaries[0]}
      followupsDue={followupsDue}
      leads={leadSummaries}
      siteUrl={tanjiaConfig.siteUrl}
    />
  );
}
