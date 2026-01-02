import { z } from "zod";

export const confidenceEnum = z.enum(["high", "medium", "low"]);

export type Confidence = z.infer<typeof confidenceEnum>;

const signalSchema = z.object({
  label: z.string(),
  detail: z.string().optional(),
  confidence: confidenceEnum.default("low"),
  sourceUrls: z.array(z.string()).optional(),
});

const frictionZoneSchema = z.object({
  key: z.enum(["clarity", "time", "follow_up", "systems", "decision_fatigue"]),
  score: z.number().min(0).max(100).default(40),
  confidence: confidenceEnum.default("low"),
  rationale: z.string().default("Provisional based on limited public signals."),
});

const systemItemSchema = z.object({
  category: z.enum(["crm", "scheduling", "payments", "marketing", "ops", "analytics", "forms", "chat", "other"]),
  label: z.string(),
  confidence: confidenceEnum.default("low"),
  evidenceUrls: z.array(z.string()).optional(),
});

const systemFootprintSchema = z.object({
  detected: z.array(systemItemSchema).default([]),
  inferred: z.array(systemItemSchema).default([]),
});

const nextActionSchema = z.object({
  category: z.enum(["listen", "clarify", "map", "decide", "support"]),
  title: z.string(),
  why: z.string(),
  questionToAsk: z.string(),
  confidence: confidenceEnum.default("low"),
});

const evidenceItemSchema = z.object({
  type: z.enum(["text", "link", "meta", "structured"]),
  url: z.string(),
  snippet: z.string(),
});

const missingSignalSchema = z.object({
  key: z.string(),
  label: z.string(),
  suggestion: z.string().optional(),
});

export const companySnapshotSchema = z.object({
  whatTheyDo: z.string().default("No explicit description yet."),
  whoTheyServe: z.array(z.string()).default([]),
  serviceModel: z.enum(["local", "regional", "online", "hybrid", "unknown"]).default("unknown"),
  companyStage: z.enum(["solo", "small-team", "scaling", "established", "unknown"]).default("unknown"),
  ownerLedLikelihood: z.enum(["high", "medium", "low", "unknown"]).default("unknown"),
  revenueModel: z.enum(["project", "subscription", "mixed", "unknown"]).default("unknown"),
  confidence: confidenceEnum.default("low"),
  rationale: z.array(z.string()).default([]),
});

export const analysisV1Schema = z.object({
  version: z.literal("analysis_v1"),
  input: z.object({
    url: z.string(),
    leadId: z.string().optional(),
    deepScan: z.boolean().optional(),
    fetchedAt: z.string(),
  }),
  snapshot: companySnapshotSchema,
  inference: z.object({
    growthShape: z.object({
      summary: z.string().default("No explicit growth markers found on public pages."),
      signals: z.array(signalSchema).default([]),
      confidence: confidenceEnum.default("low"),
    }),
    frictionZones: z.array(frictionZoneSchema).default([]),
    systems: systemFootprintSchema,
    narrative: z.object({
      calmOverview: z.string().default("Here is what we can responsibly infer so far."),
      whatWeKnow: z.array(z.string()).default([]),
      whatWeDontKnow: z.array(z.string()).default([]),
    }),
  }),
  nextActions: z.array(nextActionSchema).default([]),
  evidence: z.array(evidenceItemSchema).default([]),
  missingSignals: z.array(missingSignalSchema).default([]),
});

export type AnalysisV1 = z.infer<typeof analysisV1Schema>;
export type CompanySnapshot = z.infer<typeof companySnapshotSchema>;
export type Signal = z.infer<typeof signalSchema>;
export type FrictionZone = z.infer<typeof frictionZoneSchema>;
export type SystemFootprint = z.infer<typeof systemFootprintSchema>;
export type SystemItem = z.infer<typeof systemItemSchema>;
export type NextAction = z.infer<typeof nextActionSchema>;
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;
export type MissingSignal = z.infer<typeof missingSignalSchema>;
