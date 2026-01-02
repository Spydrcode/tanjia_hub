/**
 * Copy rules and tone guide for Tanjia reply assistant.
 * Ensures replies never sound robotic, SaaS-y, or like marketing.
 */

/**
 * Banned phrases that must never appear in replies.
 * These violate the "Quiet Founder" tone.
 */
export const BANNED_PHRASES = [
  "optimize",
  "leverage",
  "scale",
  "synergy",
  "AI-powered",
  "SaaS",
  "platform",
  "dashboard",
  "audit",
  "report",
  "pipeline",
  "agent",
  "MCP",
  "automation",
  "growth hack",
  "funnel",
  "conversion",
  "touchpoints",
  "streamline",
  "efficiency",
  "maximize",
  "ROI",
  "KPI",
  "metrics",
  "data-driven",
  "cutting-edge",
  "game-changer",
  "disrupt",
  "revolutionary",
  "transform",
  "seamless",
  "enterprise",
  "best-in-class",
  "world-class",
  "turnkey",
];

/**
 * Preferred language examples that align with "Quiet Founder" tone.
 */
export const PREFERRED_LANGUAGE = [
  "calm outside perspective",
  "step back and see what's pulling on time/resources",
  "owner-led businesses where growth stretches responsibility",
  "not a report, not an audit, not a new system",
  "use only what feels true",
  "quiet eye on the pieces",
  "without pressure",
  "keep things grounded",
  "what's actually happening",
  "where the weight is",
  "breathing room",
  "support that doesn't add more",
];

/**
 * Tone guide for reply generation.
 */
export const TONE_GUIDE = `
Quiet Founder Tone Guide:

DO:
- Write like a peer, not a vendor
- Be understated and calm
- Reference specific details they shared
- Acknowledge real operational pressures
- Offer support without hype
- Use plain, grounded language
- Keep it conversational and human

DON'T:
- Sound like marketing copy
- Use buzzwords or jargon
- Make big promises
- Create urgency or FOMO
- Pitch or sell
- Use exclamation points (rarely)
- Write in bullet points or lists
- Add emoji or formatting tricks

Voice characteristics:
- Observational, not prescriptive
- Supportive, not pushy
- Specific, not generic
- Grounded in their reality
- Respectful of their autonomy
`.trim();

/**
 * Check if text contains any banned phrases (case-insensitive).
 * Returns array of found banned phrases.
 */
export function findBannedPhrases(text: string): string[] {
  const lowerText = text.toLowerCase();
  return BANNED_PHRASES.filter((phrase) => lowerText.includes(phrase.toLowerCase()));
}

/**
 * Validate that text follows Quiet Founder tone rules.
 */
export function validateTone(text: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for banned phrases
  const banned = findBannedPhrases(text);
  if (banned.length > 0) {
    issues.push(`Contains banned phrases: ${banned.join(", ")}`);
  }

  // Check for excessive exclamation points
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > 1) {
    issues.push(`Too many exclamation points (${exclamationCount})`);
  }

  // Check for all-caps words (likely shouting)
  const allCapsWords = text.match(/\b[A-Z]{3,}\b/g) || [];
  if (allCapsWords.length > 0) {
    issues.push(`Contains all-caps words: ${allCapsWords.join(", ")}`);
  }

  // Check for bullet points or numbered lists
  if (/^\s*[\-\*\d]+[\.\)]\s/m.test(text)) {
    issues.push("Contains bullet points or numbered lists");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
