import { z } from "zod";

const ensureHttps = (url: string) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("https://")) return trimmed.replace(/\/+$/, "");
  if (trimmed.startsWith("http://")) return trimmed.replace(/^http:\/\//, "https://").replace(/\/+$/, "");
  return `https://${trimmed.replace(/\/+$/, "")}`;
};

export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_CAL_USERNAME: z.string().optional(),
  NEXT_PUBLIC_CAL_EVENT_15_SLUG: z.string().optional(),
  NEXT_PUBLIC_CAL_EVENT_30_SLUG: z.string().optional(),
  CAL_EVENT_15_ID: z.string().optional(),
  CAL_EVENT_30_ID: z.string().optional(),
  CAL_API_KEY: z.string().optional(),
  CAL_API_BASE_URL: z.string().optional(),
  CAL_BOOKING_REDIRECT_URL: z
    .string()
    .optional()
    .transform((val) => (val ? ensureHttps(val) : undefined)),
  CAL_WEBHOOK_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  TANJIA_HELPER_PASSCODE: z.string().optional(),
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_ENV: z.string().optional(),
  PINECONE_INDEX_NAME: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  AGENT_MODEL_SMALL: z.string().optional(),
  AGENT_MODEL_MED: z.string().optional(),
  AGENT_MODEL_LARGE: z.string().optional(),
  TANJIA_AGENT_MODEL: z.string().optional(),
  MAX_SOURCES_SMALL: z.coerce.number().optional(),
  MAX_SOURCES_MED: z.coerce.number().optional(),
  MAX_SOURCES_LARGE: z.coerce.number().optional(),
  MCP_ENABLED: z.coerce.boolean().optional(),
  MCP_SERVER_URL: z.string().optional(),
  SHOWCASE_MODE: z.coerce.boolean().optional(),
  MODEL_ESCALATION_ENABLED: z.string().optional(),
  MODEL_DEFAULT: z.string().optional(),
  MODEL_ESCALATED: z.string().optional(),
  MODEL_ESCALATION_MAX_ATTEMPTS: z.string().optional(),
  MODEL_ESCALATION_MINI_BUDGET: z.string().optional(),
  MODEL_POLICY_DEBUG: z.string().optional(),
});

const parsedEnv = envSchema.safeParse({
  ...process.env,
  NEXT_PUBLIC_CAL_USERNAME: process.env.NEXT_PUBLIC_CAL_USERNAME,
  NEXT_PUBLIC_CAL_EVENT_15_SLUG: process.env.NEXT_PUBLIC_CAL_EVENT_15_SLUG,
  NEXT_PUBLIC_CAL_EVENT_30_SLUG: process.env.NEXT_PUBLIC_CAL_EVENT_30_SLUG,
});

if (!parsedEnv.success) {
  console.warn("Env validation failed, using fallbacks:", parsedEnv.error.issues);
}

export const env = parsedEnv.success
  ? parsedEnv.data
  : envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon-placeholder",
      NEXT_PUBLIC_CAL_USERNAME: process.env.NEXT_PUBLIC_CAL_USERNAME,
      NEXT_PUBLIC_CAL_EVENT_15_SLUG: process.env.NEXT_PUBLIC_CAL_EVENT_15_SLUG,
      NEXT_PUBLIC_CAL_EVENT_30_SLUG: process.env.NEXT_PUBLIC_CAL_EVENT_30_SLUG,
      CAL_EVENT_15_ID: process.env.CAL_EVENT_15_ID,
      CAL_EVENT_30_ID: process.env.CAL_EVENT_30_ID,
      CAL_API_KEY: process.env.CAL_API_KEY,
      CAL_API_BASE_URL: process.env.CAL_API_BASE_URL,
      CAL_BOOKING_REDIRECT_URL: process.env.CAL_BOOKING_REDIRECT_URL,
      CAL_WEBHOOK_SECRET: process.env.CAL_WEBHOOK_SECRET,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      TANJIA_HELPER_PASSCODE: process.env.TANJIA_HELPER_PASSCODE,
      PINECONE_API_KEY: process.env.PINECONE_API_KEY,
      PINECONE_ENV: process.env.PINECONE_ENV,
      PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
      AGENT_MODEL_SMALL: process.env.AGENT_MODEL_SMALL,
      AGENT_MODEL_MED: process.env.AGENT_MODEL_MED,
      AGENT_MODEL_LARGE: process.env.AGENT_MODEL_LARGE,
      TANJIA_AGENT_MODEL: process.env.TANJIA_AGENT_MODEL,
      MAX_SOURCES_SMALL: process.env.MAX_SOURCES_SMALL,
      MAX_SOURCES_MED: process.env.MAX_SOURCES_MED,
      MAX_SOURCES_LARGE: process.env.MAX_SOURCES_LARGE,
      MCP_ENABLED: process.env.MCP_ENABLED,
      MCP_SERVER_URL: process.env.MCP_SERVER_URL,
      SHOWCASE_MODE: process.env.SHOWCASE_MODE,
      MODEL_ESCALATION_ENABLED: process.env.MODEL_ESCALATION_ENABLED,
      MODEL_DEFAULT: process.env.MODEL_DEFAULT,
      MODEL_ESCALATED: process.env.MODEL_ESCALATED,
      MODEL_ESCALATION_MAX_ATTEMPTS: process.env.MODEL_ESCALATION_MAX_ATTEMPTS,
      MODEL_ESCALATION_MINI_BUDGET: process.env.MODEL_ESCALATION_MINI_BUDGET,
      MODEL_POLICY_DEBUG: process.env.MODEL_POLICY_DEBUG,
    });

export const publicEnv = {
  supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  calUsername: env.NEXT_PUBLIC_CAL_USERNAME || "",
  calEvent15Slug: env.NEXT_PUBLIC_CAL_EVENT_15_SLUG || "",
  calEvent30Slug: env.NEXT_PUBLIC_CAL_EVENT_30_SLUG || "",
  calBookingRedirectUrl: env.CAL_BOOKING_REDIRECT_URL || "",
  secondLookUrl: "https://2ndmynd.com/second-look",
  siteUrl: "https://2ndmynd.com",
};

export const serverEnv = {
  ...env,
};

export const featureFlags = {
  mcpEnabled: Boolean(env.MCP_ENABLED),
  pineconeEnabled: Boolean(env.PINECONE_API_KEY && env.PINECONE_INDEX_NAME),
  resendEnabled: Boolean(env.RESEND_API_KEY),
  showcaseMode: Boolean(env.SHOWCASE_MODE),
};

export function normalizeWebsite(url: string | undefined | null) {
  if (!url) return null;
  try {
    const normalized = ensureHttps(url);
    const parsed = new URL(normalized);
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function ensureHttpsUrl(url: string | undefined | null) {
  return url ? ensureHttps(url) : "";
}
