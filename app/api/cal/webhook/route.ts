import { NextRequest, NextResponse } from "next/server";
import { tanjiaServerConfig } from "@/lib/tanjia-config";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { createFollowupsForBooking, findLeadForAttendee, upsertLeadBooking } from "@/src/lib/scheduling/bookings";
import { logMessageEvent } from "@/src/lib/scheduling/logging";

function getStatus(event: string | undefined) {
  const normalized = (event || "").toLowerCase();
  if (normalized.includes("resched")) return "rescheduled";
  if (normalized.includes("cancel")) return "canceled";
  if (normalized.includes("confirm")) return "confirmed";
  return "created";
}

function diffMinutes(start?: string | null, end?: string | null) {
  if (!start || !end) return null;
  try {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.round((e - s) / 60000);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const secret = tanjiaServerConfig.calWebhookSecret;
    const providedSecret = request.headers.get("x-cal-webhook-secret") || request.nextUrl.searchParams.get("secret");
    if (secret && secret !== providedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json().catch(() => null);
    if (!payload) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const eventName: string | undefined = payload.triggerEvent || payload.event || payload.type;
    const booking = payload.payload?.booking ?? payload.booking ?? payload.data ?? payload;
    const bookingId: string | undefined = booking?.uid || booking?.id || booking?.bookingId;
    const eventSlug: string | undefined =
      booking?.eventType?.slug ||
      booking?.event_type?.slug ||
      booking?.eventType ||
      booking?.event_type ||
      booking?.eventTypeId ||
      booking?.event_type_id;
    const startTime: string | undefined = booking?.startTime || booking?.start_time || booking?.start || booking?.start_time_utc;
    const endTime: string | undefined = booking?.endTime || booking?.end_time || booking?.end || booking?.end_time_utc;
    const timezone: string | undefined = booking?.timeZone || booking?.timezone;
    const attendee =
      booking?.attendees?.[0] || booking?.attendee || booking?.invitees?.[0] || booking?.user || booking?.customer;
    const attendeeName: string | undefined = attendee?.name || attendee?.fullName || attendee?.full_name;
    const attendeeEmail: string | undefined = attendee?.email || attendee?.emailAddress || attendee?.email_address;
    const metadata = booking?.metadata || payload?.metadata || {};

    const duration =
      booking?.eventType?.length ||
      booking?.duration ||
      metadata?.duration ||
      diffMinutes(startTime || null, endTime || null) ||
      null;

    const mappedLeadIdFromMetadata = metadata?.leadId || metadata?.lead_id || null;
    const ownerIdFromMetadata =
      metadata?.supabaseUserId || metadata?.userId || metadata?.ownerId || metadata?.owner_id || null;
    const supabase = createSupabaseServiceRoleClient();

    let leadId = mappedLeadIdFromMetadata || null;
    let ownerId = ownerIdFromMetadata || null;
    let matchReason: string | null = null;

    if (!ownerId && leadId) {
      const { data: lead } = await supabase.from("leads").select("owner_id").eq("id", leadId).single();
      if (lead?.owner_id) {
        ownerId = lead.owner_id as string;
        matchReason = "metadata_lead_owner";
      }
    }

    if (!leadId || !ownerId) {
      const { leadId: matchedLeadId, ownerId: matchedOwnerId } = await findLeadForAttendee(
        supabase,
        attendeeEmail,
        attendeeName,
      );
      if (!leadId && matchedLeadId) {
        leadId = matchedLeadId;
        matchReason = matchReason || "matched_by_email";
      }
      if (!ownerId && matchedOwnerId) {
        ownerId = matchedOwnerId;
        matchReason = matchReason || "matched_by_email";
      }
    }

    if (!ownerId) {
      ownerId =
        booking?.userId || booking?.user?.id || booking?.organizer_id || booking?.organizer?.id || ownerIdFromMetadata || null;
      if (ownerId) matchReason = matchReason || "organizer_fallback";
    }

    const incomingStatus = getStatus(eventName);
    let existingBooking: { status?: string | null; match_reason?: string | null } | null = null;
    if (bookingId) {
      const { data } = await supabase
        .from("lead_bookings")
        .select("status, match_reason")
        .eq("cal_booking_id", bookingId)
        .single();
      existingBooking = data ?? null;
    }

    let status = incomingStatus;
    let needsReview = !ownerId || !leadId;

    if (existingBooking?.status === "canceled" && incomingStatus === "created") {
      status = "canceled";
      needsReview = true;
      matchReason = matchReason || existingBooking?.match_reason || "cancel_precedes_create";
    }

    const finalMatchReason = needsReview ? matchReason || "missing_owner_mapping" : matchReason || "resolved";

    await upsertLeadBooking(supabase, {
      userId: ownerId,
      ownerId,
      leadId,
      calBookingId: bookingId ?? null,
      calEventType: eventSlug ?? null,
      durationMinutes: duration,
      startTime: startTime || null,
      endTime: endTime || null,
      timezone: timezone || null,
      attendeeName: attendeeName || null,
      attendeeEmail: attendeeEmail || null,
      status,
      rawPayload: payload,
      needsReview,
      matchReason: finalMatchReason,
    });

    if (ownerId) {
      const messageType =
        status === "rescheduled"
          ? "booking_rescheduled"
          : status === "canceled"
            ? "booking_canceled"
            : "booking_created";

      await logMessageEvent({
        supabase,
        ownerId,
        leadId,
        messageType,
        metadata: {
          bookingId,
          eventSlug,
          duration,
          attendeeEmail,
          attendeeName,
          status,
          matchReason: finalMatchReason,
          needsReview,
        },
        body: `${messageType} for ${attendeeName || attendeeEmail || "guest"} (${eventSlug || "cal"})`,
        intent: "schedule",
        channel: "system",
      });
    }

    if (ownerId && leadId && !needsReview) {
      await createFollowupsForBooking(supabase, {
        leadId,
        ownerId,
        startTime: startTime || null,
        status,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[tanjia][cal-webhook] error", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
