import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tanjiaConfig, tanjiaServerConfig } from "@/lib/tanjia-config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runAgent } from "@/src/lib/agents/runtime";

const RequestSchema = z.object({
  channel: z.literal("comment"),
  intent: z.enum(["reflect", "invite", "schedule", "encourage"]).optional(),
  what_they_said: z.string().min(1),
  notes: z.string().nullable().optional(),
  leadId: z.string().nullable().optional(),
});

const secondLookLink = "https://www.2ndmynd.com/second-look";

async function saveTrace({
  body,
  leadId,
  ownerId,
  trace,
}: {
  body: string;
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
        channel: "comment",
        intent: "reflect",
        body,
        message_type: "reply_helper",
        metadata: trace ? { trace } : {},
        is_sent: false,
      })
      .select("id")
      .single();
    return data?.id as string | null;
  } catch (err) {
    console.warn("[tanjia][comment-reply] trace save failed", err);
    return null;
  }
}

function enforceLength(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const result: string[] = [];
  let wordCount = 0;

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).filter(Boolean);
    if (wordCount + words.length > 170 && result.length) break;
    result.push(sentence.trim());
    wordCount += words.length;
    if (wordCount >= 170) break;
  }

  const combined = result.join(" ").trim();
  if (combined) return combined;

  const fallbackWords = text.split(/\s+/).filter(Boolean).slice(0, 170);
  return fallbackWords.join(" ").trim();
}

function cleanText(text: string) {
  const trimmed = text.replace(/^[\-\*\d\.\s]+/, "").replace(/^"+|"+$/g, "").trim();
  return trimmed;
}

function ensureSingleLink(text: string) {
  const withoutDuplicates = text.replaceAll(secondLookLink, "").trim();
  return `${withoutDuplicates}\n${secondLookLink}`.trim();
}

function fallbackComment(post: string, notes?: string | null) {
  const normalized = post.replace(/\s+/g, " ");
  const fragments = normalized.split(/[.!?\n]/).map((part) => part.trim()).filter(Boolean);
  const mirrored = fragments.slice(0, 4).join("; ");
  const noteLine = notes?.trim() ? `Noting your focus on ${notes.trim()}. ` : "";
  return `Appreciate how you framed ${mirrored}. ${noteLine}If helpful, I can keep a quiet eye on the pieces you mentioned and share a calm second look without pressure. ${secondLookLink}`.trim();
}

function stripMeta(text: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim().replace(/^[\-\*\d\.\)\s]+/, ""))
    .filter(
      (line) =>
        line &&
        !/^option\s*\d+/i.test(line) &&
        !/^choice\s*\d+/i.test(line) &&
        !/^comment:/i.test(line) &&
        !/^response:/i.test(line) &&
        !/^here('?s)?/i.test(line),
    );

  return lines.join(" ");
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

  const systemPrompt = `
You are a Director-of-Networking drafting one public Facebook comment.
Guardrails:
- Quiet Founder tone: calm, peer-to-peer, no hype.
- Mirror 3-5 concrete details from the post (metrics, names, product specifics, places).
- Stay between 90-170 words.
- Never pitch or ask for meetings; keep it observational and appreciative.
- Never call anything software, SaaS, AI, tool, or platform.
- Avoid "clarity/confusion" framing; avoid pressure.
- Always end with the 2nd Look link exactly once.
`.trim();

  const userPrompt = `
Post text:
${body.what_they_said.trim()}

Notes: ${body.notes?.trim() || "None"}
2nd Look link: ${secondLookLink}

Return only the comment text. No bullets. No meta. Include the link once at the end.
`.trim();

  try {
    const { content, trace, _meta } = await runAgent({
      systemPrompt,
      userPrompt,
      tools: [],
      maxSteps: 1,
      executeTool: async () => ({}),
      context: { taskName: "comment_reply", hasTools: false, inputLength: body.what_they_said.length, userText: body.what_they_said },
    });

    let text = enforceLength(cleanText(stripMeta(content || "")));
    if (!text || text.length < 40) {
      text = enforceLength(fallbackComment(body.what_they_said, body.notes));
    }
    text = ensureSingleLink(text);

    const traceId = await saveTrace({
      body: text,
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
            _meta,
          }
        : undefined,
    });

    const clientReason = `Mirrors the specifics they shared and ends with the 2nd Look link with no pressure.`;
    const internalReason = `Grounded in their post (${body.what_they_said.slice(0, 120)}${body.what_they_said.length > 120 ? "..." : ""}) and notes${body.notes ? ` (${body.notes.slice(0, 80)}${body.notes.length > 80 ? "..." : ""})` : ""}; kept calm, added 2nd Look once.`;

    return NextResponse.json({
      text,
      traceId: traceId || null,
      reasoning: {
        internal: internalReason,
        client: clientReason,
      },
    });
  } catch (error) {
    console.error("[tanjia][comment-reply] error", error);
    return NextResponse.json({ error: "Unable to draft right now." }, { status: 500 });
  }
}
