import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { featureFlags } from "@/src/lib/env";
import { demoFollowups, demoLeads } from "@/lib/demo-data";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { SensitiveText } from "@/src/components/ui/sensitive-text";
import { ExplainHint } from "@/src/components/ui/explain-hint";

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

export default function TanjiaPage() {
  return <TanjiaContent />;
}

async function TanjiaContent() {
  const { supabase } = await requireAuthOrRedirect();
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

  const hasLeads = leads.length > 0;

  return (
    <div className="flex flex-col gap-10 py-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.08em] text-neutral-500">Tanjia</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Networking Hub</h1>
        <p className="text-base text-neutral-700">{pageDescription}</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="hover:shadow-md transition">
          <CardHeader className="flex flex-col gap-2">
            <p className="text-sm font-medium text-neutral-900">New Lead</p>
            <p className="text-sm text-neutral-600">Capture someone you want to follow quietly.</p>
            <Button asChild size="md">
              <Link href="/tanjia/leads/new">Add lead</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-md transition">
          <CardHeader className="flex flex-col gap-2">
            <p className="text-sm font-medium text-neutral-900">Scheduler</p>
            <p className="text-sm text-neutral-600">Send a time link only if they ask for it.</p>
            <Button asChild variant="secondary" size="md">
              <Link href="/tanjia/scheduler">Open scheduler</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-md transition">
          <CardHeader className="flex flex-col gap-2">
            <p className="text-sm font-medium text-neutral-900">Reply helper</p>
            <p className="text-sm text-neutral-600">Generate calm replies in under a minute.</p>
            <Button asChild variant="secondary" size="md">
              <Link href="/tanjia/helper">Open helper</Link>
            </Button>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Today</h2>
          <p className="text-sm text-neutral-600">
            {todayDue.length} follow-up{todayDue.length === 1 ? "" : "s"} due
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col gap-3">
            {todayDue.length > 0 ? (
              todayDue.map((item) => (
                <div key={item.id} className="flex flex-col gap-1 rounded-lg border border-neutral-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-900">
                      <SensitiveText text={leads.find((l) => l.id === item.lead_id)?.name || "Lead"} id={item.lead_id} />
                    </p>
                    <Badge variant="muted">Due</Badge>
                  </div>
                  <p className="text-sm text-neutral-700">
                    <SensitiveText text={item.note || "Follow up"} mask="note" />
                  </p>
                  <p className="text-xs text-neutral-500">
                    Due {item.due_at ? format(new Date(item.due_at), "MMM d, h:mma") : "soon"}
                  </p>
                  <Button asChild size="sm" variant="secondary" className="self-start">
                    <Link href={`/tanjia/leads/${item.lead_id}`}>Open lead</Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-700">
                No follow-ups today. If helpful, check recent leads below.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Recent leads</h2>
          <Button asChild size="sm">
            <Link href="/tanjia/leads/new">Add lead</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col gap-2">
            {hasLeads ? (
              leads.map((lead) => {
                const lastRun = lastSnapshotMap.get(lead.id);
                const nextDue = nextFollowupMap.get(lead.id);
                return (
                  <Link
                    key={lead.id}
                    href={`/tanjia/leads/${lead.id}`}
                    className="flex flex-col gap-1 rounded-lg border border-transparent p-3 transition hover:border-neutral-200 hover:bg-neutral-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-1">
                        <p className="text-base font-semibold text-neutral-900">
                          <SensitiveText text={lead.name} id={lead.id} />
                        </p>
                        {lead.website ? (
                          <p className="text-xs text-neutral-500">{lead.website}</p>
                        ) : null}
                      </div>
                      <Badge variant="muted">{lead.status || "new"}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-neutral-600">
                      <span>
                        Last run: {lastRun ? format(new Date(lastRun), "MMM d, h:mma") : "Not yet"}
                      </span>
                      <span>
                        Next follow-up: {nextDue ? format(new Date(nextDue), "MMM d, h:mma") : "None"}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-neutral-200 p-6 text-sm text-neutral-700">
                <p className="text-base font-semibold text-neutral-900">Add your first lead</p>
                <p className="text-sm text-neutral-600">
                  Capture one person you want to follow. Then run intelligence to get talking points.
                </p>
                <Button asChild className="mt-3">
                  <Link href="/tanjia/leads/new">Add lead</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
