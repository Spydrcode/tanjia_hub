import { NextResponse, type NextRequest } from "next/server";
import { addDays, addHours } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerId = user.id;
  const now = new Date();
  const next48Hours = addHours(now, 48).toISOString();

  try {
    // Upcoming meetings (next 48 hours only - Slack-style badge)
    const { count: upcomingMeetings } = await supabase
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .in("status", ["planned", "in_progress"])
      .gte("start_at", now.toISOString())
      .lte("start_at", next48Hours);

    // In-progress meetings
    const { count: inProgressMeetings } = await supabase
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .eq("status", "in_progress");

    // Overdue followups (past due_at and not done, joined through leads)
    const { data: overdueFollowupsData } = await supabase
      .from("followups")
      .select("id, lead_id, leads!inner(owner_id)")
      .eq("leads.owner_id", ownerId)
      .eq("done", false)
      .lt("due_at", now.toISOString());
    
    const overdueFollowups = overdueFollowupsData?.length ?? 0;

    // Untriaged leads (status = "new" OR missing next_step)
    const { data: untriagedLeadsData } = await supabase
      .from("leads")
      .select("id")
      .eq("owner_id", ownerId)
      .or("status.eq.new,next_step.is.null");
    
    const untriagedLeads = untriagedLeadsData?.length ?? 0;

    // Recent meetings (last 7 days, completed)
    const { count: recentCompletedMeetings } = await supabase
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .eq("status", "completed")
      .gte("completed_at", addDays(now, -7).toISOString());

    return NextResponse.json({
      upcomingMeetings: upcomingMeetings ?? 0,
      inProgressMeetings: inProgressMeetings ?? 0,
      overdueFollowups: overdueFollowups ?? 0,
      untriagedLeads: untriagedLeads ?? 0,
      recentCompletedMeetings: recentCompletedMeetings ?? 0,
      lastUpdated: now.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching work metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch work metrics" },
      { status: 500 }
    );
  }
}
