'use client';

import Link from "next/link";
import { Clock, AlertCircle, Calendar, TrendingUp } from "lucide-react";

type DirectorHeaderStripProps = {
  metrics: {
    followupsOverdue: number;
    nextTouchesDue: number;
    bookingsUpcomingToday: number;
    leadsNeedingResearch: number;
  };
};

export function DirectorHeaderStrip({ metrics }: DirectorHeaderStripProps) {
  const pills = [
    {
      label: "Overdue Followups",
      value: metrics.followupsOverdue,
      icon: AlertCircle,
      color: metrics.followupsOverdue > 0 ? "text-red-600 bg-red-50" : "text-neutral-500 bg-neutral-100",
      href: "/tanjia/decide",
    },
    {
      label: "Next Touches Due",
      value: metrics.nextTouchesDue,
      icon: Clock,
      color: metrics.nextTouchesDue > 0 ? "text-amber-600 bg-amber-50" : "text-neutral-500 bg-neutral-100",
      href: "/tanjia/decide",
    },
    {
      label: "Today's Bookings",
      value: metrics.bookingsUpcomingToday,
      icon: Calendar,
      color: metrics.bookingsUpcomingToday > 0 ? "text-emerald-600 bg-emerald-50" : "text-neutral-500 bg-neutral-100",
      href: "/tanjia/scheduler",
    },
    {
      label: "Needs Research",
      value: metrics.leadsNeedingResearch,
      icon: TrendingUp,
      color: metrics.leadsNeedingResearch > 0 ? "text-blue-600 bg-blue-50" : "text-neutral-500 bg-neutral-100",
      href: "/tanjia/map",
    },
  ];

  return (
    <div className="flex flex-wrap gap-3 border-b border-neutral-200 bg-white/50 px-6 py-4">
      {pills.map((pill) => {
        const Icon = pill.icon;
        return (
          <Link
            key={pill.label}
            href={pill.href}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition hover:opacity-80 ${pill.color}`}
          >
            <Icon className="h-4 w-4" />
            <span className="font-semibold">{pill.value}</span>
            <span className="text-xs opacity-75">{pill.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
