import { runAgent } from "@/src/lib/agents/runtime";
import { SignalExtractSchema, ReplyDraftSchema, type SignalExtract, type ReplyDraft } from "./signal-schema";
import {
  SYSTEM_PROMPT,
  DEVELOPER_PROMPT,
  buildAnalyzePrompt,
  buildRespondPrompt,
  buildRepairPrompt,
} from "./reply-prompts";
import { findBannedPhrases, validateTone } from "./copy-rules";

const SECOND_LOOK_LINK = "https://www.2ndmynd.com/second-look";

export type GenerateReplyInput = {
  channel: "comment" | "dm" | "followup";
  intent: "reply" | "invite" | "support" | "nurture" | "clarify";
  whatTheySaid: string;
  notes?: string | null;
  leadId?: string | null;
};

export type GenerateReplyOutput = {
  reply_text: string;
  analysis: SignalExtract;
  checks: ReplyDraft["style_checks"];
  meta: {
    failures: string[];
    analysis_trace?: unknown;
    respond_trace?: unknown;
    repair_trace?: unknown;
  };
};

/**
 * Two-step agent flow: Analyze → Respond
 * 1. Extract signals from input
 * 2. Generate reply based on signals
 * 3. Validate reply and repair if needed
 */
export async function generateReply(input: GenerateReplyInput): Promise<GenerateReplyOutput> {
  const failures: string[] = [];

  // STEP 1: ANALYZE
  const analyzePrompt = buildAnalyzePrompt({
    channel: input.channel,
    intent: input.intent,
    whatTheySaid: input.whatTheySaid,
    notes: input.notes,
  });

  let analysis: SignalExtract;
  let analysisTrace: unknown;

  try {
    const analyzeResult = await runAgent({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `${DEVELOPER_PROMPT}\n\n${analyzePrompt}`,
      tools: [],
      maxSteps: 1,
      executeTool: async () => ({}),
      context: {
        taskName: "reply_analyze",
        hasTools: false,
        inputLength: input.whatTheySaid.length,
        userText: input.whatTheySaid,
      },
    });

    analysisTrace = analyzeResult.trace;

    // Parse JSON response
    const content = analyzeResult.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    const parsed = JSON.parse(jsonStr);
    analysis = SignalExtractSchema.parse(parsed);
  } catch (error) {
    // Retry once with repair prompt
    console.warn("[reply-helper] Analysis failed, retrying:", error);
    failures.push("Analysis parse failed on first attempt");

    try {
      const repairResult = await runAgent({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: `The previous analysis failed to parse. Please return valid JSON matching SignalExtractSchema.\n\n${analyzePrompt}`,
        tools: [],
        maxSteps: 1,
        executeTool: async () => ({}),
        context: { taskName: "reply_analyze_repair", hasTools: false, inputLength: input.whatTheySaid.length },
      });

      const content = repairResult.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(jsonStr);
      analysis = SignalExtractSchema.parse(parsed);
    } catch (retryError) {
      // Fallback: create minimal analysis
      console.error("[reply-helper] Analysis repair failed:", retryError);
      failures.push("Analysis repair also failed - using fallback");
      analysis = {
        raw_text: input.whatTheySaid,
        channel: input.channel,
        intent: input.intent,
        detected: {
          person_name: null,
          business_name: null,
          trade: null,
          location: null,
          service_keywords: [],
        },
        values: ["trust", "reliability"],
        pressures: ["time", "organization"],
        stage: "unknown",
        risks: ["overwhelm"],
        openings: ["busy", "wear many hats"],
        do_not_say: ["optimize", "scale", "automate"],
        recommended_angle: "Reflect time pressure + offer 2nd Look for calm perspective",
        confidence: 0.3,
      };
    }
  }

  // STEP 2: RESPOND
  const respondPrompt = buildRespondPrompt({
    channel: input.channel,
    intent: input.intent,
    whatTheySaid: input.whatTheySaid,
    notes: input.notes,
    analysis,
  });

  let replyText: string;
  let respondTrace: unknown;
  let repairTrace: unknown | undefined;

  try {
    const respondResult = await runAgent({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `${DEVELOPER_PROMPT}\n\n${respondPrompt}`,
      tools: [],
      maxSteps: 1,
      executeTool: async () => ({}),
      context: { taskName: "reply_respond", hasTools: false, inputLength: input.whatTheySaid.length },
    });

    respondTrace = respondResult.trace;
    replyText = cleanReplyText(respondResult.content);
  } catch (error) {
    console.error("[reply-helper] Respond failed:", error);
    failures.push("Respond step failed");
    throw new Error("Failed to generate reply");
  }

  // STEP 3: VALIDATE
  const validation = validateReply(replyText, analysis, input.channel);

  // If validation fails, do ONE repair attempt
  if (!validation.valid) {
    failures.push(`Initial validation failed: ${validation.issues.join(", ")}`);

    try {
      const repairPromptText = buildRepairPrompt({
        originalReply: replyText,
        failedChecks: validation.issues,
        analysis,
      });

      const repairResult = await runAgent({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: `${DEVELOPER_PROMPT}\n\n${repairPromptText}`,
        tools: [],
        maxSteps: 1,
        executeTool: async () => ({}),
        context: { taskName: "reply_repair", hasTools: false, inputLength: replyText.length },
      });

      repairTrace = repairResult.trace;
      replyText = cleanReplyText(repairResult.content);

      // Re-validate
      const revalidation = validateReply(replyText, analysis, input.channel);
      if (!revalidation.valid) {
        failures.push(`Repair validation failed: ${revalidation.issues.join(", ")}`);
      }
    } catch (error) {
      console.error("[reply-helper] Repair failed:", error);
      failures.push("Repair attempt failed");
    }
  }

  // Final validation for output
  const finalValidation = validateReply(replyText, analysis, input.channel);

  return {
    reply_text: replyText,
    analysis,
    checks: finalValidation.checks,
    meta: {
      failures,
      analysis_trace: analysisTrace,
      respond_trace: respondTrace,
      repair_trace: repairTrace,
    },
  };
}

