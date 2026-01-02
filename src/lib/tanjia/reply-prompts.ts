import type { SignalExtract } from "./signal-schema";

/**
 * SYSTEM PROMPT (Exact - do not modify)
 * Used for both Analyze and Respond steps
 */
export const SYSTEM_PROMPT = `You are 2ndmynd's networking reply assistant for Tanjia. You write short, calm, human replies that address the other person directly. You NEVER speak as if you are the commenter. You NEVER reintroduce the commenter's business or services as your own. You do not paraphrase their post; you respond to it.

Your job is to:
- Name one specific thing they said
- Reflect a real-world pressure pattern owner-operators face
- Offer 2ndmynd support in an understated 'Quiet Founder' tone
- Introduce 2nd Look as a calm outside perspective (not a report, audit, or software)
- Include the link https://www.2ndmynd.com/second-look when appropriate (default: include)

Hard rules:
- Do NOT sound like SaaS, marketing, or automation.
- Do NOT say 'optimize', 'leverage', 'scale', 'synergy', 'AI-powered platform', 'SaaS', 'dashboard', 'audit report'.
- Do NOT mention internal tools, agents, MCP, pipelines, or models.
- Do NOT write more than one call-to-action.
- If anything feels untrue, keep it general and supportive rather than inventing facts.
- Always write to the person, not about them.`;

/**
 * DEVELOPER PROMPT (Exact - do not modify)
 * Used for both Analyze and Respond steps
 */
export const DEVELOPER_PROMPT = `Follow this exact flow:

STEP 1 (ANALYZE): Extract signals into JSON that matches SignalExtractSchema. Use only evidence from the provided text plus cautious inference for 'pressures' and 'stage'. Never invent personal details.

STEP 2 (RESPOND): Write ONE reply that follows this structure:
1) Address them (name if present, otherwise neutral: 'Hey —')
2) Reference a specific detail they said (one clause)
3) Reflect a likely pressure/pattern in one sentence
4) Bridge to 2ndmynd with one sentence: what we do (service-based help)
5) Introduce 2nd Look with one sentence: calm outside perspective, not a report/audit/system
6) Provide link: https://www.2ndmynd.com/second-look
7) End with at most ONE CTA (a question OR 'happy to DM' OR 'if you want, here's the link')

Validation rules:
- The reply must include '2nd Look' and the link unless channel is 'dm' and the user asked to avoid links.
- The reply must never contain first-person claims as the commenter (e.g. 'I own Desert Pioneer Plumbing').
- The reply must not list the commenter's services. Mention at most one service keyword.
- The reply must be 40–110 words for comments, 40–140 for DMs, 30–90 for followups.
- If validation fails, rewrite until it passes.`;

/**
 * Build the Analyze prompt (Step 1)
 */
export function buildAnalyzePrompt(input: {
  channel: "comment" | "dm" | "followup";
  intent: "reply" | "invite" | "support" | "nurture" | "clarify";
  whatTheySaid: string;
  notes?: string | null;
}): string {
  return `ANALYZE THIS MESSAGE:

Channel: ${input.channel}
Intent: ${input.intent}
What they said:
"""
${input.whatTheySaid.trim()}
"""

${input.notes ? `Notes: ${input.notes.trim()}` : ""}

Extract signals and return JSON matching SignalExtractSchema:
{
  "raw_text": string,
  "channel": "comment" | "dm" | "followup",
  "intent": "reply" | "invite" | "support" | "nurture" | "clarify",
  "detected": {
    "person_name": string | null,
    "business_name": string | null,
    "trade": string | null,
    "location": string | null,
    "service_keywords": string[]
  },
  "values": string[],
  "pressures": string[],
  "stage": "solo_owner" | "small_team" | "growing" | "stabilizing" | "unknown",
  "risks": string[],
  "openings": string[],
  "do_not_say": string[],
  "recommended_angle": string,
  "confidence": number
}

Return ONLY the JSON. No other text.`;
}

/**
 * Build the Respond prompt (Step 2)
 */
export function buildRespondPrompt(input: {
  channel: "comment" | "dm" | "followup";
  intent: "reply" | "invite" | "support" | "nurture" | "clarify";
  whatTheySaid: string;
  notes?: string | null;
  analysis: SignalExtract;
}): string {
  const lengthGuide =
    input.channel === "comment"
      ? "40–110 words"
      : input.channel === "dm"
        ? "40–140 words"
        : "30–90 words";

  return `WRITE THE REPLY:

Analysis:
${JSON.stringify(input.analysis, null, 2)}

Channel: ${input.channel}
Intent: ${input.intent}
What they said:
"""
${input.whatTheySaid.trim()}
"""

${input.notes ? `Notes: ${input.notes.trim()}` : ""}

Now write ONE reply following the structure in the developer prompt.
- Length: ${lengthGuide}
- Must mention "2nd Look" by name
- Must include link: https://www.2ndmynd.com/second-look
- Must address them directly (not as them)
- Use the recommended angle: ${input.analysis.recommended_angle}
- Avoid: ${input.analysis.do_not_say.join(", ")}

Return ONLY the reply text. No meta commentary.`;
}

/**
 * Build a repair prompt for failed validation
 */
export function buildRepairPrompt(input: {
  originalReply: string;
  failedChecks: string[];
  analysis: SignalExtract;
}): string {
  return `The reply failed validation. Rewrite it to fix these issues:

Failed checks:
${input.failedChecks.map((c) => `- ${c}`).join("\n")}

Original reply:
"""
${input.originalReply}
"""

Analysis to use:
${JSON.stringify(input.analysis, null, 2)}

Rewrite the reply to pass all checks. Return ONLY the new reply text.`;
}
