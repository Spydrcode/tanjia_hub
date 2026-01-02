'use client';

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Clock, Calendar, XCircle, AlertTriangle } from "lucide-react";
import type { BookingCard } from "@/src/lib/tanjia/director-metrics";

type SchedulingPanelProps = {
  upcoming: BookingCard[];
  cancellations: BookingCard[];
  needsReview: BookingCard[];
};

export function SchedulingPanel({ upcoming, cancellations, needsReview }: SchedulingPanelProps) {
  const hasData = upcoming.length > 0 || cancellations.length > 0 || needsReview.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5" />
            Scheduling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
            <p className="text-sm text-neutral-600">No upcoming bookings scheduled</p>
            <Link
              href="/tanjia/scheduler"
              className="mt-2 inline-block text-sm text-emerald-600 hover:underline"
            >
              Open scheduler
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5" />
          Scheduling Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cancellations (Priority 1) */}
        {cancellations.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">Needs Gentle Follow-up</span>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {cancellations.length}
              </span>
            </div>
            <div className="space-y-2">
              {cancellations.slice(0, 3).map((booking) => (
                <Link
                  key={booking.id}
                  href={booking.leadId ? `/tanjia/leads/${booking.leadId}` : `/tanjia/scheduler`}
                  className="block rounded-lg border border-red-100 bg-red-50 p-3 transition hover:bg-red-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-900">{booking.leadName}</p>
                      <p className="text-xs text-red-600">
                        {booking.startTime ? formatDistanceToNow(new Date(booking.startTime), { addSuffix: true }) : "Recently canceled"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Needs Review */}
        {needsReview.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">Needs Review</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {needsReview.length}
              </span>
            </div>
            <div className="space-y-2">
              {needsReview.slice(0, 3).map((booking) => (
                <Link
                  key={booking.id}
                  href={booking.leadId ? `/tanjia/leads/${booking.leadId}` : `/tanjia/scheduler`}
                  className="block rounded-lg border border-amber-100 bg-amber-50 p-3 transition hover:bg-amber-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-900">{booking.leadName}</p>
                      <p className="text-xs text-amber-600 capitalize">{booking.status}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-900">Upcoming</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {upcoming.length}
              </span>
            </div>
            <div className="space-y-2">
              {upcoming.slice(0, 3).map((booking) => (
                <Link
                  key={booking.id}
                  href={booking.leadId ? `/tanjia/leads/${booking.leadId}` : `/tanjia/scheduler`}
                  className="block rounded-lg border border-emerald-100 bg-emerald-50 p-3 transition hover:bg-emerald-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-900">{booking.leadName}</p>
                      <p className="text-xs text-emerald-600">
                        {formatDistanceToNow(new Date(booking.startTime), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* View All Link */}
        <Link
          href="/tanjia/scheduler"
          className="block pt-2 text-center text-sm text-neutral-600 hover:text-emerald-600 hover:underline"
        >
          View all in scheduler →
        </Link>
      </CardContent>
    </Card>
  );
}
