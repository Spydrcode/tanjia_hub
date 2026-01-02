'use client';

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Loader2, Activity, TrendingUp, Layers, AlertCircle } from "lucide-react";
import { DirectorHeaderStrip } from "@/src/components/tanjia/director/director-header-strip";
import { LeadCoveragePanel } from "@/src/components/tanjia/director/lead-coverage-panel";
import { useDirectorSnapshot } from "@/src/hooks/use-director-snapshot";

export function MapClientV2() {
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

  const { today, pipeline, followups, scheduling } = snapshot;

  // Compute pressure sources
  const pressureSources: Array<{
    source: string;
    count: number;
    severity: 'high' | 'medium' | 'low';
    impact: string;
    href: string;
  }> = [
    {
      source: 'Followup Debt',
      count: followups.overdue.length + followups.dueSoon.length,
      severity: (followups.overdue.length > 0 ? 'high' : followups.dueSoon.length > 3 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      impact: 'Relationships cooling, momentum stalling',
      href: '/tanjia/decide',
    },
    {
      source: 'Scheduling Churn',
      count: scheduling.cancellations.length + scheduling.needsReview.length,
      severity: (scheduling.cancellations.length > 0 ? 'high' : 'low') as 'high' | 'medium' | 'low',
      impact: 'Energy spent on coordination instead of connection',
      href: '/tanjia/scheduler',
    },
    {
      source: 'Research Gaps',
      count: pipeline.leadsNeedingResearch,
      severity: (pipeline.leadsNeedingResearch > 3 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      impact: 'Cannot move forward confidently on outreach',
      href: '/tanjia/tools/analyze',
    },
    {
      source: 'Stale Threads',
      count: pipeline.leadsNeedingFollowup,
      severity: (pipeline.leadsNeedingFollowup > 5 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      impact: 'Conversations dying from lack of touch',
      href: '/tanjia/leads',
    },
  ].filter(p => p.count > 0);

  // Pipeline health by stage
  const pipelineStages: Array<{
    stage: string;
    count: number;
    description: string;
    color: 'emerald' | 'blue' | 'amber' | 'neutral';
  }> = [
    {
      stage: 'Active',
      count: pipeline.leadsActive,
      description: 'Regular contact, moving forward',
      color: 'emerald',
    },
    {
      stage: 'Warming',
      count: pipeline.leadsInScheduling,
      description: 'In scheduling or recent research',
      color: 'blue',
    },
    {
      stage: 'Cold',
      count: pipeline.leadsNeedingFollowup,
      description: 'No recent touch, needs reactivation',
      color: 'amber',
    },
    {
      stage: 'Research Needed',
      count: pipeline.leadsNeedingResearch,
      description: 'Cannot act confidently yet',
      color: 'neutral',
    },
  ];

  const biggestGap = pressureSources.sort((a, b) => {
    const severityOrder: Record<'high' | 'medium' | 'low', number> = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  })[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Director Metrics Strip */}
      <DirectorHeaderStrip metrics={{
        ...today.dueNow,
        leadsNeedingResearch: pipeline.leadsNeedingResearch
      }} />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Pressure + Pipeline */}
        <div className="space-y-6">
          {/* Pressure Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5" />
                Pressure Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pressureSources.length === 0 && (
                <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
                  <p className="text-sm font-medium text-emerald-900">System looks healthy</p>
                  <p className="mt-1 text-xs text-emerald-600">No major pressure points</p>
                </div>
              )}

              {pressureSources.map((source, idx) => {
                const severityColors = {
                  high: 'border-red-200 bg-red-50 text-red-900',
                  medium: 'border-amber-200 bg-amber-50 text-amber-900',
                  low: 'border-neutral-200 bg-neutral-50 text-neutral-900',
                };
                const badgeColors = {
                  high: 'bg-red-200 text-red-900',
                  medium: 'bg-amber-200 text-amber-900',
                  low: 'bg-neutral-200 text-neutral-700',
                };

                return (
                  <Link
                    key={idx}
                    href={source.href}
                    className={`block rounded-lg border p-4 transition hover:opacity-80 ${severityColors[source.severity]}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">{source.source}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColors[source.severity]}`}>
                            {source.count}
                          </span>
                        </div>
                        <p className="text-xs opacity-75">{source.impact}</p>
                      </div>
                      {source.severity === 'high' && (
                        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                      )}
                    </div>
                  </Link>
                );
              })}

              {biggestGap && (
                <Button asChild className="w-full mt-2">
                  <Link href={biggestGap.href}>
                    Address biggest pressure: {biggestGap.source} →
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-5 w-5" />
                Pipeline Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pipelineStages.map((stage, idx) => {
                  const colorClasses = {
                    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
                    blue: 'border-blue-200 bg-blue-50 text-blue-900',
                    amber: 'border-amber-200 bg-amber-50 text-amber-900',
                    neutral: 'border-neutral-200 bg-neutral-50 text-neutral-900',
                  };

                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 ${colorClasses[stage.color]}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{stage.stage}</p>
                          <p className="text-xs opacity-75">{stage.description}</p>
                        </div>
                        <span className="text-xl font-bold">{stage.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="text-xs text-neutral-600 text-center">
                  Total pipeline: {pipelineStages.reduce((sum, s) => sum + s.count, 0)} leads
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Coverage + Tool Footprint */}
        <div className="space-y-6">
          <LeadCoveragePanel
            leadsNeedingResearch={pipeline.leadsNeedingResearch}
            leadsNeedingFollowup={pipeline.leadsNeedingFollowup}
            leadsActive={pipeline.leadsActive}
          />

          {/* Tool Footprint (from analyses) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5" />
                System Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Analyses Run</p>
                    <p className="text-xs text-blue-600">Understanding their context</p>
                  </div>
                  <p className="text-xl font-bold text-blue-900">
                    {snapshot.toolHealth.lastAnalysisAt ? '✓' : '—'}
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-violet-100 bg-violet-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-violet-900">Drafts Created</p>
                    <p className="text-xs text-violet-600">Ready to send</p>
                  </div>
                  <p className="text-xl font-bold text-violet-900">
                    {snapshot.toolHealth.lastNetworkingDraftAt ? '✓' : '—'}
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Scheduler Connected</p>
                    <p className="text-xs text-emerald-600">Webhooks working</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-900">
                    {snapshot.toolHealth.calWebhookOk ? '✓' : '—'}
                  </p>
                </div>
              </div>

              <Link
                href="/tanjia/tools"
                className="mt-4 block text-center text-sm text-neutral-600 hover:text-emerald-600 hover:underline"
              >
                View all tools →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
