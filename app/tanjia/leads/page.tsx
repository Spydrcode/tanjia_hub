import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { featureFlags } from "@/src/lib/env";
import { demoFollowups, demoLeads } from "@/lib/demo-data";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { SensitiveText } from "@/src/components/ui/sensitive-text";
import { ExplainHint } from "@/src/components/ui/explain-hint";
import LeadsFilters from "./filters";

export const metadata: Metadata = {
  title: "Tanjia Leads",
  description: "Leads you are tracking.",
  robots: { index: false, follow: false },
};

type LeadRow = {
  id: string;
  name: string;
  website?: string | null;
  status?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export default async function LeadsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const { supabase } = await requireAuthOrRedirect();
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const statusFilter = typeof searchParams.status === "string" ? searchParams.status : "all";
  const snapshotFilter = typeof searchParams.snapshot === "string" ? searchParams.snapshot : "any";

  const leads: LeadRow[] = featureFlags.showcaseMode
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
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.08em] text-neutral-500">Tanjia</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Leads</h1>
            <p className="text-sm text-neutral-600">Scan quickly, then open the lead you need.</p>
          </div>
          <div className="flex items-center gap-2">
            <ExplainHint target="lead.detail" />
            <Button asChild size="md">
              <Link href="/tanjia/leads/new">New Lead</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
            <LeadsFilters status={statusFilter} snapshot={snapshotFilter} q={q} />

            {filtered.length > 0 ? (
              <div className="flex flex-col divide-y divide-neutral-200">
                {filtered.map((lead) => {
                  const lastRun = lastSnapshotMap.get(lead.id);
                  const nextDue = nextFollowupMap.get(lead.id);
                  const host = lead.website ? lead.website.replace(/^https?:\/\//, "").split("/")[0] : "";
                  return (
                    <Link
                      key={lead.id}
                      href={`/tanjia/leads/${lead.id}`}
                      className="flex flex-col gap-2 py-3 transition hover:bg-neutral-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <p className="text-base font-semibold text-neutral-900">
                            <SensitiveText text={lead.name} id={lead.id} />
                          </p>
                          {host ? <p className="text-xs text-neutral-500">{host}</p> : null}
                        </div>
                        <Badge variant="muted">{lead.status || "new"}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-neutral-600">
                        <span>Last run: {lastRun ? format(new Date(lastRun), "MMM d, h:mma") : "Not yet"}</span>
                        <span>
                          Next follow-up: {nextDue ? format(new Date(nextDue), "MMM d, h:mma") : "None"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-neutral-200 p-6 text-sm text-neutral-700">
                No leads match this view. Try clearing filters or adding a lead.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
