import { SupabaseClient } from "@supabase/supabase-js";
import { formatDistanceToNow, isPast, isToday, addDays, isBefore } from "date-fns";

// ============================================================================
// TYPES
// ============================================================================

export type NextMove = {
  title: string;
  leadId?: string | null;
  why: string;
  ctaHref: string;
  urgency: 'overdue' | 'today' | 'soon' | 'normal';
};

export type BookingCard = {
  id: string;
  leadId: string | null;
  leadName: string;
  attendeeEmail: string | null;
  startTime: string;
  status: string;
  urgency: 'canceled' | 'upcoming' | 'needs_review';
};

export type FollowupCard = {
  id: string;
  leadId: string;
  leadName: string;
  note: string;
  dueAt: string | null;
  urgency: 'overdue' | 'today' | 'soon';
};

export type MessageCard = {
  id: string;
  leadId: string | null;
  leadName: string;
  body: string;
  channel: string | null;
  createdAt: string;
  type: 'message' | 'note' | 'draft';
};

export type LeadCoverageCard = {
  id: string;
  name: string;
  gap: 'no_analysis' | 'no_notes' | 'no_touch' | 'stale';
  lastActivity: string | null;
};

export type ToolHealthStatus = {
  calWebhookOk?: boolean;
  lastBookingEventAt?: string;
  lastAnalysisAt?: string;
  lastNetworkingDraftAt?: string;
};

export type DirectorSnapshot = {
  today: {
    nextMove: NextMove;
    dueNow: {
      followupsOverdue: number;
      nextTouchesDue: number;
      bookingsUpcomingToday: number;
    };
  };
  pipeline: {
    leadsNeedingResearch: number;
    leadsNeedingFollowup: number;
    leadsInScheduling: number;
    leadsActive: number;
  };
  scheduling: {
    upcoming: BookingCard[];
    cancellations: BookingCard[];
    needsReview: BookingCard[];
  };
  followups: {
    overdue: FollowupCard[];
    dueSoon: FollowupCard[];
  };
  recentActivity: {
    latestMessages: MessageCard[];
    latestNotes: MessageCard[];
  };
  toolHealth: ToolHealthStatus;
};

// ============================================================================
// COMPUTE METRICS
// ============================================================================

