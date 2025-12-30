import type { SupabaseClient } from "@supabase/supabase-js";

type LogParams = {
  supabase: SupabaseClient;
  ownerId?: string | null;
  leadId?: string | null;
  messageType: string;
  metadata?: Record<string, unknown>;
  body?: string | null;
  channel?: string | null;
  intent?: string | null;
  isSent?: boolean;
};

export async function logMessageEvent({
  supabase,
  ownerId,
  leadId,
  messageType,
  metadata,
  body,
  channel = "system",
  intent = "schedule",
  isSent = false,
}: LogParams) {
  if (!supabase) return;
  try {
    await supabase.from("messages").insert({
      owner_id: ownerId ?? null,
      lead_id: leadId ?? null,
      message_type: messageType,
      metadata: metadata ?? {},
      body: body ?? null,
      channel,
      intent,
      is_sent: isSent,
    });
  } catch (err) {
    console.warn("[tanjia][logMessageEvent] failed", err);
  }
}
