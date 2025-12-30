import { NextResponse, type NextRequest } from "next/server";
import { subDays } from "date-fns";
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

  const since = subDays(new Date(), 7).toISOString();
  const prevSince = subDays(new Date(), 14).toISOString();
  const prevUntil = since;

  async function countMessages(type: string, start: string, end?: string) {
    let query = supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("message_type", type)
      .eq("owner_id", ownerId)
      .gte("created_at", start);
    if (end) query = query.lt("created_at", end);
    const { count } = await query;
    return count ?? 0;
  }

  async function countBookings(status: string | null, start: string, end?: string, needsReview?: boolean) {
    let query = supabase
      .from("lead_bookings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .gte("created_at", start);

    if (status) query = query.eq("status", status);
    if (end) query = query.lt("created_at", end);
    if (typeof needsReview === "boolean") {
      query = query.eq("needs_review", needsReview);
    }
    const { count } = await query;
    return count ?? 0;
  }

  async function countFollowups(start: string, end?: string, done?: boolean) {
    let query = supabase.from("followups").select("id", { count: "exact", head: true }).gte("created_at", start);
    if (end) query = query.lt("created_at", end);
    if (done === true) {
      query = query
        .eq("done", true)
        .or(
          [
            `completed_at.gte.${start}${end ? `,completed_at.lt.${end}` : ""}`,
            `updated_at.gte.${start}${end ? `,updated_at.lt.${end}` : ""}`,
          ].join(","),
        ) as any;
    }
    const { count } = await query;
    return count ?? 0;
  }

  const metrics = await Promise.all([
    // last 7d
    countMessages("schedule_opened", since),
    countMessages("duration_selected", since),
    countBookings("created", since),
    countBookings("canceled", since),
    countFollowups(since),
    countFollowups(since, undefined, true),
    countBookings(null, since, undefined, true),
    // prev 7d
    countMessages("schedule_opened", prevSince, prevUntil),
    countMessages("duration_selected", prevSince, prevUntil),
    countBookings("created", prevSince, prevUntil),
    countBookings("canceled", prevSince, prevUntil),
    countFollowups(prevSince, prevUntil),
    countFollowups(prevSince, prevUntil, true),
    countBookings(null, prevSince, prevUntil, true),
  ]);

  const [
    scheduleLast,
    durationLast,
    createdLast,
    canceledLast,
    followupsCreatedLast,
    followupsCompletedLast,
    unmatchedLast,
    schedulePrev,
    durationPrev,
    createdPrev,
    canceledPrev,
    followupsCreatedPrev,
    followupsCompletedPrev,
    unmatchedPrev,
  ] = metrics;

  const toDelta = (last: number, prev: number) => ({ last7d: last, prev7d: prev, delta: last - prev });

  return NextResponse.json({
    schedule_opened: toDelta(scheduleLast, schedulePrev),
    duration_selected: toDelta(durationLast, durationPrev),
    bookings_created: toDelta(createdLast, createdPrev),
    bookings_canceled: toDelta(canceledLast, canceledPrev),
    followups_created: toDelta(followupsCreatedLast, followupsCreatedPrev),
    followups_completed: toDelta(followupsCompletedLast, followupsCompletedPrev),
    unmatched_bookings: toDelta(unmatchedLast, unmatchedPrev),
    window_days: 7,
  });
}
