import type { Metadata } from "next";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { GradientHeading } from "@/src/components/ui/gradient-heading";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { Calendar, Clock, Flag } from "lucide-react";
import { Composer } from "@/app/tanjia/components/composer";
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: "Demo Today | 2ndmynd Hub",
  description: "Demo dashboard",
};

const DEMO_WS = '22222222-2222-2222-2222-222222222222';

export default async function DemoTodayPage() {
  const { supabase } = await requireAuthOrRedirect();

  const now = new Date();
  const next7Days = addDays(now, 7);

  const { data: upcomingMeetings } = await supabase
    .from('meetings')
    .select('id, title, start_at, status, group_name, location_name')
    .eq('workspace_id', DEMO_WS)
    .gte('start_at', now.toISOString())
    .lte('start_at', next7Days.toISOString())
    .order('start_at', { ascending: true })
    .limit(5);

  const { data: overdueFollowups } = await supabase
    .from('followups')
    .select('id, note, due_at, lead_id')
    .eq('workspace_id', DEMO_WS)
    .eq('done', false)
    .lt('due_at', now.toISOString())
    .order('due_at', { ascending: true })
    .limit(5);

  const { data: todayFollowups } = await supabase
    .from('followups')
    .select('id, note, due_at, lead_id')
    .eq('workspace_id', DEMO_WS)
    .eq('done', false)
    .gte('due_at', now.toISOString())
    .lt('due_at', addDays(now,1).toISOString())
    .order('due_at', { ascending: true })
    .limit(5);

  const { data: recentBookings } = await supabase
    .from('lead_bookings')
    .select('id, lead_name, company, status, created_at')
    .eq('workspace_id', DEMO_WS)
    .gte('created_at', addDays(now, -7).toISOString())
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <GradientHeading leading="Demo" anchor="Today" trailing="Dashboard" size="lg" />
        <p className="text-sm text-neutral-500">
          {format(now, "EEEE, MMMM d, yyyy")} · Demo data
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
            <Link href="/demo/meetings" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View all →</Link>
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
                        {meeting.group_name && ` · ${meeting.group_name}`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No upcoming meetings in demo data.</p>
          )}

          <div className="mt-4 flex gap-2">
            <Link href="/demo/meetings?action=new" className="flex-1 rounded-md bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-700">New Meeting</Link>
            <Link href="/demo/scheduler" className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-center text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50">Schedule Call</Link>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Followups</h2>
            </div>
            <Link href="/demo/followups" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View all →</Link>
          </div>

          {(overdueFollowups && overdueFollowups.length > 0) ? (
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-600">Overdue ({overdueFollowups.length})</h3>
              <div className="space-y-2">
                {overdueFollowups.slice(0,3).map((f: any) => (
                  <Link key={f.id} href={`/demo/leads/${f.lead_id}`} className="block rounded-lg border border-red-200 bg-red-50/50 p-3 transition hover:border-red-300">
                    <p className="font-medium text-neutral-900">Followup</p>
                    <p className="mt-1 text-sm text-neutral-600">{f.note}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No demo followups overdue.</p>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-neutral-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Recent Bookings</h2>
          </div>

          {recentBookings && recentBookings.length > 0 ? (
            <div className="space-y-2">
              {recentBookings.map((booking: any) => (
                <div key={booking.id} className="rounded-lg border border-neutral-200 p-3">
                  <p className="font-medium text-neutral-900">{booking.lead_name}</p>
                  {booking.company && <p className="text-sm text-neutral-600">{booking.company}</p>}
                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                    <span>{format(parseISO(booking.created_at), "MMM d, h:mm a")}</span>
                    <span className="rounded-full bg-neutral-100 px-2 py-1 text-neutral-700">{booking.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No recent demo bookings.</p>
          )}
        </div>
      </div>
    </div>
  );
}
