import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { zones, zoneOrder, loopLine } from "@/app/tanjia/lib/zones";
import { GradientHeading } from "@/src/components/ui/gradient-heading";
import Link from "next/link";
import { ArrowRight, User, Calendar, MessageSquare, Globe, FileText, CheckCircle } from "lucide-react";

const zoneIcons = {
  listen: MessageSquare,
  clarify: FileText,
  map: Globe,
  decide: CheckCircle,
  support: User,
} as const;

export default async function SystemPage() {
  const supabase = await createSupabaseServerClient();

  // Fetch current state
  let stats = {
    leads: 0,
    activeLead: null as { id: string; name: string } | null,
    pendingFollowups: 0,
    todayFollowups: 0,
    upcomingMeetings: 0,
    recentAnalyses: 0,
  };

  try {
    // Count leads
    const { count: leadCount } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true });
    stats.leads = leadCount || 0;

    // Get active lead (most recently updated)
    const { data: activeLead } = await supabase
      .from("leads")
      .select("id, name")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();
    stats.activeLead = activeLead;

    // Count pending followups
    const { count: pendingCount } = await supabase
      .from("followups")
      .select("*", { count: "exact", head: true })
      .eq("completed", false);
    stats.pendingFollowups = pendingCount || 0;

    // Count today's followups
    const today = new Date().toISOString().split("T")[0];
    const { count: todayCount } = await supabase
      .from("followups")
      .select("*", { count: "exact", head: true })
      .eq("completed", false)
      .lte("due_date", today);
    stats.todayFollowups = todayCount || 0;

  } catch {
    // Demo fallback
    stats = {
      leads: 12,
      activeLead: { id: "1", name: "Sarah Chen" },
      pendingFollowups: 5,
      todayFollowups: 2,
      upcomingMeetings: 1,
      recentAnalyses: 3,
    };
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <GradientHeading 
          anchor="System Overview" 
          size="xl" 
          align="center"
        />
        <p className="text-sm text-neutral-500 max-w-md mx-auto">
          {loopLine}
        </p>
      </div>

      {/* Current Lead Status */}
      {stats.activeLead && (
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50/80 to-violet-50/40 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-blue-600 font-medium">Current Focus</p>
                <p className="text-lg font-semibold text-blue-900 mt-1">{stats.activeLead.name}</p>
              </div>
              <Link
                href={`/tanjia/leads/${stats.activeLead.id}`}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zone Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
          The Loop
        </h2>
        <div className="grid gap-3">
          {zoneOrder.map((zoneId, index) => {
            const zone = zones.find(z => z.id === zoneId)!;
            const Icon = zoneIcons[zoneId];
            const badges = zone.badge.split(" ");
            
            // Get zone-specific stats
            let stat: string | null = null;
            if (zoneId === "decide" && stats.todayFollowups > 0) {
              stat = `${stats.todayFollowups} due today`;
            }

            return (
              <Link key={zoneId} href={zone.route}>
                <Card className="border-neutral-200 bg-white/80 backdrop-blur hover:shadow-md hover:border-neutral-300 transition-all group cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-neutral-100 group-hover:bg-neutral-200 transition-colors">
                      <span className="text-lg font-semibold text-neutral-400">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${badges.join(' ')}`}>
                          {zone.label}
                        </span>
                        {stat && (
                          <span className="text-xs text-amber-600 font-medium">{stat}</span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 mt-1 truncate">{zone.question}</p>
                    </div>
                    <Icon className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-neutral-200 bg-white/60 backdrop-blur">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-neutral-900">{stats.leads}</p>
            <p className="text-xs text-neutral-500">Total leads</p>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 bg-white/60 backdrop-blur">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.pendingFollowups}</p>
            <p className="text-xs text-neutral-500">Pending follow-ups</p>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 bg-white/60 backdrop-blur">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.todayFollowups}</p>
            <p className="text-xs text-neutral-500">Due today</p>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 bg-white/60 backdrop-blur">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-600">{stats.upcomingMeetings}</p>
            <p className="text-xs text-neutral-500">Upcoming meetings</p>
          </CardContent>
        </Card>
      </div>

      {/* Operator Tools */}
      <Card className="border-neutral-200 bg-neutral-50/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-neutral-700">Operator Tools</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Link
              href="/tanjia/leads"
              className="p-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700"
            >
              All Leads
            </Link>
            <Link
              href="/tanjia/followups"
              className="p-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700"
            >
              Follow-up Queue
            </Link>
            <Link
              href="/tanjia/meetings"
              className="p-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700"
            >
              Meetings
            </Link>
            <Link
              href="/tanjia/scheduler"
              className="p-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700"
            >
              Scheduler
            </Link>
            <Link
              href="/tanjia/present"
              className="p-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700"
            >
              Present View
            </Link>
            <Link
              href="/tanjia/helper"
              className="p-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700"
            >
              AI Helper
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Loop reminder */}
      <Card className="border-violet-100 bg-violet-50/30 backdrop-blur">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-violet-800">
            <span className="font-semibold">Remember:</span> This is a loop, not a race.
          </p>
          <p className="text-xs text-violet-600 mt-1">
            Each zone builds on the last. Move through them at your own pace.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
