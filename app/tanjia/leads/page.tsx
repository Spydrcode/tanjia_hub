import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { featureFlags } from "@/src/lib/env";
import { demoFollowups, demoLeads } from "@/lib/demo-data";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { SensitiveText } from "@/src/components/ui/sensitive-text";
import { PageShell } from "@/src/components/ui/page-shell";
import { IntentHeader } from "@/src/components/ui/intent-header";
import { Button } from "@/src/components/ui/button";
import LeadsFilters from "./filters";
import { LeadRow } from "@/app/tanjia/leads/lead-row";

export const metadata: Metadata = {
  title: "Leads - Tanjia",
  description: "Your leads and signals.",
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

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase } = await requireAuthOrRedirect();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const statusFilter = typeof params.status === "string" ? params.status : "all";
  const snapshotFilter = typeof params.snapshot === "string" ? params.snapshot : "any";

  const leads: LeadRowType[] = featureFlags.showcaseMode
    ? demoLeads
    : (
        await supabase
          .from("leads")
          .select("id, name, website, status, updated_at, created_at")
          .order("updated_at", { ascending: false })
      ).data || [];

  const leadIds = leads.map((l) => l.id);

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
          .select("lead_id, due_at, done, note")
          .in("lead_id", leadIds)
          .order("due_at", { ascending: true })).data || []
      : [];

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
        <Button asChild size="sm">
          <Link href="/tanjia/leads/new">New lead</Link>
        </Button>
        <Link
          href="/tanjia/explore"
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-200"
        >
          Go to Listen
        </Link>
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
