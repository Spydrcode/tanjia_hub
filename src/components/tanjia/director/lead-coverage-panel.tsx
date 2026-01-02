'use client';

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { TrendingUp, AlertCircle } from "lucide-react";

type LeadCoveragePanelProps = {
  leadsNeedingResearch: number;
  leadsNeedingFollowup: number;
  leadsActive: number;
};

export function LeadCoveragePanel({
  leadsNeedingResearch,
  leadsNeedingFollowup,
  leadsActive,
}: LeadCoveragePanelProps) {
  const hasGaps = leadsNeedingResearch > 0 || leadsNeedingFollowup > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5" />
          Pipeline Coverage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Active Leads */}
          <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 p-3">
            <span className="text-sm font-medium text-emerald-900">Active Leads</span>
            <span className="rounded-full bg-emerald-200 px-3 py-1 text-sm font-semibold text-emerald-900">
              {leadsActive}
            </span>
          </div>

          {/* Needs Research */}
          {leadsNeedingResearch > 0 && (
            <Link
              href="/tanjia/map"
              className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 p-3 transition hover:bg-blue-100"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Needs Research</span>
              </div>
              <span className="rounded-full bg-blue-200 px-3 py-1 text-sm font-semibold text-blue-900">
                {leadsNeedingResearch}
              </span>
            </Link>
          )}

          {/* Needs Followup */}
          {leadsNeedingFollowup > 0 && (
            <Link
              href="/tanjia/decide"
              className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 p-3 transition hover:bg-amber-100"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">Needs Followup</span>
              </div>
              <span className="rounded-full bg-amber-200 px-3 py-1 text-sm font-semibold text-amber-900">
                {leadsNeedingFollowup}
              </span>
            </Link>
          )}

          {!hasGaps && (
            <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-4 text-center">
              <p className="text-sm text-neutral-600">All leads have coverage</p>
            </div>
          )}
        </div>

        <Link
          href="/tanjia/leads"
          className="mt-4 block text-center text-sm text-neutral-600 hover:text-emerald-600 hover:underline"
        >
          View all leads →
        </Link>
      </CardContent>
    </Card>
  );
}