export async function computeDirectorSnapshot(
  supabase: SupabaseClient,
  ownerId: string
): Promise<DirectorSnapshot> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = addDays(today, 1);
  const next7Days = addDays(today, 7);
  const last7Days = addDays(today, -7);

  // Fetch all leads for this owner
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, website, notes, created_at, updated_at")
    .eq("owner_id", ownerId);

  const allLeads = leads || [];

  // Fetch followups
  const { data: followups } = await supabase
    .from("followups")
    .select("id, lead_id, note, due_at, done, completed_at")
    .eq("done", false)
    .in("lead_id", allLeads.map(l => l.id))
    .order("due_at", { ascending: true, nullsFirst: false });

  const allFollowups = followups || [];

  // Fetch bookings
  const { data: bookings } = await supabase
    .from("lead_bookings")
    .select("id, lead_id, attendee_name, attendee_email, start_time, status, created_at, updated_at")
    .eq("user_id", ownerId)
    .order("start_time", { ascending: false });

  const allBookings = bookings || [];

  // Fetch messages
  const { data: messages } = await supabase
    .from("messages")
    .select("id, lead_id, body, channel, created_at, message_type")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(20);

  const allMessages = messages || [];

  // Fetch lead analyses
  const { data: analyses } = await supabase
    .from("lead_analyses")
    .select("lead_id, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  const allAnalyses = analyses || [];

  // Fetch networking drafts
  const { data: drafts } = await supabase
    .from("networking_drafts")
    .select("created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(1);

  // ============================================================================
  // COMPUTE: Followup Debt
  // ============================================================================

  const overdueFollowups: FollowupCard[] = [];
  const dueSoonFollowups: FollowupCard[] = [];

  for (const f of allFollowups) {
    if (!f.due_at) continue;
    const dueDate = new Date(f.due_at);
    const lead = allLeads.find(l => l.id === f.lead_id);
    
    const card: FollowupCard = {
      id: f.id,
      leadId: f.lead_id,
      leadName: lead?.name || "Unknown",
      note: f.note || "",
      dueAt: f.due_at,
      urgency: isPast(dueDate) ? 'overdue' : isToday(dueDate) ? 'today' : 'soon',
    };

    if (isPast(dueDate)) {
      overdueFollowups.push(card);
    } else if (isBefore(dueDate, next7Days)) {
      dueSoonFollowups.push(card);
    }
  }

  // ============================================================================
  // COMPUTE: Booking Status
  // ============================================================================

  const upcomingBookings: BookingCard[] = [];
  const cancellationBookings: BookingCard[] = [];
  const needsReviewBookings: BookingCard[] = [];

  for (const b of allBookings) {
    const lead = allLeads.find(l => l.id === b.lead_id);
    const startTime = b.start_time ? new Date(b.start_time) : null;

    const card: BookingCard = {
      id: b.id,
      leadId: b.lead_id,
      leadName: lead?.name || b.attendee_name || "Unknown",
      attendeeEmail: b.attendee_email,
      startTime: b.start_time || "",
      status: b.status || "unknown",
      urgency: 'upcoming',
    };

    // Cancellations in last 7 days need gentle check-in
    if (b.status === 'cancelled' && startTime && startTime > last7Days) {
      card.urgency = 'canceled';
      cancellationBookings.push(card);
      continue;
    }

    // Upcoming bookings (today or next 7 days)
    if (b.status === 'accepted' && startTime && startTime >= today && startTime < next7Days) {
      card.urgency = isToday(startTime) ? 'upcoming' : 'upcoming';
      upcomingBookings.push(card);
      continue;
    }

    // Needs review (rescheduled, pending, etc.)
    if (['rescheduled', 'pending'].includes(b.status || '')) {
      card.urgency = 'needs_review';
      needsReviewBookings.push(card);
    }
  }

  // ============================================================================
  // COMPUTE: Lead Coverage Gaps
  // ============================================================================

  const analyzedLeadIds = new Set(allAnalyses.map(a => a.lead_id));
  
  let leadsNeedingResearch = 0;
  let leadsNeedingFollowup = 0;
  let leadsInScheduling = 0;
  let leadsActive = 0;

  for (const lead of allLeads) {
    const hasAnalysis = analyzedLeadIds.has(lead.id);
    const hasNotes = Boolean(lead.notes && lead.notes.trim());
    const hasFollowup = allFollowups.some(f => f.lead_id === lead.id);
    const hasBooking = allBookings.some(b => b.lead_id === lead.id);

    if (!hasAnalysis && lead.website) {
      leadsNeedingResearch++;
    }

    if (!hasFollowup && !hasBooking) {
      leadsNeedingFollowup++;
    }

    if (hasBooking) {
      leadsInScheduling++;
    }

    if (hasAnalysis || hasNotes || hasFollowup || hasBooking) {
      leadsActive++;
    }
  }

  // ============================================================================
  // COMPUTE: Next Move (Most Important)
  // ============================================================================

  let nextMove: NextMove = {
    title: "Review your pipeline",
    why: "Everything looks calm. Time to check in on leads.",
    ctaHref: "/tanjia/leads",
    urgency: 'normal',
  };

  // Priority 1: Overdue followup
  if (overdueFollowups.length > 0) {
    const first = overdueFollowups[0];
    nextMove = {
      title: `Follow up with ${first.leadName}`,
      leadId: first.leadId,
      why: `Overdue: ${first.note}`,
      ctaHref: `/tanjia/leads/${first.leadId}`,
      urgency: 'overdue',
    };
  }
  // Priority 2: Cancellation needs gentle check-in
  else if (cancellationBookings.length > 0) {
    const first = cancellationBookings[0];
    nextMove = {
      title: `Gentle check-in: ${first.leadName}`,
      leadId: first.leadId,
      why: "Recent cancellation — just a calm follow-up",
      ctaHref: first.leadId ? `/tanjia/leads/${first.leadId}` : `/tanjia/scheduler`,
      urgency: 'today',
    };
  }
  // Priority 3: Followup due today
  else if (dueSoonFollowups.some(f => f.urgency === 'today')) {
    const first = dueSoonFollowups.find(f => f.urgency === 'today')!;
    nextMove = {
      title: `Today: ${first.leadName}`,
      leadId: first.leadId,
      why: first.note,
      ctaHref: `/tanjia/leads/${first.leadId}`,
      urgency: 'today',
    };
  }
  // Priority 4: Lead needs research
  else if (leadsNeedingResearch > 0) {
    const leadNeedingResearch = allLeads.find(l => !analyzedLeadIds.has(l.id) && l.website);
    if (leadNeedingResearch) {
      nextMove = {
        title: `Research ${leadNeedingResearch.name}`,
        leadId: leadNeedingResearch.id,
        why: "No analysis yet — let's understand them",
        ctaHref: `/tanjia/tools/analyze?lead=${leadNeedingResearch.id}`,
        urgency: 'soon',
      };
    }
  }

  // ============================================================================
  // COMPUTE: Recent Activity
  // ============================================================================

  const latestMessages: MessageCard[] = allMessages
    .filter(m => m.message_type !== 'system' && m.channel !== 'outbound_draft')
    .slice(0, 5)
    .map(m => {
      const lead = allLeads.find(l => l.id === m.lead_id);
      return {
        id: m.id,
        leadId: m.lead_id,
        leadName: lead?.name || "Unknown",
        body: m.body || "",
        channel: m.channel,
        createdAt: m.created_at,
        type: 'message' as const,
      };
    });

  const latestNotes: MessageCard[] = allMessages
    .filter(m => m.message_type === 'system')
    .slice(0, 5)
    .map(m => {
      const lead = allLeads.find(l => l.id === m.lead_id);
      return {
        id: m.id,
        leadId: m.lead_id,
        leadName: lead?.name || "Unknown",
        body: m.body || "",
        channel: m.channel,
        createdAt: m.created_at,
        type: 'note' as const,
      };
    });

  // ============================================================================
  // COMPUTE: Tool Health
  // ============================================================================

  const lastBooking = allBookings[0];
  const lastAnalysis = allAnalyses[0];
  const lastDraft = drafts?.[0];

  const toolHealth: ToolHealthStatus = {
    calWebhookOk: Boolean(lastBooking && new Date(lastBooking.created_at) > last7Days),
    lastBookingEventAt: lastBooking?.created_at,
    lastAnalysisAt: lastAnalysis?.created_at,
    lastNetworkingDraftAt: lastDraft?.created_at,
  };

  // ============================================================================
  // ASSEMBLE SNAPSHOT
  // ============================================================================

  return {
    today: {
      nextMove,
      dueNow: {
        followupsOverdue: overdueFollowups.length,
        nextTouchesDue: leadsNeedingFollowup,
        bookingsUpcomingToday: upcomingBookings.filter(b => isToday(new Date(b.startTime))).length,
      },
    },
    pipeline: {
      leadsNeedingResearch,
      leadsNeedingFollowup,
      leadsInScheduling,
      leadsActive,
    },
    scheduling: {
      upcoming: upcomingBookings.slice(0, 10),
      cancellations: cancellationBookings.slice(0, 5),
      needsReview: needsReviewBookings.slice(0, 5),
    },
    followups: {
      overdue: overdueFollowups.slice(0, 10),
      dueSoon: dueSoonFollowups.slice(0, 10),
    },
    recentActivity: {
      latestMessages,
      latestNotes,
    },
    toolHealth,
  };
}
