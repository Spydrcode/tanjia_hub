'use client';

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { AlertCircle, Clock, Check } from "lucide-react";
import type { FollowupCard } from "@/src/lib/tanjia/director-metrics";

type FollowupDebtPanelProps = {
  overdue: FollowupCard[];
  dueSoon: FollowupCard[];
  onComplete?: (id: string, leadId: string) => void;
};

export function FollowupDebtPanel({ overdue, dueSoon, onComplete }: FollowupDebtPanelProps) {
  const hasData = overdue.length > 0 || dueSoon.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Check className="h-5 w-5 text-emerald-600" />
            Followups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
            <p className="text-sm font-medium text-emerald-900">All caught up!</p>
            <p className="mt-1 text-xs text-emerald-600">No followups due right now</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="h-5 w-5" />
          Followup Debt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overdue (Priority 1) */}
        {overdue.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">Overdue</span>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {overdue.length}
              </span>
            </div>
            <div className="space-y-2">
              {overdue.slice(0, 5).map((followup) => (
                <div
                  key={followup.id}
                  className="rounded-lg border border-red-100 bg-red-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <Link
                        href={`/tanjia/leads/${followup.leadId}`}
                        className="text-sm font-medium text-red-900 hover:underline"
                      >
                        {followup.leadName}
                      </Link>
                      <p className="mt-1 text-xs text-red-700">{followup.note}</p>
                      <p className="mt-1 text-xs text-red-500">
                        {followup.dueAt ? formatDistanceToNow(new Date(followup.dueAt), { addSuffix: true }) : "No due date"}
                      </p>
                    </div>
                    {onComplete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onComplete(followup.id, followup.leadId)}
                        className="shrink-0 text-red-700 hover:bg-red-200 hover:text-red-900"
                      >
                        Done
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Due Soon */}
        {dueSoon.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">Due Soon</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {dueSoon.length}
              </span>
            </div>
            <div className="space-y-2">
              {dueSoon.slice(0, 5).map((followup) => (
                <div
                  key={followup.id}
                  className="rounded-lg border border-amber-100 bg-amber-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <Link
                        href={`/tanjia/leads/${followup.leadId}`}
                        className="text-sm font-medium text-amber-900 hover:underline"
                      >
                        {followup.leadName}
                      </Link>
                      <p className="mt-1 text-xs text-amber-700">{followup.note}</p>
                      <p className="mt-1 text-xs text-amber-500">
                        {followup.dueAt ? formatDistanceToNow(new Date(followup.dueAt), { addSuffix: true }) : "No due date"}
                      </p>
                    </div>
                    {onComplete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onComplete(followup.id, followup.leadId)}
                        className="shrink-0 text-amber-700 hover:bg-amber-200 hover:text-amber-900"
                      >
                        Done
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View All Link */}
        <Link
          href="/tanjia/decide"
          className="block pt-2 text-center text-sm text-neutral-600 hover:text-emerald-600 hover:underline"
        >
          View all followups →
        </Link>
      </CardContent>
    </Card>
  );
}
