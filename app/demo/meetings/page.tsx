import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { DEMO_WORKSPACE_ID } from "@/src/lib/workspaces/constants";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { brandGradients } from "@/src/components/ui/brand";
import { PageHeader } from "@/src/components/ui/page-header";
import { startMeeting } from "@/app/tanjia/meetings/actions";

export const metadata: Metadata = {
  title: "Demo Meetings",
  description: "Demo meetings scoped to demo workspace.",
};

type Meeting = {
  id: string;
  title: string;
  group_name?: string | null;
  start_at: string;
  status: string;
  location_name?: string | null;
  address?: string | null;
};

export default async function DemoMeetingsPage() {
  const { supabase, user } = await requireAuthOrRedirect();
  const nowIso = new Date().toISOString();

  const withWorkspace = await supabase
    .from("meetings")
    .select("id, title, group_name, start_at, status, location_name, address")
    .eq('workspace_id', DEMO_WORKSPACE_ID)
    .order("start_at", { ascending: true });

  const legacy = withWorkspace.error?.message?.includes("workspace_id")
    ? await supabase
        .from("meetings")
        .select("id, title, group_name, start_at, status, location_name, address")
        .eq("owner_id", user.id)
        .order("start_at", { ascending: true })
    : null;

  const meetings: Meeting[] = (withWorkspace.data || legacy?.data || []) as Meeting[];
  const upcoming = meetings.filter((m) => m.start_at >= nowIso);
  const past = meetings.filter((m) => m.start_at < nowIso);

  const renderCard = (m: Meeting) => (
    <Card key={m.id} className={`shadow-sm bg-gradient-to-br ${brandGradients.surface}`} data-testid="meeting-row" data-meeting-id={m.id}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900">{m.title}</p>
            {m.group_name ? <p className="text-xs text-neutral-600">{m.group_name}</p> : null}
          </div>
          <Badge variant="muted">{m.status}</Badge>
        </div>
        <p className="text-sm text-neutral-700">{format(new Date(m.start_at), "MMM d, h:mma")}</p>
        {m.location_name ? (
          <p className="text-xs text-neutral-600">{m.location_name}</p>
        ) : null}
        {m.address ? <p className="text-xs text-neutral-500">{m.address}</p> : null}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild size="sm" variant="ghost">
              <Link href={`/demo/meetings/${m.id}`}>View</Link>
            </Button>
            <form action={startMeeting.bind(null, m.id)}>
              <Button size="sm" type="submit" variant="secondary">
                Start meeting
              </Button>
            </form>
          </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Meetings"
        anchor="Flow"
        eyebrow="Tanjia"
        description="Plan, capture, and follow up quietly."
        actionLabel="New meeting"
        actionDisabled
        actionTooltip="Demo mode: read-only"
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Upcoming</h2>
          <p className="text-sm text-neutral-600">{upcoming.length} scheduled</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2" data-testid="meetings-list">
          {upcoming.length ? upcoming.map(renderCard) : <p className="text-sm text-neutral-600">No upcoming meetings.</p>}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Past</h2>
          <p className="text-sm text-neutral-600">{past.length} recorded</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {past.length ? past.map(renderCard) : <p className="text-sm text-neutral-600">No past meetings yet.</p>}
        </div>
      </section>
    </div>
  );
}

