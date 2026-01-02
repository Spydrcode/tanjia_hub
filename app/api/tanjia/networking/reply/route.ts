import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runAgent } from "@/src/lib/agents/runtime";
import { tanjiaConfig } from "@/lib/tanjia-config";

const RequestSchema = z.object({
  channel: z.enum(["comment", "dm", "email"]),
  intent: z.enum(["reflect", "invite", "schedule", "encourage"]).optional(),
  what_they_said: z.string().min(1),
  notes: z.string().nullable().optional(),
  leadId: z.string().nullable().optional(),
});

type Channel = z.infer<typeof RequestSchema>["channel"];
type Intent = NonNullable<z.infer<typeof RequestSchema>["intent"]>;

const secondLookLink = tanjiaConfig.secondLookUrl;

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
        !/^(dm|response|message|reply|comment|email):/i.test(line) &&
        !/^here('?s)?/i.test(line),
    )
    .join(" ");
  return stripped.replace(/^"+|"+$/g, "").trim();
}

const channelTones: Record<Channel, string> = {
  comment: "public comment on a post (1-2 sentences, engaging and warm)",
  dm: "direct message (1-3 sentences, personal and quiet)",
  email: "email message (2-4 sentences, slightly more formal but still warm)",
};

const intentGuidance: Record<Intent, string> = {
  reflect: "Mirror what they said. Show you heard them.",
  invite: "Invite them to share more if they'd like.",
  schedule: "Offer to find time to talk, no pressure.",
  encourage: "Give genuine encouragement without being over the top.",
};

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

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channel: Channel = body.channel;
  const intent: Intent = body.intent ?? "reflect";

  const systemPrompt = `
You help write calm, thoughtful networking responses. You are NOT an assistant or AI - you write as if you ARE the person sending the message.

RULES:
- Write a ${channelTones[channel]}
- ${intentGuidance[intent]}
- Never use corporate speak, emojis, or hype words
- Never mention AI, software, tools, platforms, or automation
- Keep language peer-to-peer, like talking to a colleague
- If mentioning a second look, include: ${secondLookLink}
- Stay genuinely curious, not salesy

Also generate:
1. A follow-up question they could ask next (if conversation continues)
2. A one-line note about what Second Look offers (for context)

Return JSON:
{
  "reply": "your calm reply text",
  "followupQuestion": "a question for continuing the conversation",
  "secondLookNote": "one line about Second Look"
}
`.trim();

  const userPrompt = `
Channel: ${channel}
Their message: ${body.what_they_said.trim()}
Your notes: ${body.notes?.trim() || "None"}
Intent: ${intent}

Write the response now.
`.trim();

  try {
    const { content, trace, _meta } = await runAgent({
      systemPrompt,
      userPrompt,
      tools: [],
      maxSteps: 1,
      executeTool: async () => ({}),
      context: {
        taskName: "networking_reply",
        hasTools: false,
        inputLength: body.what_they_said.length,
        userText: body.what_they_said,
      },
    });

    let parsed: { reply: string; followupQuestion: string; secondLookNote: string } = {
      reply: "",
      followupQuestion: "",
      secondLookNote: tanjiaConfig.whatIsSecondLookOneSentence,
    };

    try {
      const json = JSON.parse(content || "{}");
      parsed = {
        reply: clean(json.reply || "") || clean(content || ""),
        followupQuestion: clean(json.followupQuestion || ""),
        secondLookNote: json.secondLookNote || tanjiaConfig.whatIsSecondLookOneSentence,
      };
    } catch {
      // If not JSON, treat content as the reply
      parsed.reply = limitSentences(clean(content || ""), channel === "email" ? 4 : 3);
    }

    // Ensure reply isn't empty
    if (!parsed.reply) {
      parsed.reply = `Thanks for sharing this. ${intent === "invite" ? "Would love to hear more about what you're working on." : "Let me know if you'd like to continue the conversation."}`;
    }

    // Save to networking_drafts
    try {
      await supabase.from("networking_drafts").insert({
        owner_id: user.id,
        lead_id: body.leadId || null,
        channel,
        goal: intent,
        input_text: body.what_they_said,
        input_notes: body.notes || null,
        reply_text: parsed.reply,
        followup_question: parsed.followupQuestion,
        second_look_note: parsed.secondLookNote,
        metadata: trace ? { trace: { model: trace.model, start: trace.start, end: trace.end }, _meta } : {},
      });
    } catch (err) {
      console.warn("[networking/reply] save failed", err);
    }

    return NextResponse.json({
      reply: parsed.reply,
      followupQuestion: parsed.followupQuestion,
      secondLookNote: parsed.secondLookNote,
    });
  } catch (error) {
    console.error("[networking/reply] error", error);
    return NextResponse.json({ error: "Unable to generate reply right now." }, { status: 500 });
  }
}
