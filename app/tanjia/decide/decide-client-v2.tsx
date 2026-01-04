'use client';

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { DirectorHeaderStrip } from "@/src/components/tanjia/director/director-header-strip";
import { QueuePanel } from "@/src/components/tanjia/director/queue-panel";
import { useDirectorSnapshot } from "@/src/hooks/use-director-snapshot";
import { formatDistanceToNow } from "date-fns";

export function DecideClientV2() {
  const { snapshot, loading, error } = useDirectorSnapshot();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-900">Failed to load dashboard data</p>
      </div>
    );
  }

  const { today, followups, scheduling } = snapshot;

  // Build decision queue (max 10 items)
  const queueItems = [
    ...followups.overdue.map(f => ({
      id: f.id,
      title: `Follow up: ${f.leadName}`,
      subtitle: f.note,
      href: `/tanjia/leads/${f.leadId}`,
      urgency: 'overdue' as const,
    })),
    ...scheduling.cancellations.map(b => ({
      id: b.id,
      title: `Gentle check-in: ${b.leadName}`,
      subtitle: 'Recent cancellation',
      href: b.leadId ? `/tanjia/leads/${b.leadId}` : '/tanjia/scheduler',
      urgency: 'today' as const,
    })),
    ...followups.dueSoon.filter(f => f.urgency === 'today').map(f => ({
      id: f.id,
      title: `Today: ${f.leadName}`,
      subtitle: f.note,
      href: `/tanjia/leads/${f.leadId}`,
      urgency: 'today' as const,
    })),
    ...followups.dueSoon.filter(f => f.urgency === 'soon').map(f => ({
      id: f.id,
      title: `Coming up: ${f.leadName}`,
      subtitle: f.note,
      href: `/tanjia/leads/${f.leadId}`,
      urgency: 'soon' as const,
    })),
  ].slice(0, 10);

  // Why this is first rationale
  const whyFirst = [];
  if (today.nextMove.urgency === 'overdue') {
    whyFirst.push('This followup is overdue — relationships cool quickly');
    whyFirst.push('Taking action now prevents this from slipping further');
    whyFirst.push('Quick wins build momentum');
  } else if (today.nextMove.urgency === 'today') {
    whyFirst.push('Due today — keeping commitments builds trust');
    whyFirst.push('Early action creates space for unexpected needs');
  } else if (today.nextMove.urgency === 'soon') {
    whyFirst.push('Highest leverage move right now');
    whyFirst.push('Foundation for future conversations');
  } else {
    whyFirst.push('Everything else is handled');
    whyFirst.push('Good time to strengthen the pipeline');
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Director Metrics Strip */}
      <DirectorHeaderStrip metrics={{
        ...today.dueNow,
        leadsNeedingResearch: snapshot.pipeline.leadsNeedingResearch
      }} />

      {/* Main Content: Single Column Focus */}
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Recommended Next Move (Hero) */}
        <QueuePanel
          nextMove={today.nextMove}
          items={queueItems}
        />

        {/* Why This Is First */}
        <Card className="border-neutral-200 bg-neutral-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-5 w-5 text-neutral-600" />
              Why This Is First
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {whyFirst.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span className="shrink-0 text-neutral-400">—</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/tanjia/support">
            <Button variant="secondary" size="sm">
              Draft a message
            </Button>
          </Link>
          <Link href="/tanjia/leads">
            <Button variant="secondary" size="sm">
              View all leads
            </Button>
          </Link>
          <Link href="/tanjia/scheduler">
            <Button variant="secondary" size="sm">
              Open scheduler
            </Button>
          </Link>
        </div>

        {/* Completion / Onboarding Status */}
        {queueItems.length === 0 && (
          snapshot.pipeline.leadsActive === 0 ? (
            <Card className="border-neutral-200 bg-white">
              <CardContent className="p-6 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
                <p className="text-lg font-semibold text-neutral-900">No leads yet</p>
                <p className="mt-2 text-sm text-neutral-600">Add your first lead or connect a meeting so Tanjia can guide the next move.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <Link href="/tanjia/leads?action=new">
                    <Button size="sm">Add Lead</Button>
                  </Link>
                  <Link href="/tanjia/scheduler">
                    <Button size="sm" variant="secondary">Open Scheduler</Button>
                  </Link>
                  <Link href="/tanjia/followups?action=new">
                    <Button size="sm" variant="secondary">Create Followup</Button>
                  </Link>
                  <Link href="/tanjia/tools/analyze">
                    <Button size="sm" variant="secondary">Run Research</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-6 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
                <p className="text-lg font-semibold text-emerald-900">All caught up!</p>
                <p className="mt-2 text-sm text-emerald-700">
                  No urgent items. Great time to strengthen relationships or research new leads.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <Link href="/tanjia/map">
                    <Button variant="secondary" size="sm">
                      Check the map
                    </Button>
                  </Link>
                  <Link href="/tanjia/tools/analyze">
                    <Button variant="secondary" size="sm">
                      Run research
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
