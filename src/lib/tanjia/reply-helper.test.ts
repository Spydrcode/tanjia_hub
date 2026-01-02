// Simple test utilities since vitest is not installed
const describe = (name: string, fn: () => void) => fn();
const it = (name: string, fn: () => void) => fn();
const expect = (actual: any) => ({
  toBe: (expected: any) => { if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`); },
  toEqual: (expected: any) => { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); },
  toContain: (expected: any) => { if (!actual.includes(expected)) throw new Error(`Expected ${actual} to contain ${expected}`); },
  toBeGreaterThan: (expected: any) => { if (actual <= expected) throw new Error(`Expected ${actual} to be greater than ${expected}`); },
  some: (fn: (item: any) => boolean) => ({ toBe: (expected: boolean) => { if (actual.some(fn) !== expected) throw new Error(`Expected some to be ${expected}`); } }),
  not: {
    toContain: (expected: any) => { if (actual.includes(expected)) throw new Error(`Expected ${actual} to not contain ${expected}`); }
  }
});
import { findBannedPhrases, validateTone } from "./copy-rules";
import { SignalExtractSchema, ReplyDraftSchema } from "./signal-schema";

describe("Copy Rules", () => {
  describe("findBannedPhrases", () => {
    it("should detect banned phrases case-insensitively", () => {
      const text = "We will optimize your workflow and leverage AI to scale your business";
      const found = findBannedPhrases(text);
      expect(found).toContain("optimize");
      expect(found).toContain("leverage");
      expect(found).toContain("scale");
    });

    it("should return empty array for clean text", () => {
      const text = "This is a calm outside perspective on what's actually happening";
      const found = findBannedPhrases(text);
      expect(found).toEqual([]);
    });
  });

  describe("validateTone", () => {
    it("should pass for Quiet Founder tone", () => {
      const text = "Appreciate how you framed the water heater challenge. If helpful, 2nd Look offers a calm outside perspective.";
      const result = validateTone(text);
      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it("should fail for SaaS language", () => {
      const text = "We'll optimize your operations and leverage our AI-powered platform to scale!";
      const result = validateTone(text);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it("should fail for bullet points", () => {
      const text = "Here's how we help:\n- Scale your business\n- Optimize operations";
      const result = validateTone(text);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain("Contains bullet points or numbered lists");
    });

    it("should fail for excessive exclamation points", () => {
      const text = "This is great! We love it! So excited!!!";
      const result = validateTone(text);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes("exclamation"))).toBe(true);
    });
  });
});

describe("Signal Extraction Schema", () => {
  it("should validate a complete signal extract", () => {
    const validData = {
      raw_text: "I own Desert Pioneer Plumbing...",
      channel: "comment" as const,
      intent: "reply" as const,
      detected: {
        person_name: "John",
        business_name: "Desert Pioneer Plumbing",
        trade: "plumbing",
        location: "Arizona",
        service_keywords: ["water heater", "leak repair"],
      },
      values: ["honesty", "transparency"],
      pressures: ["time", "callbacks"],
      stage: "solo_owner" as const,
      risks: ["overwhelmed"],
      openings: ["busy", "wear many hats"],
      do_not_say: ["optimize", "automate"],
      recommended_angle: "Reflect time pressure + offer 2nd Look for calm perspective",
      confidence: 0.8,
    };

    const result = SignalExtractSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should fail for invalid channel", () => {
    const invalidData = {
      raw_text: "test",
      channel: "invalid",
      intent: "reply",
      detected: { service_keywords: [] },
      values: [],
      pressures: [],
      stage: "unknown",
      risks: [],
      openings: [],
      do_not_say: [],
      recommended_angle: "test",
      confidence: 0.5,
    };

    const result = SignalExtractSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe("Reply Draft Schema", () => {
  it("should validate a complete reply draft", () => {
    const validData = {
      reply_text: "Hey — appreciate how you framed the water heater challenge...",
      style_checks: {
        is_directed_to_commenter: true,
        references_specific_detail: true,
        mentions_2ndmynd: true,
        mentions_2nd_look: true,
        includes_link: true,
        one_cta_max: true,
        avoids_saas_language: true,
        avoids_roleplay_as_commenter: true,
      },
      cta: {
        type: "question" as const,
        text: "Does that resonate?",
      },
      length: {
        chars: 150,
        words: 25,
      },
    };

    const result = ReplyDraftSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe("Reply Validation Scenarios", () => {
  describe("Plumbing comment example (from screenshot)", () => {
    it("should detect roleplay as commenter", () => {
      const badReply = "I own Desert Pioneer Plumbing and specialize in water heaters, softeners, and leak repair...";
      
      // Test roleplay pattern detection
      const roleplayPattern = /I (own|run|started|founded) (this business|my business|[A-Z][a-z]+\s+(Plumbing|HVAC|Electrical))/i;
      expect(roleplayPattern.test(badReply)).toBe(true);
    });

    it("should validate a good reply addressing the commenter", () => {
      const goodReply = `Hey — really appreciate how you framed the importance of honesty and keeping customers informed through the whole process. That kind of transparency builds real trust, especially when scope creeps or surprises come up. At 2ndmynd we work with owner-led service businesses to step back and see what's actually pulling on time and resources. 2nd Look is a calm outside perspective — not a report, not an audit, not a new system. https://www.2ndmynd.com/second-look`;
      
      // Should mention 2nd Look and link
      expect(goodReply).toContain("2nd Look");
      expect(goodReply).toContain("https://www.2ndmynd.com/second-look");
      
      // Should NOT roleplay as commenter
      const roleplayPattern = /I (own|run|started) (Desert Pioneer|this business)/i;
      expect(roleplayPattern.test(goodReply)).toBe(false);
      
      // Should reference specific detail
      expect(goodReply.toLowerCase()).toContain("honesty");
      expect(goodReply.toLowerCase()).toContain("transparency");
      
      // Should avoid banned phrases
      const banned = findBannedPhrases(goodReply);
      expect(banned.length).toBe(0);
    });
  });

  describe("Realtor post example", () => {
    it("should address realtor directly with relevant pressures", () => {
      const mockInput = "Just closed on 3 properties this week! Juggling showings, paperwork, and client calls around the clock.";
      
      // A good reply would:
      // - Address them (not speak as them)
      // - Reference specific detail (3 properties, juggling)
      // - Reflect pressure (time, organization)
      // - Offer 2nd Look
      
      const goodReply = `Hey — 3 closings in one week is real momentum, but juggling showings, paperwork, and callbacks around the clock can pull you in every direction. At 2ndmynd we help owner-operators in service businesses step back and see where the weight actually is. 2nd Look is a calm outside perspective — not software, not a report. https://www.2ndmynd.com/second-look`;
      
      expect(goodReply).toContain("2nd Look");
      expect(goodReply).toContain("https://www.2ndmynd.com/second-look");
      expect(goodReply.toLowerCase()).toContain("3");
      expect(goodReply.toLowerCase()).toContain("juggling");
      
      const banned = findBannedPhrases(goodReply);
      expect(banned.length).toBe(0);
    });
  });

  describe("Overwhelmed post example", () => {
    it("should be supportive without adding pressure", () => {
      const mockInput = "I'm drowning in callbacks and trying to keep up with scheduling. Feel like I'm always behind.";
      
      const goodReply = `Hey — that feeling of always being behind is real, especially when callbacks and scheduling pull you in different directions. At 2ndmynd we work with business owners to step back and see what's actually creating the backlog. 2nd Look is a calm outside perspective on where the weight is — not an audit or a new system to manage. https://www.2ndmynd.com/second-look`;
      
      // Should avoid pressure words
      expect(goodReply.toLowerCase()).not.toContain("urgent");
      expect(goodReply.toLowerCase()).not.toContain("must");
      expect(goodReply.toLowerCase()).not.toContain("need to");
      
      // Should be calm
      expect(goodReply).toContain("calm");
      
      const toneCheck = validateTone(goodReply);
      expect(toneCheck.valid).toBe(true);
    });
  });

  describe("Short vague comment example", () => {
    it("should stay supportive even with sparse signals", () => {
      const mockInput = "Tough week.";
      
      const goodReply = `Hey — sometimes the toughest weeks are the ones where you're carrying more than shows on the surface. If helpful, 2nd Look offers a calm outside perspective on what's actually pulling on time and focus. https://www.2ndmynd.com/second-look`;
      
      expect(goodReply).toContain("2nd Look");
      expect(goodReply).toContain("https://www.2ndmynd.com/second-look");
      
      // Should still be supportive without inventing facts
      expect(goodReply.toLowerCase()).not.toContain("your business");
      expect(goodReply.toLowerCase()).not.toContain("your company");
      
      const toneCheck = validateTone(goodReply);
      expect(toneCheck.valid).toBe(true);
    });
  });
});
