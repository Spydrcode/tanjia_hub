"use server";

import { revalidatePath } from "next/cache";
import { formatISO } from "date-fns";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { runAgent } from "@/src/lib/agents/runtime";
import { createLead } from "../leads/actions";
import { MeetingResultsResponseSchema } from "@/src/lib/agents/schemas";
import { tryParseWithRepair } from "@/src/lib/agents/repair";
import { quietFounderRules, jsonOnlyRule } from "@/src/lib/agents/prompt-kits";

export type MeetingPayload = {
  title: string;
  groupName?: string;
  startAt: string;
  endAt?: string;
  locationName?: string;
  address?: string;
  notes?: string;
};

export async function createMeeting(payload: MeetingPayload) {
  const { supabase, user } = await requireAuthOrRedirect();
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      owner_id: user.id,
      title: payload.title.trim(),
      group_name: payload.groupName?.trim() || null,
      start_at: payload.startAt,
      end_at: payload.endAt || null,
      location_name: payload.locationName?.trim() || null,
      address: payload.address?.trim() || null,
      notes: payload.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/tanjia/meetings");
  revalidatePath("/tanjia");
  return data.id as string;
}

export async function startMeeting(meetingId: string) {
  const { supabase, user } = await requireAuthOrRedirect();
  const { error } = await supabase
    .from("meetings")
    .update({ status: "in_progress", started_at: formatISO(new Date()) })
    .eq("id", meetingId)
    .eq("owner_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/tanjia/meetings/${meetingId}`);
  revalidatePath(`/tanjia`);
}

export type InteractionPayload = {
  meetingId: string;
  personName?: string;
  companyName?: string;
  role?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
  priority?: "hot" | "warm" | "cold";
};

export async function addInteraction(payload: InteractionPayload) {
  const { supabase, user } = await requireAuthOrRedirect();
  const { error } = await supabase.from("meeting_interactions").insert({
    meeting_id: payload.meetingId,
    owner_id: user.id,
    person_name: payload.personName?.trim() || null,
    company_name: payload.companyName?.trim() || null,
    role: payload.role?.trim() || null,
    phone: payload.phone?.trim() || null,
    email: payload.email?.trim().toLowerCase() || null,
    website: payload.website?.trim() || null,
    notes: payload.notes?.trim() || null,
    followup_priority: payload.priority || "warm",
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/tanjia/meetings/${payload.meetingId}/start`);
}

export async function updateInteraction(interactionId: string, meetingId: string, notes?: string, priority?: string) {
  const { supabase, user } = await requireAuthOrRedirect();
  const { error } = await supabase
    .from("meeting_interactions")
    .update({
      notes: notes?.trim() || null,
      followup_priority: priority || undefined,
    })
    .eq("id", interactionId)
    .eq("owner_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/tanjia/meetings/${meetingId}/start`);
}

export async function createLeadFromInteraction(interactionId: string) {
  const { supabase, user } = await requireAuthOrRedirect();
  const { data: interaction } = await supabase
    .from("meeting_interactions")
    .select("id, meeting_id, owner_id, person_name, company_name, website, notes")
    .eq("id", interactionId)
    .eq("owner_id", user.id)
    .single();
  if (!interaction) throw new Error("Interaction not found");

  const leadName = interaction.person_name || interaction.company_name || "Lead";
  const leadId = await createLead({
    name: leadName,
    website: interaction.website || undefined,
    notes: interaction.notes || undefined,
    status: "new",
  });

  await supabase
    .from("meeting_interactions")
    .update({ lead_id: leadId })
    .eq("id", interactionId)
    .eq("owner_id", user.id);

  revalidatePath(`/tanjia/leads/${leadId}`);
  revalidatePath(`/tanjia/meetings/${interaction.meeting_id}/start`);
  return leadId;
}

async function generateMeetingResults(meetingId: string, ownerId: string) {
  const { supabase } = await requireAuthOrRedirect();

  const { data: existingRows } = await supabase
    .from("meeting_results")
    .select("id")
    .eq("meeting_id", meetingId)
    .eq("owner_id", ownerId)
    .limit(1);
  if (existingRows && existingRows.length) return;

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, title, group_name, start_at, location_name, address, notes")
    .eq("id", meetingId)
    .eq("owner_id", ownerId)
    .single();

  if (!meeting) throw new Error("Meeting not found");

  const interactions =
    (await supabase
      .from("meeting_interactions")
      .select("id, person_name, company_name, role, notes, tags, followup_priority, lead_id")
      .eq("meeting_id", meetingId)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })).data || [];

  const interactionSummaries = interactions
    .map((i) => {
      const tagText = (i.tags || []).join(", ");
      return `Person: ${i.person_name || "Unknown"}; Company: ${i.company_name || ""}; Role: ${i.role || ""}; Priority: ${
        i.followup_priority
      }; Notes: ${i.notes || ""}; Tags: ${tagText}`;
    })
    .join("\n");

  const systemPrompt = `
${quietFounderRules}
${jsonOnlyRule}
- Follow-up items must include interaction_id and a brief score_reason.
- Keep next_message under 260 chars; permission-based, no push.
  `;

  const userPrompt = `Meeting details:\n- Title: ${meeting.title}\n- Group: ${meeting.group_name || "n/a"}\n- Start: ${meeting.start_at}\n- Location: ${meeting.location_name || ""} ${meeting.address || ""}\nNotes: ${meeting.notes || ""}\n\nInteractions:\n${interactionSummaries || "None logged."}\n\nUse the provided schema. If information is thin, keep outputs short and cautious.`;

  const result = await runAgent({
    systemPrompt,
    userPrompt,
    tools: [],
    executeTool: async () => null,
    context: { taskName: "meeting_results", hasTools: false, inputLength: userPrompt.length, schemaName: "meeting_results", userText: meeting.notes || "" },
    validate: (raw) => {
      try {
        const json = JSON.parse(raw || "{}");
        return { ok: Boolean(json), parsed: json };
      } catch (err: any) {
        return { ok: false, reason: err?.message || "parse_failed" };
      }
    },
  });

  let parsed: any = null;
  try {
    parsed = JSON.parse(result.content || "{}");
  } catch {
    parsed = null;
  }

  if (!parsed) throw new Error("Agent result empty");

  const { error } = await supabase.from("meeting_results").upsert(
    {
      meeting_id: meetingId,
      owner_id: ownerId,
      summary_md: parsed.summary_md || "Meeting recap coming soon.",
      followup_plan_json: parsed.followup_plan || [],
      intro_tests_json: parsed.intro_tests || {},
      improvements_json: parsed.improvements || [],
    },
    { onConflict: "meeting_id" },
  );

  if (error) throw new Error(error.message);
}

export async function endMeetingAndGenerateResults(meetingId: string) {
  const { supabase, user } = await requireAuthOrRedirect();
  const nowIso = formatISO(new Date());
  const { error } = await supabase
    .from("meetings")
    .update({ status: "completed", completed_at: nowIso })
    .eq("id", meetingId)
    .eq("owner_id", user.id);
  if (error) throw new Error(error.message);

  await generateMeetingResults(meetingId, user.id);
  revalidatePath(`/tanjia/meetings/${meetingId}/results`);
  revalidatePath(`/tanjia/meetings/${meetingId}`);
}

export type RecordingPayload = {
  meetingId: string;
  recordingUrl?: string;
  transcriptText?: string;
  transcriptSource?: string;
};

export async function updateMeetingRecording(payload: RecordingPayload) {
  const { supabase, user } = await requireAuthOrRedirect();
  const { error } = await supabase
    .from("meetings")
    .update({
      recording_url: payload.recordingUrl?.trim() || null,
      transcript_text: payload.transcriptText?.trim() || null,
      transcript_source: payload.transcriptSource?.trim() || null,
    })
    .eq("id", payload.meetingId)
    .eq("owner_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/tanjia/meetings/${payload.meetingId}`);
}
