import type { SupabaseClient } from "@supabase/supabase-js";
import { logMessageEvent } from "@/src/lib/scheduling/logging";

export type BookingStatus = "created" | "rescheduled" | "canceled" | "confirmed";

export type LeadBookingPayload = {
  userId?: string | null;
  ownerId?: string | null;
  leadId?: string | null;
  calBookingId?: string | null;
  calEventType?: string | null;
  durationMinutes?: number | null;
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  timezone?: string | null;
  attendeeName?: string | null;
  attendeeEmail?: string | null;
  status?: BookingStatus | string | null;
  rawPayload?: unknown;
  needsReview?: boolean;
  matchReason?: string | null;
};

function toIso(input?: string | Date | null) {
  if (!input) return null;
  try {
    return (input instanceof Date ? input : new Date(input)).toISOString();
  } catch {
    return null;
  }
}

export async function upsertLeadBooking(supabase: SupabaseClient, payload: LeadBookingPayload) {
  const { error, data } = await supabase
    .from("lead_bookings")
    .upsert(
      {
        user_id: payload.userId ?? payload.ownerId ?? null,
        owner_id: payload.ownerId ?? payload.userId ?? null,
        lead_id: payload.leadId ?? null,
        cal_booking_id: payload.calBookingId ?? null,
        cal_event_type: payload.calEventType ?? null,
        duration_minutes: payload.durationMinutes ?? null,
        start_time: toIso(payload.startTime),
        end_time: toIso(payload.endTime),
        timezone: payload.timezone ?? null,
        attendee_name: payload.attendeeName ?? null,
        attendee_email: payload.attendeeEmail ?? null,
        status: payload.status ?? null,
        raw_payload: payload.rawPayload ?? null,
        needs_review: payload.needsReview ?? false,
        match_reason: payload.matchReason ?? null,
      },
      { onConflict: "cal_booking_id" },
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as string;
}

type FollowupPlan = {
  note: string;
  dueAt: string;
};

function buildFollowups(startTime: string | null, status?: string | null): FollowupPlan[] {
  if (!startTime) return [];
  const start = new Date(startTime);
  const plans: FollowupPlan[] = [];

  if (status === "canceled") {
    const gentle = new Date(start);
    gentle.setDate(gentle.getDate() + 1);
    plans.push({ note: "Gentle check-in after cancellation", dueAt: gentle.toISOString() });
    return plans;
  }

  const recap = new Date(start);
  recap.setHours(recap.getHours() + 1);
  plans.push({ note: "Send recap + next step", dueAt: recap.toISOString() });

  const confirm = new Date(start);
  confirm.setDate(confirm.getDate() + 1);
  plans.push({ note: "Confirm meeting happened", dueAt: confirm.toISOString() });

  return plans;
}

export async function createFollowupsForBooking(supabase: SupabaseClient, params: { leadId?: string | null; ownerId?: string | null; startTime?: string | null; status?: string | null; }) {
  if (!params.leadId) return;
  const plans = buildFollowups(params.startTime || null, params.status);
  if (!plans.length) return;

  try {
    await supabase
      .from("followups")
      .insert(
        plans.map((plan) => ({
          lead_id: params.leadId,
          note: plan.note,
          due_at: plan.dueAt,
          done: false,
        })),
      );

    await logMessageEvent({
      supabase,
      ownerId: params.ownerId ?? null,
      leadId: params.leadId,
      messageType: "followups_created",
      metadata: { source: "cal_webhook", count: plans.length, status: params.status },
      body: plans.map((p) => p.note).join(" | "),
      intent: "schedule",
      channel: "system",
    });
  } catch (err) {
    console.warn("[tanjia][followups] failed", err);
  }
}

export async function findLeadForAttendee(
  supabase: SupabaseClient,
  attendeeEmail?: string | null,
  attendeeName?: string | null,
) {
  if (!attendeeEmail && !attendeeName) return { leadId: null as string | null, ownerId: null as string | null };

  if (attendeeEmail) {
    const { data } = await supabase
      .from("leads")
      .select("id, owner_id")
      .ilike("email", attendeeEmail.trim().toLowerCase())
      .limit(1)
      .single();
    if (data?.id) return { leadId: data.id as string, ownerId: data.owner_id as string };
  }

  if (attendeeName) {
    const { data } = await supabase
      .from("leads")
      .select("id, owner_id")
      .ilike("name", `%${attendeeName}%`)
      .limit(1)
      .single();
    if (data?.id) return { leadId: data.id as string, ownerId: data.owner_id as string };
  }

  return { leadId: null as string | null, ownerId: null as string | null };
}
