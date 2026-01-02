import { z } from "zod";

/**
 * Schema for extracting signals from a comment/DM/followup message.
 * This powers the "Analyze" step of the two-step agent flow.
 */
export const SignalExtractSchema = z.object({
  raw_text: z.string(),
  channel: z.enum(["comment", "dm", "followup"]),
  intent: z.enum(["reply", "invite", "support", "nurture", "clarify"]),
  detected: z.object({
    person_name: z.string().nullable().optional(),
    business_name: z.string().nullable().optional(),
    trade: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    service_keywords: z.array(z.string()).default([]),
  }),
  values: z.array(z.string()).describe("Values detected from text: honesty, transparency, reliability, craftsmanship, family, etc."),
  pressures: z.array(z.string()).describe("Likely operational pressures: time, callbacks, pricing convos, scheduling, leads, reviews"),
  stage: z.enum(["solo_owner", "small_team", "growing", "stabilizing", "unknown"]),
  risks: z.array(z.string()).describe("Trust gaps, scope creep, price shoppers, overwhelmed ops"),
  openings: z.array(z.string()).describe("Moments to offer 2nd Look: 'busy', 'wear many hats', 'trying to stay organized'"),
  do_not_say: z.array(z.string()).describe("Generated based on tone rules (e.g. 'audit', 'optimize', 'we automate your growth')"),
  recommended_angle: z.string().describe("One sentence: 'Reflect X + offer 2nd Look for Y'"),
  confidence: z.number().min(0).max(1),
});

export type SignalExtract = z.infer<typeof SignalExtractSchema>;

/**
 * Schema for validating the final reply draft.
 * This powers the "Respond" step validation gate.
 */
export const ReplyDraftSchema = z.object({
  reply_text: z.string(),
  style_checks: z.object({
    is_directed_to_commenter: z.boolean().describe("Reply addresses the person, not written as them"),
    references_specific_detail: z.boolean().describe("Mentions a specific detail from their message"),
    mentions_2ndmynd: z.boolean().describe("Mentions 2ndmynd service"),
    mentions_2nd_look: z.boolean().describe("Mentions '2nd Look' by name"),
    includes_link: z.boolean().describe("Includes https://www.2ndmynd.com/second-look"),
    one_cta_max: z.boolean().describe("Has at most one call-to-action"),
    avoids_saas_language: z.boolean().describe("Avoids SaaS/marketing language"),
    avoids_roleplay_as_commenter: z.boolean().describe("Does not roleplay as the commenter"),
  }),
  cta: z.object({
    type: z.enum(["none", "question", "dm", "link", "invite"]),
    text: z.string().optional(),
  }),
  length: z.object({
    chars: z.number(),
    words: z.number(),
  }),
});

export type ReplyDraft = z.infer<typeof ReplyDraftSchema>;
