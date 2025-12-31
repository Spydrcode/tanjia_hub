import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runLeadIntelligence } from "@/lib/agents/tanjia-orchestrator";
import { tanjiaServerConfig } from "@/lib/tanjia-config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runAgent } from "@/src/lib/agents/runtime";

const RequestSchema = z.object({
  channel: z.literal("followup"),
  intent: z.enum(["reflect", "invite", "schedule", "encourage"]).optional(),
  what_they_said: z.string().min(1),
  notes: z.string().nullable().optional(),
  leadId: z.string().nullable().optional(),
});

const PlanSchema = z.object({
  next_action: z.string().min(1).max(300),
  log_note: z.string().min(1).max(400),
  followups: z.array(z.object({ when: z.string().min(1).max(120), text: z.string().min(1).max(320) })).min(1).max(3),
});

async function saveTrace({
  plan,
  leadId,
  ownerId,
  trace,
}: {
  plan: z.infer<typeof PlanSchema>;
  leadId?: string | null;
  ownerId?: string | null;
  trace?: unknown;
}) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("messages")
      .insert({
        owner_id: ownerId ?? null,
        lead_id: leadId ?? null,
        channel: "followup",
        intent: "followup-plan",
        body: plan.next_action,
        message_type: "followup_plan",
        metadata: { plan, trace },
        is_sent: false,
      })
      .select("id")
      .single();
    return data?.id as string | null;
  } catch (err) {
    console.warn("[tanjia][followup-plan] trace save failed", err);
    return null;
  }
}

function normalize(text: string) {
  return text.replace(/^[\-\*\d\.\)\s]+/, "").replace(/^"+|"+$/g, "").trim();
}

export async function POST(request: NextRequest) {
  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let leadContext = "";
  if (body.leadId && user?.id) {
    try {
      const intelligence = await runLeadIntelligence({ leadId: body.leadId, ownerId: user.id, deep: false });
      leadContext = [
        intelligence.outputs.summary,
        ...(intelligence.outputs.talkingPoints || []),
        ...(intelligence.outputs.questions || []),
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 800);
    } catch (err) {
      console.warn("[tanjia][followup-plan] intelligence fallback", err);
    }
  }

  const systemPrompt = `
You are drafting a short follow-up plan for a Director-of-Networking.
Constraints:
- Quiet, permission-based tone.
- Keep steps light; no pressure, no heavy asks.
- Use the given post/notes to anchor specifics.
- Output JSON with shape: { "next_action": "...", "log_note": "...", "followups": [ { "when": "...", "text": "..." } ] }.
- 1-2 followups max. Avoid scheduling links.
`.trim();

  const userPrompt = `
What they said: ${body.what_they_said.trim()}
Notes: ${body.notes?.trim() || "None"}
Lead context: ${leadContext || "Sparse"}
Intent: ${body.intent || "encourage"}

Return only JSON. No bullets or prose outside JSON.
`.trim();

  try {
    const { content, trace } = await runAgent({
      model: tanjiaServerConfig.agentModelSmall,
      systemPrompt,
      userPrompt,
      tools: [],
      maxSteps: 1,
      executeTool: async () => ({}),
    });

    let parsed: z.infer<typeof PlanSchema> | null = null;
    try {
      const json = JSON.parse(content || "{}");
      const safe = PlanSchema.parse(json);
      parsed = {
        next_action: normalize(safe.next_action),
        log_note: normalize(safe.log_note),
        followups: safe.followups.map((f) => ({ when: normalize(f.when), text: normalize(f.text) })),
      };
    } catch {
      parsed = null;
    }

    if (!parsed) {
      parsed = {
        next_action: normalize("Send a short check-in referencing their update; ask if they want a calm 2nd Look."),
        log_note: normalize("Shared update acknowledged; waiting for permission to review."),
        followups: [
          { when: "In 3 days", text: normalize("Light nudge to see if they want notes; keep it optional.") },
          { when: "In 7 days", text: normalize("Close the loop and offer to pause unless they request more.") },
        ],
      };
    }

    const traceId = await saveTrace({
      plan: parsed,
      leadId: body.leadId,
      ownerId: user?.id ?? null,
      trace: trace
        ? {
            model: trace.model,
            steps: trace.steps,
            tools_called: trace.tools_called,
            urls_fetched: trace.urls_fetched,
            searches_run: trace.searches_run,
            start: trace.start,
            end: trace.end,
          }
        : undefined,
    });

    return NextResponse.json({ ...parsed, traceId: traceId || null });
  } catch (error) {
    console.error("[tanjia][followup-plan] error", error);
    return NextResponse.json({ error: "Unable to plan right now." }, { status: 500 });
  }
}
