import { tanjiaPublicConfig } from "@/lib/tanjia-config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logMessageEvent } from "@/src/lib/scheduling/logging";

export type ScheduleAgentInput = {
  ownerId?: string | null;
  leadId?: string | null;
  leadName?: string | null;
  leadEmail?: string | null;
  intent?: string;
  suggestedDuration?: 15 | 30 | "unknown";
  ownerMessage?: string;
  contextNotes?: string;
};

export type ScheduleAgentOutput = {
  recommendedDuration: 15 | 30;
  links: { "15": string; "30": string };
  messageCopy: {
    short: string;
    dm: string;
    email: string;
  };
  logging: {
    event: "duration_selected";
    metadata: Record<string, unknown>;
  };
  nextActions: Array<
    | { type: "log"; name: "schedule_opened" | "duration_selected"; payload: Record<string, unknown> }
    | { type: "create_followups_on_booking": boolean }
  >;
};

function pickDuration(text: string, suggested?: 15 | 30 | "unknown"): 15 | 30 {
  const lowered = text.toLowerCase();
  if (suggested === 15 || suggested === 30) return suggested;
  if (lowered.includes("deep") || lowered.includes("project") || lowered.includes("scope") || lowered.includes("walkthrough")) {
    return 30;
  }
  if (lowered.includes("quick") || lowered.includes("intro") || lowered.includes("check-in")) {
    return 15;
  }
  return 15;
}

export async function runScheduleAgent(input: ScheduleAgentInput): Promise<ScheduleAgentOutput> {
  const combined = `${input.ownerMessage || ""} ${input.contextNotes || ""}`.trim();
  const recommendedDuration = pickDuration(combined, input.suggestedDuration);

  const links = {
    "15": tanjiaPublicConfig.calEvent15Url,
    "30": tanjiaPublicConfig.calEvent30Url,
  };

  const name = input.leadName?.trim() || "there";
  const emailCta = recommendedDuration === 15 ? "a quick 15 minutes" : "30 minutes to work through it";

  const messageCopy = {
    short: `If you want, here's a calm ${recommendedDuration}-minute slot: ${links[recommendedDuration.toString() as "15" | "30"]}. Happy to adjust.`,
    dm: `No rush—if it's useful, grab ${recommendedDuration === 15 ? "a quick 15" : "30 minutes"} here: ${
      links[recommendedDuration.toString() as "15" | "30"]
    }. ${recommendedDuration === 30 ? "We can go deeper if needed." : "We can expand if it helps."}`,
    email: `Hi ${name},\n\nIf you'd like ${emailCta}, you can pick a time here:\n- 15 min: ${links["15"]}\n- 30 min: ${links["30"]}\n\nHappy to keep it light and adjust if you prefer something else.`,
  };

  const metadata = {
    recommendedDuration,
    leadId: input.leadId,
    leadEmail: input.leadEmail,
    intent: input.intent || "schedule",
  };

  try {
    const supabase = await createSupabaseServerClient();
    await logMessageEvent({
      supabase,
      ownerId: input.ownerId ?? null,
      leadId: input.leadId ?? null,
      messageType: "duration_selected",
      metadata,
      body: messageCopy.short,
      channel: "system",
      intent: "schedule",
    });
  } catch (err) {
    console.warn("[tanjia][schedule-agent] log failed", err);
  }

  return {
    recommendedDuration,
    links,
    messageCopy,
    logging: {
      event: "duration_selected",
      metadata,
    },
    nextActions: [
      { type: "log", name: "schedule_opened", payload: { leadId: input.leadId } },
      { type: "log", name: "duration_selected", payload: metadata },
      { type: "create_followups_on_booking": true },
    ],
  };
}
