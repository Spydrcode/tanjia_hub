"use server";

import { revalidatePath } from "next/cache";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { runLeadIntelligence } from "@/lib/agents/tanjia-orchestrator";
import { normalizeWebsite } from "@/src/lib/env";

export type LeadPayload = {
  name: string;
  website?: string;
  location?: string;
  notes?: string;
  email?: string;
  tags?: string[];
  status?: string;
};

export async function createLead(payload: LeadPayload) {
  const { supabase, user } = await requireAuthOrRedirect();
  const cleanTags = payload.tags?.filter(Boolean) ?? [];
  const email = payload.email?.trim().toLowerCase() || null;

  const { data, error } = await supabase
    .from("leads")
    .insert({
      owner_id: user.id,
      name: payload.name.trim(),
      website: normalizeWebsite(payload.website) || null,
      location: payload.location?.trim() || null,
      notes: payload.notes?.trim() || null,
      email,
      tags: cleanTags,
      status: payload.status?.trim() || "new",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tanjia");
  revalidatePath("/tanjia/leads");
  return data.id as string;
}

export async function updateLeadStatus(leadId: string, status: string) {
  const { supabase, user } = await requireAuthOrRedirect();
  const { error } = await supabase.from("leads").update({ status }).eq("id", leadId).eq("owner_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/tanjia/leads/${leadId}`);
  revalidatePath("/tanjia");
}

export async function createFollowup(leadId: string, note: string, dueAt?: string) {
  const { supabase } = await requireAuthOrRedirect();
  const { error } = await supabase
    .from("followups")
    .insert({
      lead_id: leadId,
      note: note.trim(),
      due_at: dueAt || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/tanjia/leads/${leadId}`);
  revalidatePath("/tanjia/followups");
}

export async function markFollowupDone(followupId: string, leadId?: string) {
  const { supabase } = await requireAuthOrRedirect();
  const { error } = await supabase.from("followups").update({ done: true, completed_at: new Date().toISOString() }).eq("id", followupId);
  if (error) throw new Error(error.message);
  if (leadId) revalidatePath(`/tanjia/leads/${leadId}`);
  revalidatePath("/tanjia/followups");
}

export async function runLeadIntelligenceAction(leadId: string, deep: boolean = false) {
  const { user } = await requireAuthOrRedirect();
  const result = await runLeadIntelligence({ leadId, ownerId: user.id, deep });
  revalidatePath(`/tanjia/leads/${leadId}`);
  return result;
}

export async function updateLeadNotes(leadId: string, notes: string) {
  const { supabase, user } = await requireAuthOrRedirect();
  const { error } = await supabase.from("leads").update({ notes: notes.trim() }).eq("id", leadId).eq("owner_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/tanjia/leads/${leadId}`);
}

export async function saveMessageDraft(leadId: string, channel: string, intent: string, body: string) {
  const { supabase, user } = await requireAuthOrRedirect();
  const { error } = await supabase
    .from("messages")
    .insert({ owner_id: user.id, lead_id: leadId, channel, intent, body, is_sent: false })
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/tanjia/leads/${leadId}`);
}

export async function snoozeFollowup(followupId: string, days: number) {
  const { supabase } = await requireAuthOrRedirect();
  const { data } = await supabase.from("followups").select("due_at").eq("id", followupId).single();
  if (!data?.due_at) return;
  const current = new Date(data.due_at);
  current.setDate(current.getDate() + days);
  await supabase.from("followups").update({ due_at: current.toISOString() }).eq("id", followupId);
  revalidatePath("/tanjia/followups");
}

export async function deleteLead(leadId: string): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireAuthOrRedirect();

  // Verify the lead belongs to the authenticated user
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("owner_id", user.id)
    .single();

  if (leadError || !lead) {
    return { success: false, error: "Lead not found or access denied." };
  }

  // Delete dependent records safely (order matters for FK constraints)
  // 1. Delete followups
  await supabase.from("followups").delete().eq("lead_id", leadId);

  // 2. Delete messages
  await supabase.from("messages").delete().eq("lead_id", leadId);

  // 3. Delete lead_snapshots (if table exists)
  await supabase.from("lead_snapshots").delete().eq("lead_id", leadId);

  // 4. Delete the lead
  const { error: deleteError } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("owner_id", user.id);

  if (deleteError) {
    return { success: false, error: "Could not delete." };
  }

  revalidatePath("/tanjia/leads");
  revalidatePath("/tanjia/followups");
  return { success: true };
}
