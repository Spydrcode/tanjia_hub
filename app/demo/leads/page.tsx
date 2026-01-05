import type { Metadata } from "next";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { DEMO_WORKSPACE_ID } from "@/src/lib/workspaces/constants";
import { Card, CardContent } from "@/src/components/ui/card";
import { PageShell } from "@/src/components/ui/page-shell";
import { IntentHeader } from "@/src/components/ui/intent-header";
import { Button } from "@/src/components/ui/button";
import LeadsFilters from "@/app/tanjia/leads/filters";
import { LeadRow } from "@/app/tanjia/leads/lead-row";

export const metadata: Metadata = {
  title: "Demo Leads - Tanjia",
  description: "Demo leads scoped to demo workspace.",
  robots: { index: false, follow: false },
};

type LeadRowType = {
  id: string;
  name: string;
  website?: string | null;
  status?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export default async function DemoLeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, user } = await requireAuthOrRedirect();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const statusFilter = typeof params.status === "string" ? params.status : "all";
  const snapshotFilter = typeof params.snapshot === "string" ? params.snapshot : "any";

  const leadsWithWorkspace = await supabase
    .from("leads")
    .select("id, name, website, status, updated_at, created_at")
    .eq('workspace_id', DEMO_WORKSPACE_ID)
    .order("updated_at", { ascending: false });

  const leadsLegacy = leadsWithWorkspace.error?.message?.includes("workspace_id")
    ? await supabase
        .from("leads")
        .select("id, name, website, status, updated_at, created_at")
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false })
    : null;

  const leads: LeadRowType[] = (leadsWithWorkspace.data || leadsLegacy?.data || []) as LeadRowType[];

  const leadIds = leads.map((l) => l.id);

  const snapshotsRes = leadIds.length
    ? await supabase
        .from("lead_snapshots")
        .select("lead_id, created_at")
        .in("lead_id", leadIds)
        .eq('workspace_id', DEMO_WORKSPACE_ID)
        .order("created_at", { ascending: false })
    : null;

  const snapshotsLegacyRes = leadIds.length && snapshotsRes?.error?.message?.includes("workspace_id")
    ? await supabase
        .from("lead_snapshots")
        .select("lead_id, created_at")
        .in("lead_id", leadIds)
        .order("created_at", { ascending: false })
    : null;

  const snapshots = (snapshotsRes?.data || snapshotsLegacyRes?.data || []) as any[];

  const followupsRes = leadIds.length
    ? await supabase
        .from("followups")
        .select("lead_id, due_at, done, note")
        .in("lead_id", leadIds)
        .eq('workspace_id', DEMO_WORKSPACE_ID)
        .order("due_at", { ascending: true })
    : null;

  const followupsLegacyRes = leadIds.length && followupsRes?.error?.message?.includes("workspace_id")
    ? await supabase
        .from("followups")
        .select("lead_id, due_at, done, note")
        .in("lead_id", leadIds)
        .order("due_at", { ascending: true })
    : null;

  const followups = (followupsRes?.data || followupsLegacyRes?.data || []) as any[];

  const lastSnapshotMap = new Map<string, string>();
  const hasSnapshotMap = new Set<string>();
  for (const snap of snapshots) {
    if (!lastSnapshotMap.has(snap.lead_id)) lastSnapshotMap.set(snap.lead_id, snap.created_at || "");
    hasSnapshotMap.add(snap.lead_id);
  }

  const nextFollowupMap = new Map<string, string>();
  for (const f of followups) {
    if (!f.done && f.due_at && !nextFollowupMap.has(f.lead_id)) {
      nextFollowupMap.set(f.lead_id, f.due_at);
    }
  }

  const filtered = leads.filter((lead) => {
    const matchSearch =
      !q ||
      lead.name.toLowerCase().includes(q.toLowerCase()) ||
      (lead.website || "").toLowerCase().includes(q.toLowerCase());
    const matchStatus = statusFilter === "all" || (lead.status || "new") === statusFilter;
    const hasSnap = hasSnapshotMap.has(lead.id);
    const matchSnapshot =
      snapshotFilter === "any" || (snapshotFilter === "yes" ? hasSnap : !hasSnap);
    return matchSearch && matchStatus && matchSnapshot;
  });

  return (
    <PageShell maxWidth="lg">
      <IntentHeader
        badge="Operator only"
        badgeVariant="operator"
        title="Your"
        anchor="Signals"
        subtitle="Scan quickly, open one lead, then return to Listen."
      />

      <div className="flex items-center gap-3">
        <Button size="sm" disabled title="Demo mode: read-only">
          New lead
        </Button>
        <button
          type="button"
          disabled
          title="Demo mode: read-only"
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-400"
        >
          Go to Listen
        </button>
      </div>

      <Card className="border-neutral-200 bg-white shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
          <LeadsFilters status={statusFilter} snapshot={snapshotFilter} q={q} />

          {filtered.length > 0 ? (
            <div className="flex flex-col divide-y divide-neutral-200" data-testid="leads-list">
              {filtered.map((lead) => {
                const lastRun = lastSnapshotMap.get(lead.id);
                const nextDue = nextFollowupMap.get(lead.id);
                return (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    lastRun={lastRun}
                    nextDue={nextDue}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-600">
              No leads match this view. Try clearing filters or adding a lead.
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

