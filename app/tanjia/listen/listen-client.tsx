'use client';

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { MessageSquare, ArrowRight, Loader2 } from "lucide-react";
import { DirectorHeaderStrip } from "@/src/components/tanjia/director/director-header-strip";
import { SchedulingPanel } from "@/src/components/tanjia/director/scheduling-panel";
import { EmptyStateCalm } from "@/src/components/tanjia/director/empty-state-calm";
import { useDirectorSnapshot } from "@/src/hooks/use-director-snapshot";

export function ListenClient() {
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

  const { today, scheduling, recentActivity, pipeline } = snapshot;
  const hasMessages = recentActivity.latestMessages.length > 0;
  const hasNotes = recentActivity.latestNotes.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Director Metrics Strip */}
      <DirectorHeaderStrip metrics={{
        ...today.dueNow,
        leadsNeedingResearch: pipeline.leadsNeedingResearch
      }} />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Conversations */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5" />
                Active Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasMessages && (
                <EmptyStateCalm
                  whatsMissing="No recent messages or conversations yet"
                  nextAction={{
                    label: "Start a conversation",
                    href: "/tanjia/support",
                  }}
                />
              )}

              {hasMessages && (
                <>
                  {/* Recommended Next Thread */}
                  <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-900">
                        Recommended
                      </span>
                    </div>
                    <Link
                      href={recentActivity.latestMessages[0].leadId ? `/tanjia/leads/${recentActivity.latestMessages[0].leadId}` : "/tanjia/leads"}
                      className="group block"
                    >
                      <h3 className="text-base font-semibold text-emerald-900 group-hover:underline">
                        {recentActivity.latestMessages[0].leadName}
                      </h3>
                      <p className="mt-2 text-sm text-emerald-700">
                        {recentActivity.latestMessages[0].body.slice(0, 150)}
                        {recentActivity.latestMessages[0].body.length > 150 ? "..." : ""}
                      </p>
                      <p className="mt-2 text-xs text-emerald-600">
                        {formatDistanceToNow(new Date(recentActivity.latestMessages[0].createdAt), { addSuffix: true })}
                        {recentActivity.latestMessages[0].channel && ` · ${recentActivity.latestMessages[0].channel}`}
                      </p>
                    </Link>
                    <Button
                      asChild
                      size="sm"
                      className="mt-3 w-full"
                    >
                      <Link href={recentActivity.latestMessages[0].leadId ? `/tanjia/support?lead=${recentActivity.latestMessages[0].leadId}` : "/tanjia/support"}>
                        Draft response →
                      </Link>
                    </Button>
                  </div>

                  {/* Other Recent Messages */}
                  {recentActivity.latestMessages.length > 1 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-neutral-700">Other conversations</h4>
                      {recentActivity.latestMessages.slice(1, 5).map((msg) => (
                        <Link
                          key={msg.id}
                          href={msg.leadId ? `/tanjia/leads/${msg.leadId}` : "/tanjia/leads"}
                          className="block rounded-lg border border-neutral-200 bg-white p-3 transition hover:bg-neutral-50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-neutral-900">{msg.leadName}</p>
                              <p className="mt-1 text-xs text-neutral-600">
                                {msg.body.slice(0, 80)}
                                {msg.body.length > 80 ? "..." : ""}
                              </p>
                              <p className="mt-1 text-xs text-neutral-500">
                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}

              {hasMessages && (
                <Link
                  href="/tanjia/leads"
                  className="block pt-2 text-center text-sm text-neutral-600 hover:text-emerald-600 hover:underline"
                >
                  View all leads →
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          {hasNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentActivity.latestNotes.slice(0, 3).map((note) => (
                    <Link
                      key={note.id}
                      href={note.leadId ? `/tanjia/leads/${note.leadId}` : "/tanjia/leads"}
                      className="block rounded-lg border border-neutral-100 bg-neutral-50 p-3 transition hover:bg-neutral-100"
                    >
                      <p className="text-sm font-medium text-neutral-900">{note.leadName}</p>
                      <p className="mt-1 text-xs text-neutral-600">
                        {note.body.slice(0, 100)}
                        {note.body.length > 100 ? "..." : ""}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Scheduling + Context */}
        <div className="space-y-6">
          <SchedulingPanel
            upcoming={scheduling.upcoming}
            cancellations={scheduling.cancellations}
            needsReview={scheduling.needsReview}
          />

          {/* Suggested Questions for Context */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Open Loops</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-neutral-700">Questions to explore:</p>
                <ul className="space-y-2">
                  {[
                    "What's been taking the most energy lately?",
                    "Where does friction show up most often?",
                    "What would make the biggest difference in 30 days?",
                  ].map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                      <span className="shrink-0 text-neutral-400">—</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
