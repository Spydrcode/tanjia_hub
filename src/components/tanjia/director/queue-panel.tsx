'use client';

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ArrowRight, AlertCircle } from "lucide-react";
import type { NextMove } from "@/src/lib/tanjia/director-metrics";

type QueuePanelProps = {
  nextMove: NextMove;
  items?: Array<{
    id: string;
    title: string;
    subtitle: string;
    href: string;
    urgency: 'overdue' | 'today' | 'soon' | 'normal';
  }>;
};

export function QueuePanel({ nextMove, items = [] }: QueuePanelProps) {
  const urgencyStyles = {
    overdue: "border-red-200 bg-red-50 text-red-900",
    today: "border-amber-200 bg-amber-50 text-amber-900",
    soon: "border-blue-200 bg-blue-50 text-blue-900",
    normal: "border-neutral-200 bg-neutral-50 text-neutral-900",
  };

  const urgencyBadgeStyles = {
    overdue: "bg-red-200 text-red-900",
    today: "bg-amber-200 text-amber-900",
    soon: "bg-blue-200 text-blue-900",
    normal: "bg-neutral-200 text-neutral-900",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRight className="h-5 w-5" />
          Next Move
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recommended Next Move (Pinned) */}
        <div className={`rounded-lg border p-4 ${urgencyStyles[nextMove.urgency]}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {nextMove.urgency === 'overdue' && <AlertCircle className="h-4 w-4" />}
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${urgencyBadgeStyles[nextMove.urgency]}`}>
                  {nextMove.urgency === 'overdue' ? 'Overdue' : nextMove.urgency === 'today' ? 'Today' : 'Recommended'}
                </span>
              </div>
              <h3 className="text-base font-semibold">{nextMove.title}</h3>
              <p className="mt-1 text-sm opacity-75">{nextMove.why}</p>
            </div>
            <Button
              asChild
              size="sm"
              className="shrink-0"
            >
              <Link href={nextMove.ctaHref}>
                Do this →
              </Link>
            </Button>
          </div>
        </div>

        {/* Supporting Queue */}
        {items.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-neutral-700">Up next</h4>
            {items.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`block rounded-lg border p-3 transition hover:opacity-80 ${urgencyStyles[item.urgency]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs opacity-75">{item.subtitle}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-50" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
