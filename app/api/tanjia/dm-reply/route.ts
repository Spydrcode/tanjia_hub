import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runLeadIntelligence } from "@/lib/agents/tanjia-orchestrator";
import { tanjiaConfig, tanjiaServerConfig } from "@/lib/tanjia-config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runAgent } from "@/src/lib/agents/runtime";
import { toolDefinitions, toolFetchPublicPage, toolWebSearch } from "@/src/lib/agents/tools";

const RequestSchema = z.object({
  channel: z.literal("dm"),
  intent: z.enum(["reflect", "invite", "schedule", "encourage"]).optional(),
  what_they_said: z.string().min(1),
  notes: z.string().nullable().optional(),
  leadId: z.string().nullable().optional(),
});

type LiteResearch = {
  insights: string[];
  traceId: string | null;
  trace?: unknown;
};

async function runLiteResearch(input: { message: string; notes?: string | null }) {
  const collected: string[] = [];

  const { content, trace } = await runAgent({
    model: tanjiaServerConfig.agentModelSmall,
    systemPrompt: `
You are gathering quick public context before writing a DM.
- Use tools only if needed; keep to 1-2 calls.
- Summarize neutral, observable facts; avoid speculation.
- Do not include sensitive or personal data.
Return JSON: { "insights": ["fact 1", "fact 2"], "draft": "short dm" }.
`.trim(),
    userPrompt: `
Post or message:
${input.message.trim()}

Notes: ${input.notes?.trim() || "None"}
`.trim(),
    tools: toolDefinitions as any,
    maxSteps: 4,
    executeTool: async (name, rawInput) => {
      if (name === "fetch_public_page") {
        const res = await toolFetchPublicPage(rawInput);
        if (res.output?.snippet) collected.push(res.output.snippet.slice(0, 280));
        return res.output ?? { url: (rawInput as any)?.url, snippet: "" };
      }
      if (name === "web_search") {
        const res = await toolWebSearch(rawInput);
        res.output?.results?.slice(0, 2).forEach((r) => collected.push(r.snippet));
        return res.output ?? { results: [] };
      }
      return {};
    },
  });

  let parsed: LiteResearch = { insights: [], traceId: null };
  try {
    const json = JSON.parse(content || "{}");
    parsed.insights = Array.isArray(json.insights) ? json.insights.map((i: any) => String(i)).filter(Boolean) : [];
  } catch {
    parsed.insights = collected.filter(Boolean).slice(0, 3);
  }

  return {
    insights: parsed.insights.slice(0, 3),
    traceId: trace?.start ? trace.start : null,
    trace,
  };
}

async function saveTrace({
  body,
  leadId,
  ownerId,
  trace,
  metadata,
}: {
  body: string;
  leadId?: string | null;
  ownerId?: string | null;
  trace?: unknown;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("messages")
      .insert({
        owner_id: ownerId ?? null,
        lead_id: leadId ?? null,
        channel: "dm",
        intent: "reflect",
        body,
        message_type: "reply_helper",
        metadata: { ...(metadata || {}), trace },
        is_sent: false,
      })
      .select("id")
      .single();
    return data?.id as string | null;
  } catch (err) {
    console.warn("[tanjia][dm-reply] trace save failed", err);
    return null;
  }
}

function limitSentences(text: string, maxSentences = 3) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, maxSentences).join(" ").trim();
}

function clean(text: string) {
  const stripped = text
    .split(/\n+/)
    .map((line) => line.trim().replace(/^[\-\*\d\.\)\s]+/, ""))
    .filter(
      (line) =>
        line &&
        !/^option\s*\d+/i.test(line) &&
        !/^choice\s*\d+/i.test(line) &&
        !/^dm:/i.test(line) &&
        !/^response:/i.test(line) &&
        !/^message:/i.test(line) &&
        !/^here('?s)?/i.test(line),
    )
    .join(" ");
  return stripped.replace(/^"+|"+$/g, "").trim();
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

  let traceId: string | null = null;
  let contextSummary = "";
  const notesRequestResearch = Boolean(body.notes && /research|look\s*up|find out|dig|check|analyze/i.test(body.notes));

  if (body.leadId && user?.id) {
    try {
      const intelligence = await runLeadIntelligence({ leadId: body.leadId, ownerId: user.id, deep: false });
      traceId = intelligence.snapshotId;
      contextSummary = [
        intelligence.outputs.summary,
        ...(intelligence.outputs.talkingPoints || []),
        ...(intelligence.outputs.questions || []),
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 800);
    } catch (err) {
      console.warn("[tanjia][dm-reply] orchestrator fallback", err);
    }
  }

  if (!contextSummary && notesRequestResearch) {
    try {
      const research = await runLiteResearch({ message: body.what_they_said, notes: body.notes });
      contextSummary = research.insights.join("\n");
      traceId = traceId || research.traceId;
      if (!traceId && research.trace) {
        traceId = await saveTrace({
          body: "research-only",
          ownerId: user?.id ?? null,
          leadId: body.leadId,
          trace: research.trace,
        });
      }
    } catch (err) {
      console.warn("[tanjia][dm-reply] research failed", err);
    }
  }

  const systemPrompt = `
You are a Director-of-Networking sending a short DM.
- Quiet, peer tone. No pressure, no pitches.
- 1-3 sentences total.
- Reflect the specific post. Use details, not generic praise.
- If you mention a 2nd Look, keep it one sentence with link: ${tanjiaConfig.secondLookUrl}.
- Never call anything software, SaaS, AI, tool, or platform.
- No meeting links unless explicitly provided (only the 2nd Look link is allowed).
`.trim();

  const userPrompt = `
Channel: DM
What they said: ${body.what_they_said.trim()}
Notes: ${body.notes?.trim() || "None"}
Context: ${contextSummary || "Sparse signals"}
Intent: ${body.intent || "reflect"}

Return only the DM text. No bullets. Stay human and light.
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

    let text = limitSentences(clean(content || ""));
    if (text.length > 320) {
      text = `${text.slice(0, 320).trim()}...`;
    }
    if (!text) {
      text = limitSentences(
        clean(
          `Thanks for sharing this. If you want, I can keep a light eye on what you mentioned and send a calm second look. If not, all good.`,
        ),
      );
    }

    const savedTraceId =
      (traceId as string | null) ||
      (await saveTrace({
        body: text,
        ownerId: user?.id ?? null,
        leadId: body.leadId,
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
        metadata: contextSummary ? { contextSummary } : undefined,
      }));

    return NextResponse.json({ text, traceId: savedTraceId || null });
  } catch (error) {
    console.error("[tanjia][dm-reply] error", error);
    return NextResponse.json({ error: "Unable to draft right now." }, { status: 500 });
  }
}
