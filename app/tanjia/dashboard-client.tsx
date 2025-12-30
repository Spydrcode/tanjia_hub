'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { GradientHeading } from "@/src/components/ui/gradient-heading";
import { GradientPill } from "@/src/components/ui/gradient-pill";
import { gradientBg } from "@/src/components/ui/brand";
import { SensitiveText } from "@/src/components/ui/sensitive-text";
import { Badge } from "@/src/components/ui/badge";
import { useViewModes } from "@/src/components/ui/view-modes";

export type MeetingSummary = {
  id: string;
  title: string;
  start_at: string;
  location_name?: string | null;
  status?: string | null;
};

export type FollowupSummary = {
  id: string;
  lead_id: string;
  note?: string | null;
  due_at?: string | null;
  lead_name?: string | null;
};

export type LeadSummary = {
  id: string;
  name: string;
  website?: string | null;
  status?: string | null;
  lastSnapshot?: string | null;
  nextFollowup?: string | null;
};

type MetricDelta = { last7d: number; prev7d: number; delta: number };

type DashboardClientProps = {
  description: string;
  nextMeeting?: MeetingSummary;
  upcomingMeetings: MeetingSummary[];
  followupsDue: FollowupSummary[];
  leads: LeadSummary[];
  siteUrl: string;
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

function ActionTile({
  label,
  hint,
  href,
  variant = "secondary",
  icon,
}: {
  label: string;
  hint: string;
  href: string;
  variant?: "primary" | "secondary";
  icon?: ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group rounded-2xl border border-white/60 bg-white/70 p-4 shadow-md ring-1 ring-neutral-100 backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-900">{label}</p>
        {icon}
      </div>
      <p className="text-xs text-neutral-600">{hint}</p>
      <div className="pt-3">
        <Button asChild size="sm" variant={variant === "primary" ? "primary" : "secondary"} className="w-full justify-between">
          <Link href={href}>
            <span>{label}</span>
            <span aria-hidden>{">"}</span>
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

export default function DashboardClient({
  description,
  nextMeeting,
  upcomingMeetings,
  followupsDue,
  leads,
  siteUrl,
}: DashboardClientProps) {
  const router = useRouter();
  const { presentationMode, setPresentation, explainMode, toggleExplain } = useViewModes();
  const [metrics, setMetrics] = useState<Record<string, MetricDelta>>({});

  useEffect(() => {
    let active = true;
    fetch("/api/tanjia/metrics", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (!active) return;
        setMetrics(data || {});
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  const operatingStrip = useMemo(
    () =>
      [
        { key: "schedule_opened", label: "Scheduler opened" },
        { key: "bookings_created", label: "Bookings" },
        { key: "followups_created", label: "Follow-ups" },
        { key: "followups_completed", label: "Follow-ups done" },
      ]
        .map((item) => ({
          ...item,
          value: metrics[item.key],
        }))
        .filter(Boolean) as { key: string; label: string; value: MetricDelta }[],
    [metrics],
  );

  const handlePresent = () => {
    if (explainMode) toggleExplain();
    setPresentation(true);
    router.push("/tanjia/system-overview");
  };

  const copyClientLink = async () => {
    try {
      await navigator.clipboard?.writeText(`${siteUrl}/tanjia/system-overview`);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-100 bg-gradient-to-br from-emerald-50 via-white to-blue-50 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.35)]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-48 w-48 rounded-full bg-blue-200/40 blur-3xl" />
      </div>
      <div className="relative space-y-8 px-5 pb-12 pt-8 sm:px-8 sm:pt-10">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
          <motion.section variants={fadeUp} className="grid gap-6 lg:grid-cols-12 lg:items-start">
            <div className="space-y-4 lg:col-span-8">
              <GradientHeading
                eyebrow="Tanjia"
                leading="Networking"
                anchor="Hub"
                trailing="for today"
                subtitle={description}
              />
              <div className="grid gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-md ring-1 ring-neutral-100 backdrop-blur sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold text-neutral-900">What to do next</p>
                  <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                    <li>1) Create a meeting only if it helps the relationship.</li>
                    <li>2) Start capture; names stay masked in Presentation Mode.</li>
                    <li>3) Send follow-ups that feel true; no pressure.</li>
                  </ul>
                </div>
                <div className="flex flex-col gap-2 rounded-xl bg-gradient-to-br from-emerald-50 to-white p-3 shadow-inner">
                  <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">Micro-hints</p>
                  <p className="text-sm text-neutral-800">"Start capture" quietly logs the session.</p>
                  <p className="text-sm text-neutral-800">"Add lead quietly" keeps it internal.</p>
                  <p className="text-sm text-neutral-800">"Send a time link only if asked."</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4">
              <Card className={`shadow-lg ${gradientBg("surface")} border-white/70 bg-white/80 ring-1 ring-neutral-100 backdrop-blur`}>
                <CardHeader className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-neutral-600">Presentation tools</p>
                    {presentationMode ? <GradientPill label="On" tone="positive" className="px-2 py-0.5" /> : null}
                  </div>
                  <p className="text-lg font-semibold text-neutral-900">Client View</p>
                  <p className="text-sm text-neutral-700">
                    Hide sensitive details instantly. Opens the system overview for client-safe sharing.
                  </p>
                  <div className="flex flex-col gap-2">
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button className="w-full justify-center" size="md" onClick={handlePresent}>
                        Presentation Mode
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        className="w-full justify-center"
                        onClick={copyClientLink}
                      >
                        Copy client-safe link
                      </Button>
                    </motion.div>
                    <p className="text-xs text-neutral-600">
                      Suppresses explain-only UI automatically. Masks names, emails, and notes by default.
                    </p>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </motion.section>

          <motion.section variants={fadeUp} className="grid gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-8 border-white/70 bg-white/90 shadow-lg ring-1 ring-neutral-100 backdrop-blur">
              <CardHeader className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-600">Today</p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xl font-semibold text-neutral-900">
                    {nextMeeting ? "Your next session" : "No meetings yet today"}
                  </p>
                  <GradientPill label={`${followupsDue.length} due`} tone={followupsDue.length ? "positive" : "neutral"} />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-white via-white to-neutral-50 p-4 shadow-sm">
                  {nextMeeting ? (
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-neutral-900">{nextMeeting.title}</p>
                        <p className="text-sm text-neutral-700">
                          {format(new Date(nextMeeting.start_at), "EEE, MMM d at h:mma")}
                          {nextMeeting.location_name ? ` at ${nextMeeting.location_name}` : ""}
                        </p>
                        <p className="text-xs text-neutral-600">Stay calm; capture quietly and share only what feels true.</p>
                      </div>
                      <motion.div whileTap={{ scale: 0.97 }} className="flex flex-col items-start gap-2">
                        <Button asChild size="md" className="min-w-[180px] justify-center">
                          <Link href={`/tanjia/meetings/${nextMeeting.id}/start`}>Start capture</Link>
                        </Button>
                        <Link href="/tanjia/meetings" className="text-sm text-neutral-700 underline-offset-4 hover:underline">
                          Open meetings
                        </Link>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-base font-semibold text-neutral-900">Nothing on the calendar yet.</p>
                      <p className="text-sm text-neutral-700">If helpful, add a meeting and we&apos;ll prep you quietly.</p>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="md">
                          <Link href="/tanjia/meetings/new">Create meeting</Link>
                        </Button>
                        <Button asChild variant="secondary" size="md">
                          <Link href="/tanjia/scheduler">Open scheduler</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-neutral-900">Follow-ups queued</p>
                  {followupsDue.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {followupsDue.slice(0, 4).map((item) => (
                        <motion.div
                          key={item.id}
                          variants={fadeUp}
                          whileHover={{ y: -2 }}
                          className="rounded-xl border border-neutral-200 bg-white/80 p-3 shadow-sm backdrop-blur"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-neutral-900">
                              <SensitiveText text={item.lead_name || "Lead"} id={item.lead_id} />
                            </p>
                            <Badge variant="muted">Due</Badge>
                          </div>
                          <p className="text-sm text-neutral-700">
                            <SensitiveText text={item.note || "Follow up"} mask="note" />
                          </p>
                          <p className="text-xs text-neutral-500">
                            Due {item.due_at ? format(new Date(item.due_at), "MMM d, h:mma") : "soon"}
                          </p>
                          <Button asChild variant="secondary" size="sm" className="mt-2">
                            <Link href={`/tanjia/leads/${item.lead_id}`}>Open quietly</Link>
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-neutral-200 bg-white/70 p-4 text-sm text-neutral-700">
                      No follow-ups due. If helpful, add a lead to keep momentum.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-4 space-y-4">
              <Card className="border-white/70 bg-white/90 shadow-lg ring-1 ring-neutral-100 backdrop-blur">
                <CardHeader className="flex flex-col gap-3 pb-3">
                  <p className="text-sm font-semibold text-neutral-900">Quick actions</p>
                  <p className="text-sm text-neutral-600">One click, calm defaults.</p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 pt-0 sm:grid-cols-2">
                  <ActionTile label="Add lead" hint="Add lead quietly; no email sent." href="/tanjia/leads/new" />
                  <ActionTile label="Open scheduler" hint="Send a time link only if asked." href="/tanjia/scheduler" />
                  <ActionTile label="Open meetings" hint="Prep, capture, and finish." href="/tanjia/meetings" />
                  <ActionTile label="Reply helper" hint="Draft a calm reply in under a minute." href="/tanjia/helper" />
                </CardContent>
              </Card>

              <Card className={`border-white/70 bg-white/90 shadow-lg ring-1 ring-neutral-100 backdrop-blur`}>
                <CardHeader className="flex flex-col gap-2 pb-3">
                  <p className="text-sm font-semibold text-neutral-900">Operating rhythm</p>
                  <p className="text-xs text-neutral-600">Last 7 days; delta vs prior week</p>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 pt-0 sm:grid-cols-4">
                  {operatingStrip.length ? (
                    operatingStrip.map((item) => (
                      <div key={item.key} className="rounded-xl border border-neutral-200 bg-white/80 p-3 shadow-sm">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-neutral-500">{item.label}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <p className="text-xl font-semibold text-neutral-900">{item.value?.last7d ?? 0}</p>
                          <GradientPill delta={item.value?.delta} />
                        </div>
                        <p className="text-[11px] text-neutral-500">Prev: {item.value?.prev7d ?? 0}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-4 rounded-xl border border-dashed border-neutral-200 bg-white/70 p-3 text-sm text-neutral-600">
                      Numbers fill in once activity starts. Only aggregated counts are shown.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.section>

          <motion.section variants={fadeUp} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-neutral-900">Recent leads</p>
              <Button asChild size="sm" variant="secondary">
                <Link href="/tanjia/leads/new">Add lead quietly</Link>
              </Button>
            </div>
            <Card className="border-white/70 bg-white/90 shadow-lg ring-1 ring-neutral-100 backdrop-blur">
              <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
                {leads.length ? (
                  leads.slice(0, 4).map((lead) => (
                    <motion.div
                      key={lead.id}
                      variants={fadeUp}
                      whileHover={{ y: -2 }}
                      className="rounded-xl border border-neutral-200 bg-gradient-to-br from-white via-white to-neutral-50 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <p className="text-base font-semibold text-neutral-900">
                            <SensitiveText text={lead.name} id={lead.id} />
                          </p>
                          {lead.website ? <p className="text-xs text-neutral-600">{lead.website}</p> : null}
                        </div>
                        <Badge variant="muted">{lead.status || "new"}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-600">
                        <span>Last run: {lead.lastSnapshot ? format(new Date(lead.lastSnapshot), "MMM d, h:mma") : "Not yet"}</span>
                        <span>
                          Next follow-up:{" "}
                          {lead.nextFollowup ? format(new Date(lead.nextFollowup), "MMM d, h:mma") : "None"}
                        </span>
                      </div>
                      <div className="pt-2">
                        <Link href={`/tanjia/leads/${lead.id}`} className="text-sm text-neutral-800 underline-offset-4 hover:underline">
                          Open quietly
                        </Link>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-2 rounded-xl border border-dashed border-neutral-200 bg-white/70 p-6 text-sm text-neutral-700">
                    No leads yet. Add one person you want to follow; we&apos;ll keep it private.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>

          {upcomingMeetings.length > 1 ? (
            <motion.section variants={fadeUp} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-neutral-900">Also coming up</p>
                <Link href="/tanjia/meetings" className="text-sm text-neutral-700 underline-offset-4 hover:underline">
                  See all meetings
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {upcomingMeetings.slice(1, 5).map((m) => (
                  <Card key={m.id} className="border-white/70 bg-white/90 shadow-md ring-1 ring-neutral-100 backdrop-blur">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-neutral-900">{m.title}</p>
                        <Badge variant="muted">{m.status || "upcoming"}</Badge>
                      </div>
                      <p className="text-sm text-neutral-700">{format(new Date(m.start_at), "MMM d, h:mma")}</p>
                      {m.location_name ? <p className="text-xs text-neutral-600">{m.location_name}</p> : null}
                      <Button asChild variant="secondary" size="sm" className="mt-2">
                        <Link href={`/tanjia/meetings/${m.id}/start`}>Start capture</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
