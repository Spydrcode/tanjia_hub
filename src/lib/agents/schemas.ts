import { z } from "zod";

export const LeadEnrichResponseSchema = z.object({
  signals: z.object({
    website: z.string(),
    title: z.string().optional(),
    services: z.array(z.string()).default([]),
    locations: z.array(z.string()).default([]),
    contact: z.object({ email: z.string().optional(), phone: z.string().optional() }).partial().optional(),
    socials: z.array(z.object({ platform: z.string(), url: z.string() })).default([]),
    credibility: z.array(z.string()).default([]),
    snippetSources: z.array(z.object({ url: z.string(), via: z.string() })).default([]),
  }),
  overview: z.object({
    bio: z.string(),
    likelyNeeds: z
      .array(
        z.object({
          need: z.string(),
          evidence: z.string(),
          confidence: z.number().min(0).max(1).optional(),
        }),
      )
      .default([]),
    suggestedNextStep: z.string(),
    secondLookAngle: z.string(),
  }),
});

export const MeetingResultsResponseSchema = z.object({
  summary_md: z.string(),
  followup_plan: z
    .array(
      z.object({
        interaction_id: z.string().optional().nullable(),
        priority: z.enum(["hot", "warm", "cold"]),
        person: z.string(),
        company: z.string().optional().nullable(),
        reason: z.string().optional().default(""),
        score_reason: z.string(),
        next_action: z.string(),
        next_message: z.string(),
        confidence: z.number().min(0).max(1).optional(),
      }),
    )
    .default([]),
  intro_tests: z.object({
    intro_a: z.object({ text: z.string(), when_to_use: z.string() }).partial().default({}),
    intro_b: z.object({ text: z.string(), when_to_use: z.string() }).partial().default({}),
  }),
  improvements: z
    .array(z.object({ title: z.string(), why: z.string(), try_next_time: z.string() }))
    .default([]),
});

export const MessageAssistantResponseSchema = z.object({
  options: z.array(z.string()).min(2),
  bestIndex: z.number().int().nonnegative(),
  why: z.string(),
});
