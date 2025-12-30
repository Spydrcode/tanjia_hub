import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tanjiaConfig, tanjiaServerConfig } from "@/lib/tanjia-config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPineconeClient } from "@/lib/pinecone/client";
import { featureFlags, serverEnv } from "@/src/lib/env";
import { runAgent } from "@/src/lib/agents/runtime";
import { getOpenAIClient } from "@/src/lib/openai/client";
import { runScheduleAgent } from "@/src/lib/agents/schedule-agent";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 30;
const requestLog = new Map<string, number[]>();

const RequestSchema = z.object({
  channel: z.enum(["comment", "dm", "followup"]),
  intent: z.enum(["reflect", "invite", "schedule", "encourage"]),
  ownerMessage: z.string().min(1),
  contextNotes: z.string().optional(),
  leadId: z.string().optional(),
});

const defaultModel = serverEnv.TANJIA_AGENT_MODEL || tanjiaServerConfig.agentModelSmall;

function trackRequest(key: string) {
  const now = Date.now();
  const timestamps = requestLog.get(key) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(key, recent);
  return recent.length;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const timestamps = requestLog.get(key) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  requestLog.set(key, recent);
  return recent.length >= RATE_LIMIT_MAX;
}

function parseOptions(raw: string) {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed) as { options?: unknown };
    if (Array.isArray(parsed.options)) {
      return parsed.options.map((item) => String(item)).filter(Boolean);
    }
  } catch {
    // Continue to fallback parsing.
  }

  const lines = trimmed
    .split("\n")
    .map((line) => line.replace(/^[\-\*\d\.\s]+/, "").trim())
    .filter((line) => line.length > 0);
  return lines;
}

async function retrieveLeadContext(leadId: string, ownerId: string, openai: ReturnType<typeof getOpenAIClient>) {
  const supabase = await createSupabaseServerClient();
  const { data: snapshot } = await supabase
    .from("lead_snapshots")
    .select("summary, extracted_json")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const pinecone = createPineconeClient();
  let pineconeContext = "";

  if (pinecone && featureFlags.pineconeEnabled && tanjiaServerConfig.pineconeIndexName) {
    try {
      const queryText = snapshot?.summary || "lead context";
      const embed = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: queryText.slice(0, 1000),
      });
      const vector = embed.data[0]?.embedding;
      if (vector) {
        const index = pinecone.Index(tanjiaServerConfig.pineconeIndexName);
        const namespace = index.namespace(ownerId);
        const result = await namespace.query({ vector, topK: 3, filter: { leadId } });
        pineconeContext = result.matches
          ?.map((match) => {
            const summary = typeof match.metadata?.summary === "string" ? match.metadata.summary : "";
            return summary;
          })
          .filter(Boolean)
          .join("\n")
          .slice(0, 800) ?? "";
      }
    } catch (err) {
      console.warn("[tanjia-agent] pinecone query failed", err);
    }
  }

  let snapshotContext = "";
  if (snapshot) {
    const outputs = snapshot.extracted_json?.outputs;
    snapshotContext = [
      snapshot.summary,
      outputs?.talkingPoints?.join("; "),
      outputs?.questions?.join("; "),
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [snapshotContext, pineconeContext].filter(Boolean).join("\n");
}

export async function POST(request: NextRequest) {
  if (!serverEnv.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing OpenAI API key." }, { status: 500 });
  }
  const openai = getOpenAIClient();

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

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    // @ts-expect-error - NextRequest ip can be undefined in edge/runtime variations.
    request.ip ||
    "unknown";

  const rateKey = user?.id ? `user:${user.id}` : `ip:${ip}`;
  if (isRateLimited(rateKey)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let leadContext = "";
  if (body.leadId && user?.id) {
    leadContext = await retrieveLeadContext(body.leadId, user.id, openai);
  }

  if (body.intent === "schedule") {
    try {
      const schedule = await runScheduleAgent({
        ownerId: user?.id,
        leadId: body.leadId,
        ownerMessage: body.ownerMessage,
        contextNotes: body.contextNotes,
        intent: body.intent,
      });

      const options = [schedule.messageCopy.short, schedule.messageCopy.dm, schedule.messageCopy.email].filter(Boolean);
      return NextResponse.json({ options, schedule });
    } catch (error) {
      console.error("[tanjia-agent] schedule agent error", error);
      return NextResponse.json({ error: "Unable to generate scheduling copy right now." }, { status: 500 });
    }
  }

  const systemPrompt = `
You are Tanjia's message assistant.
Guardrails:
- Quiet Founder tone: calm, respectful, permission-based.
- No hype, no urgency, no pitches or "book now".
- Do not mention AI, automation, funnels, optimize, scale, leverage, clarity.
- Avoid diagnosis or implying problems.
- Keep replies short: 1-3 sentences; 2-3 options only.
- Honor boundaries and keep context minimal when signals are thin.

Reference snippets (do not repeat verbatim unless they fit naturally):
- Intro: ${tanjiaConfig.introOneLiner}
- What is a 2nd Look: ${tanjiaConfig.whatIsSecondLookOneSentence}
- Follow-up: ${tanjiaConfig.followUpOneLiner}
Lead context (optional): ${leadContext || "None"}
`.trim();

  const userPrompt = `
Channel: ${body.channel}
Intent: ${body.intent}
What they said: ${body.ownerMessage.trim()}
Notes: ${body.contextNotes?.trim() || "None"}

Return JSON: { "options": ["reply 1", "reply 2"] }
`.trim();

  try {
    const { content } = await runAgent({
      model: defaultModel,
      systemPrompt,
      userPrompt,
      tools: [],
      executeTool: async () => ({}),
      maxSteps: 2,
    });

    const parsedOptions = parseOptions(content)
      .filter((opt) => opt.length > 0)
      .slice(0, 3);

    const boundedOptions =
      parsedOptions.length >= 2
        ? parsedOptions.map((opt) => opt.split(". ").slice(0, 3).join(". ").slice(0, 320))
        : [];

    const fallbackOptions: Record<typeof body.intent, string[]> = {
      reflect: [
        "Thanks for sharing this. If it's useful, I can read more and send a quiet note back.",
        "Appreciate the update. Would you like a short second look, or should I hold off?",
      ],
      invite: [
        "Happy to compare notes. If you'd like, I can send a short outline and we can keep it light.",
        "If a calm review would help, I'm here. If not, no worries at all.",
      ],
      schedule: [
        "If you want, here's a low-pressure 15-minute slot: I can also send a longer option.",
        "We can keep it brief and adjust if needed. If you'd rather not schedule now, that's fine too.",
      ],
      encourage: [
        "You're moving the right pieces. If you'd like a quick second pair of eyes, I'm here.",
        "No rush—let me know if a short review would be helpful. Otherwise I'll stay out of the way.",
      ],
    };

    const options =
      boundedOptions.length >= 2
        ? boundedOptions
        : (content ? parseOptions(content).slice(0, 2) : []).filter((opt) => opt.length > 0).slice(0, 2);

    const finalOptions =
      options.length >= 2
        ? options
        : fallbackOptions[body.intent] ?? ["Happy to help. Tell me if you'd like a short reply drafted.", "I can take a look and keep it light; just say the word."];

    const count = trackRequest(rateKey);
    console.log(`[tanjia-agent] request count: ${count}`);

    return NextResponse.json({ options: finalOptions });
  } catch (error) {
    console.error("[tanjia-agent] generation error", error);
    return NextResponse.json({ error: "Unable to generate right now. Please try again shortly." }, { status: 500 });
  }
}
