import type { Metadata } from "next";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { GradientHeading } from "@/src/components/ui/gradient-heading";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { Calendar, Clock, Flag, CheckCircle } from "lucide-react";
import { Composer } from "@/app/tanjia/components/composer";
import { DEMO_WORKSPACE_ID } from "@/src/lib/workspaces/constants";

export const metadata: Metadata = {
  title: "Demo Today",
  description: "Demo Today dashboard scoped to demo workspace",
};

export default async function DemoTodayPage() {
  const { supabase } = await requireAuthOrRedirect();
  const now = new Date();
  const next7Days = addDays(now, 7);

  // Fetch upcoming meetings scoped to demo workspace
  const { data: upcomingMeetings } = await supabase
    .from("meetings")
    .select("id, title, start_at, status, group_name, location_name")
    .eq("workspace_id", DEMO_WORKSPACE_ID)
    .in("status", ["planned", "in_progress"])
    .gte("start_at", now.toISOString())
    .lte("start_at", next7Days.toISOString())
    .order("start_at", { ascending: true })
    .limit(5);

  // Fetch overdue followups
  const { data: overdueFollowups } = await supabase
    .from("followups")
    .select("id, note, due_at, lead_id, leads!inner(name, company)")
    .eq("workspace_id", DEMO_WORKSPACE_ID)
    .eq("done", false)
    .lt("due_at", now.toISOString())
    .order("due_at", { ascending: true })
    .limit(5);

  // Fetch today's followups
  const { data: todayFollowups } = await supabase
    .from("followups")
    .select("id, note, due_at, lead_id, leads!inner(name, company)")
    .eq("workspace_id", DEMO_WORKSPACE_ID)
    .eq("done", false)
    .gte("due_at", now.toISOString())
    .lt("due_at", addDays(now, 1).toISOString())
    .order("due_at", { ascending: true })
    .limit(5);

  // Fetch recent bookings (last 7 days)
  const { data: recentBookings } = await supabase
    .from("lead_bookings")
    .select("id, lead_name, company, status, created_at")
    .eq("workspace_id", DEMO_WORKSPACE_ID)
    .gte("created_at", addDays(now, -7).toISOString())
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch metrics via API (no change)
  const metricsRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/tanjia/metrics`,
    { cache: "no-store" }
  );
  const metrics = metricsRes.ok ? await metricsRes.json() : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <GradientHeading leading="Your" anchor="Today" trailing="Dashboard" size="lg" />
        <p className="text-sm text-neutral-500">
          {format(now, "EEEE, MMMM d, yyyy")} - Quick view of what needs attention
        </p>
      </div>

      <Composer />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Upcoming Meetings</h2>
            </div>
            <Link
              href="/demo/meetings" data-testid="today-upcoming-meetings-view-all"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              View all &gt;
            </Link>
          </div>

          {upcomingMeetings && upcomingMeetings.length > 0 ? (
            <div className="space-y-3">
              {upcomingMeetings.map((meeting: any) => (
                <Link
                  key={meeting.id}
                  href={`/demo/meetings/${meeting.id}`}
                  className="block rounded-lg border border-neutral-200 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-neutral-900">{meeting.title}</h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        {format(parseISO(meeting.start_at), "MMM d, h:mm a")}
                        {meeting.group_name && ` - ${meeting.group_name}`}
                      </p>
                    </div>
                    {meeting.status === "in_progress" && (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                        In Progress
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No upcoming meetings in the next 7 days.</p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled
              title="Demo mode: read-only"
              className="flex-1 rounded-md bg-emerald-200 px-3 py-2 text-center text-sm font-semibold text-emerald-900"
            >
              New Meeting
            </button>
            <Link
              href="/demo/scheduler"
              className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-center text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
            >
              Schedule Call
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Followups</h2>
            </div>
            <Link
              href="/demo/followups" data-testid="today-followups-view-all"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              View all &gt;
            </Link>
          </div>

          {overdueFollowups && overdueFollowups.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-600">
                Overdue ({overdueFollowups.length})
              </h3>
              <div className="space-y-2">
                {(overdueFollowups as any[]).slice(0, 3).map((followup) => (
                  <Link
                    key={followup.id}
                    href={`/demo/leads/${followup.lead_id}`}
                    className="block rounded-lg border border-red-200 bg-red-50/50 p-3 transition hover:border-red-300"
                  >
                    <p className="font-medium text-neutral-900">{followup.leads.name}</p>
                    <p className="mt-1 text-sm text-neutral-600">{followup.note}</p>
                    <p className="mt-1 text-xs text-red-600">
                      Due: {format(parseISO(followup.due_at), "MMM d, h:mm a")}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {todayFollowups && todayFollowups.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Today ({todayFollowups.length})
              </h3>
              <div className="space-y-2">
                {(todayFollowups as any[]).slice(0, 3).map((followup) => (
                  <Link
                    key={followup.id}
                    href={`/demo/leads/${followup.lead_id}`}
                    className="block rounded-lg border border-neutral-200 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/50"
                  >
                    <p className="font-medium text-neutral-900">{followup.leads.name}</p>
                    <p className="mt-1 text-sm text-neutral-600">{followup.note}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Due: {format(parseISO(followup.due_at), "h:mm a")}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(!overdueFollowups || overdueFollowups.length === 0) &&
            (!todayFollowups || todayFollowups.length === 0) && (
              <p className="text-sm text-neutral-500">No followups due today.</p>
            )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-neutral-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Recent Bookings</h2>
            </div>
            <Link
              href="/demo/leads"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              View all &gt;
            </Link>
          </div>

          {recentBookings && recentBookings.length > 0 ? (
            <div className="space-y-2">
              {recentBookings.map((booking: any) => (
                <div
                  key={booking.id}
                  className="rounded-lg border border-neutral-200 p-3"
                >
                  <p className="font-medium text-neutral-900">{booking.lead_name}</p>
                  {booking.company && (
                    <p className="text-sm text-neutral-600">{booking.company}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                    <span>{format(parseISO(booking.created_at), "MMM d, h:mm a")}</span>
                    <span className="rounded-full bg-neutral-100 px-2 py-1 text-neutral-700">
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No recent bookings in the last 7 days.</p>
          )}
        </div>

        {metrics && (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-neutral-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Last 7 Days</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {metrics.current?.bookings?.created || 0}
                </p>
                <p className="text-sm text-neutral-500">Bookings Created</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {metrics.current?.followups?.completed || 0}
                </p>
                <p className="text-sm text-neutral-500">Followups Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {metrics.current?.messages?.scheduleOpened || 0}
                </p>
                <p className="text-sm text-neutral-500">Schedules Opened</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {metrics.current?.bookings?.unmatchedCount || 0}
                </p>
                <p className="text-sm text-neutral-500">Need Review</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