/**
 * Clean reply text: remove meta commentary, quotes, etc.
 */
function cleanReplyText(text: string): string {
  // Remove common meta patterns
  let cleaned = text
    .replace(/^(Here('?s)?|Response:|Reply:|Comment:)\s*/i, "")
    .replace(/^[\-\*\d\.\)\s]+/, "")
    .replace(/^"+|"+$/g, "")
    .trim();

  // Remove multiple consecutive line breaks
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned;
}

/**
 * Validate reply against all requirements
 */
function validateReply(
  replyText: string,
  analysis: SignalExtract,
  channel: "comment" | "dm" | "followup",
): {
  valid: boolean;
  issues: string[];
  checks: ReplyDraft["style_checks"];
} {
  const issues: string[] = [];
  const checks: ReplyDraft["style_checks"] = {
    is_directed_to_commenter: true,
    references_specific_detail: false,
    mentions_2ndmynd: false,
    mentions_2nd_look: false,
    includes_link: false,
    one_cta_max: true,
    avoids_saas_language: true,
    avoids_roleplay_as_commenter: true,
  };

  const lowerText = replyText.toLowerCase();

  // Check: no roleplay as commenter
  const roleplayPatterns = [
    /I (own|run|started|founded) (this business|my business|[A-Z][a-z]+\s+(Plumbing|HVAC|Electrical|Roofing|Construction))/i,
    /At [A-Z][a-z]+\s+(Plumbing|HVAC|Electrical|Roofing|Construction)/i,
    /my (company|business|team|customers|clients) (is|are|has|have)/i,
  ];
  if (roleplayPatterns.some((pattern) => pattern.test(replyText))) {
    checks.avoids_roleplay_as_commenter = false;
    issues.push("Reply roleplays as the commenter");
  }

  // Check: directed to commenter (not about them)
  const aboutThemPatterns = [
    /they (own|run|started|operate|mentioned|said)/i,
    /their (business|company|team|post|comment)/i,
  ];
  if (aboutThemPatterns.some((pattern) => pattern.test(replyText))) {
    checks.is_directed_to_commenter = false;
    issues.push("Reply talks about them instead of to them");
  }

  // Check: references specific detail
  const hasDetail =
    analysis.detected.service_keywords.some((kw) => lowerText.includes(kw.toLowerCase())) ||
    (analysis.detected.person_name && replyText.includes(analysis.detected.person_name)) ||
    analysis.values.some((v) => lowerText.includes(v.toLowerCase()));
  checks.references_specific_detail = hasDetail;
  if (!hasDetail) {
    issues.push("Reply doesn't reference a specific detail");
  }

  // Check: mentions 2ndmynd
  checks.mentions_2ndmynd = /2ndmynd/i.test(replyText);
  if (!checks.mentions_2ndmynd) {
    issues.push("Reply doesn't mention 2ndmynd");
  }

  // Check: mentions 2nd Look
  checks.mentions_2nd_look = /2nd Look/i.test(replyText);
  if (!checks.mentions_2nd_look) {
    issues.push("Reply doesn't mention '2nd Look'");
  }

  // Check: includes link (unless DM with explicit no-link request)
  checks.includes_link = replyText.includes(SECOND_LOOK_LINK);
  if (!checks.includes_link && channel !== "dm") {
    issues.push("Reply doesn't include the 2nd Look link");
  }

  // Check: at most one CTA
  const ctaPatterns = [
    /\?[^?]*$/,  // Question at end
    /happy to (dm|chat|connect|talk)/i,
    /if you want/i,
    /let me know/i,
    /reach out/i,
    /feel free/i,
  ];
  const ctaCount = ctaPatterns.filter((pattern) => pattern.test(replyText)).length;
  checks.one_cta_max = ctaCount <= 1;
  if (ctaCount > 1) {
    issues.push(`Too many CTAs (${ctaCount})`);
  }

  // Check: avoids SaaS language
  const bannedFound = findBannedPhrases(replyText);
  checks.avoids_saas_language = bannedFound.length === 0;
  if (bannedFound.length > 0) {
    issues.push(`Contains banned phrases: ${bannedFound.join(", ")}`);
  }

  // Check: tone validation
  const toneValidation = validateTone(replyText);
  if (!toneValidation.valid) {
    issues.push(...toneValidation.issues);
  }

  // Check: length constraints
  const words = replyText.split(/\s+/).filter(Boolean).length;
  const lengthRanges = {
    comment: { min: 40, max: 110 },
    dm: { min: 40, max: 140 },
    followup: { min: 30, max: 90 },
  };
  const range = lengthRanges[channel];
  if (words < range.min) {
    issues.push(`Reply too short (${words} words, min ${range.min})`);
  }
  if (words > range.max) {
    issues.push(`Reply too long (${words} words, max ${range.max})`);
  }

  return {
    valid: issues.length === 0,
    issues,
    checks,
  };
}
