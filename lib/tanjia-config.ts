import { publicEnv, serverEnv, featureFlags, ensureHttpsUrl } from "@/src/lib/env";

const calUsername = publicEnv.calUsername || "your-cal-username";
const calBasePath = calUsername ? `https://cal.com/${calUsername}` : "https://cal.com";
const calEvent15Slug = publicEnv.calEvent15Slug || "15min";
const calEvent30Slug = publicEnv.calEvent30Slug || "30min";
const calEvent15Url = `${calBasePath}/${calEvent15Slug}`;
const calEvent30Url = `${calBasePath}/${calEvent30Slug}`;

export const tanjiaPublicConfig = {
  calUsername,
  calEvent15Slug,
  calEvent30Slug,
  calEvent15Url,
  calEvent30Url,
  calBookingRedirectUrl: publicEnv.calBookingRedirectUrl,
  secondLookUrl: publicEnv.secondLookUrl,
  siteUrl: publicEnv.siteUrl,
  introOneLiner: "A quick hello to see if we should keep talking.",
  whatIsSecondLookOneSentence: "A calm review of where you are now, offered only if you want it.",
  followUpOneLiner: "Checking back without pressure - tell me if you'd like to continue.",
} as const;

export const tanjiaServerConfig = {
  ...tanjiaPublicConfig,
  helperPasscodeEnabled: Boolean(serverEnv.TANJIA_HELPER_PASSCODE),
  helperPasscode: serverEnv.TANJIA_HELPER_PASSCODE ?? null,
  resendFromEmail: serverEnv.RESEND_FROM_EMAIL || "tanjia@2ndmynd.com",
  agentModelSmall: serverEnv.AGENT_MODEL_SMALL || "gpt-4o-mini",
  agentModelMed: serverEnv.AGENT_MODEL_MED || "gpt-4o",
  agentModelLarge: serverEnv.AGENT_MODEL_LARGE || "gpt-4.1",
  maxSourcesSmall: serverEnv.MAX_SOURCES_SMALL || 3,
  maxSourcesMed: serverEnv.MAX_SOURCES_MED || 6,
  maxSourcesLarge: serverEnv.MAX_SOURCES_LARGE || 10,
  calApiKey: serverEnv.CAL_API_KEY || "",
  calApiBaseUrl: ensureHttpsUrl(serverEnv.CAL_API_BASE_URL || "https://api.cal.com"),
  calEvent15Id: serverEnv.CAL_EVENT_15_ID || null,
  calEvent30Id: serverEnv.CAL_EVENT_30_ID || null,
  calWebhookSecret: serverEnv.CAL_WEBHOOK_SECRET || null,
  featureFlags,
};

export const tanjiaConfig = tanjiaPublicConfig;

export type ChannelType = "comment" | "dm" | "followup";
export type IntentType = "reply" | "invite" | "support" | "nurture" | "clarify";
