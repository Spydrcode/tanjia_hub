'use client';

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Loader2, Target, AlertTriangle, TrendingDown } from "lucide-react";
import { DirectorHeaderStrip } from "@/src/components/tanjia/director/director-header-strip";
import { FollowupDebtPanel } from "@/src/components/tanjia/director/followup-debt-panel";
import { SchedulingPanel } from "@/src/components/tanjia/director/scheduling-panel";
import { useDirectorSnapshot } from "@/src/hooks/use-director-snapshot";
import { formatDistanceToNow } from "date-fns";

type FocusSlot = {
  id: string;
  leadId: string | null;
  leadName?: string;
  title: string;
  reason?: string;
  completed: boolean;
};

type Props = {
  todaysFocus?: FocusSlot[];
  leads?: Array<{ id: string; name: string }>;
};

export function ClarifyClientV2({ todaysFocus = [], leads = [] }: Props) {
  const { snapshot, loading, error } = useDirectorSnapshot();
  const [focusSlots, setFocusSlots] = useState(todaysFocus);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

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

  const { today, scheduling, followups, pipeline } = snapshot;
  
  // What's slipping computation
  const slippingItems = [
    ...followups.overdue.slice(0, 3).map(f => ({
      type: 'followup' as const,
      title: f.leadName,
      reason: f.note,
      urgency: 'overdue' as const,
      href: `/tanjia/leads/${f.leadId}`,
    })),
    ...scheduling.cancellations.slice(0, 2).map(b => ({
      type: 'cancellation' as const,
      title: b.leadName,
      reason: 'Recent cancellation needs gentle check-in',
      urgency: 'today' as const,
      href: b.leadId ? `/tanjia/leads/${b.leadId}` : '/tanjia/scheduler',
    })),
  ].slice(0, 5);

  // Why things are slipping
  const pressureSources = [];
  if (followups.overdue.length > 0) {
    pressureSources.push({
      source: 'Followup debt',
      count: followups.overdue.length,
      impact: 'Relationships going cold',
    });
  }
  if (scheduling.cancellations.length > 0) {
    pressureSources.push({
      source: 'Scheduling churn',
      count: scheduling.cancellations.length,
      impact: 'Momentum stalling',
    });
  }
  if (pipeline.leadsNeedingResearch > 0) {
    pressureSources.push({
      source: 'Research gaps',
      count: pipeline.leadsNeedingResearch,
      impact: 'Cannot move forward confidently',
    });
  }

  const handleToggleFocus = async (slotId: string) => {
    // Optimistic update
    setFocusSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, completed: !slot.completed } : slot
    ));
    
    // TODO: API call to update
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Director Metrics Strip */}
      <DirectorHeaderStrip metrics={{
        ...snapshot.today.dueNow,
        leadsNeedingResearch: snapshot.pipeline.leadsNeedingResearch
      }} />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Focus + Slipping */}
        <div className="space-y-6">
          {/* Today's Focus */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Today's Focus
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSlot(editingSlot === null ? 1 : null)}
                >
                  {editingSlot ? 'Cancel' : 'Set Focus'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {focusSlots.length === 0 && !editingSlot && (
                <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
                  <p className="text-sm text-neutral-600">No focus set for today</p>
                  <p className="mt-1 text-xs text-neutral-500">Choose 3 things that matter most</p>
                </div>
              )}

              {focusSlots.map((slot, idx) => (
                <div
                  key={slot.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition ${
                    slot.completed
                      ? 'border-emerald-200 bg-emerald-50 opacity-60'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <button
                    onClick={() => handleToggleFocus(slot.id)}
                    className={`mt-0.5 h-5 w-5 shrink-0 rounded border-2 transition ${
                      slot.completed
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-neutral-300 hover:border-emerald-500'
                    }`}
                  >
                    {slot.completed && (
                      <svg className="h-full w-full text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${slot.completed ? 'text-emerald-900 line-through' : 'text-neutral-900'}`}>
                      {slot.title}
                    </p>
                    {slot.reason && (
                      <p className="mt-1 text-xs text-neutral-600">{slot.reason}</p>
                    )}
                  </div>
                  {slot.leadId && (
                    <Link
                      href={`/tanjia/leads/${slot.leadId}`}
                      className="text-xs text-neutral-500 hover:text-neutral-700"
                    >
                      View →
                    </Link>
                  )}
                </div>
              ))}

              {focusSlots.length > 0 && (
                <p className="pt-2 text-center text-xs text-neutral-500">
                  {focusSlots.filter(s => s.completed).length} of {focusSlots.length} complete
                </p>
              )}
            </CardContent>
          </Card>

          {/* What's Slipping */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                What's Slipping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {slippingItems.length === 0 && (
                <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
                  <p className="text-sm font-medium text-emerald-900">Nothing slipping!</p>
                  <p className="mt-1 text-xs text-emerald-600">All caught up</p>
                </div>
              )}

              {slippingItems.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  className={`block rounded-lg border p-3 transition hover:opacity-80 ${
                    item.urgency === 'overdue'
                      ? 'border-red-200 bg-red-50'
                      : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold uppercase tracking-wide ${
                          item.urgency === 'overdue' ? 'text-red-700' : 'text-amber-700'
                        }`}>
                          {item.urgency === 'overdue' ? 'Overdue' : 'Today'}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm font-medium ${
                        item.urgency === 'overdue' ? 'text-red-900' : 'text-amber-900'
                      }`}>
                        {item.title}
                      </p>
                      <p className={`mt-1 text-xs ${
                        item.urgency === 'overdue' ? 'text-red-700' : 'text-amber-700'
                      }`}>
                        {item.reason}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Why This Is Slipping */}
          {pressureSources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingDown className="h-5 w-5 text-neutral-600" />
                  Why This Is Slipping
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pressureSources.map((source, idx) => (
                    <div key={idx} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-900">{source.source}</span>
                        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                          {source.count}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-600">{source.impact}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Scheduling + Followups */}
        <div className="space-y-6">
          <SchedulingPanel
            upcoming={scheduling.upcoming}
            cancellations={scheduling.cancellations}
            needsReview={scheduling.needsReview}
          />

          <FollowupDebtPanel
            overdue={followups.overdue}
            dueSoon={followups.dueSoon}
          />
        </div>
      </div>
    </div>
  );
}
