import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runAgent } from "@/src/lib/agents/runtime";
import { toolDefinitions, toolFetchPublicPage } from "@/src/lib/agents/tools";

const RequestSchema = z.object({
  leadId: z.string().nullable().optional(),
  url: z.string().url(),
});

const OutputSchema = z.object({
  growthChanges: z.array(z.string()).default([]),
  frictionPoints: z.array(z.string()).default([]),
  calmNextSteps: z.array(z.string()).default([]),
  rawSummary: z.string().optional(),
});

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

  // Normalize URL
  let url = body.url.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  // Collect page content
  let pageContent = "";
  try {
    const fetchResult = await toolFetchPublicPage({ url });
    pageContent = fetchResult.output?.snippet || "";
  } catch (err) {
    console.warn("[analyze] fetch failed", err);
  }

  // Try to fetch about page too
  let aboutContent = "";
  try {
    const aboutUrl = url.replace(/\/$/, "") + "/about";
    const aboutResult = await toolFetchPublicPage({ url: aboutUrl });
    aboutContent = aboutResult.output?.snippet || "";
  } catch {
    // Optional page
  }

  const combinedContent = [pageContent, aboutContent].filter(Boolean).join("\n\n---\n\n").slice(0, 6000);

  if (!combinedContent) {
    return NextResponse.json({
      growthChanges: ["Could not fetch page content"],
      frictionPoints: ["Unable to analyze without page content"],
      calmNextSteps: ["Try a different URL or check if the site is accessible"],
      rawSummary: "Page fetch failed",
    });
  }

  const systemPrompt = `
You analyze websites for a quiet founder who wants to understand potential connections.

RULES:
- Be observational, not diagnostic. You're noting patterns, not prescribing fixes.
- Never use jargon, tech speak, or consultant language.
- Keep each bullet to one sentence.
- Be genuinely helpful, not salesy or pushy.
- If signals are thin, say so honestly.

Analyze the page content and return JSON:
{
  "growthChanges": ["3-5 bullets about what's changed or growing for them"],
  "frictionPoints": ["2-4 bullets about where they might be stuck or struggling"],
  "calmNextSteps": ["2-4 bullets with gentle suggestions for how to approach them"],
  "rawSummary": "A 2-3 sentence overview of what this business does"
}

Keep observations grounded in what's actually visible on the page.
`.trim();

  const userPrompt = `
Website URL: ${url}

Page content:
${combinedContent}

Analyze this and provide insights.
`.trim();

  try {
    const { content, trace, _meta } = await runAgent({
      systemPrompt,
      userPrompt,
      tools: [],
      maxSteps: 1,
      executeTool: async () => ({}),
      context: {
        taskName: "website_analysis",
        hasTools: false,
        inputLength: combinedContent.length,
        userText: url,
      },
    });

    let parsed: z.infer<typeof OutputSchema> = {
      growthChanges: [],
      frictionPoints: [],
      calmNextSteps: [],
      rawSummary: "",
    };

    try {
      const json = JSON.parse(content || "{}");
      parsed = OutputSchema.parse(json);
    } catch {
      // Fallback parsing
      parsed = {
        growthChanges: ["Analysis results could not be structured"],
        frictionPoints: [],
        calmNextSteps: ["Review the raw content manually"],
        rawSummary: content?.slice(0, 500) || "",
      };
    }

    // Save to lead_analyses
    try {
      await supabase.from("lead_analyses").insert({
        owner_id: user.id,
        lead_id: body.leadId || null,
        url,
        growth_changes: parsed.growthChanges,
        friction_points: parsed.frictionPoints,
        calm_next_steps: parsed.calmNextSteps,
        raw_summary: parsed.rawSummary,
        metadata: trace ? { trace: { model: trace.model, start: trace.start, end: trace.end }, _meta } : {},
      });
    } catch (err) {
      console.warn("[analyze] save failed", err);
    }

    // If linked to a lead, also save a snapshot
    if (body.leadId) {
      try {
        await supabase.from("lead_snapshots").insert({
          lead_id: body.leadId,
          source_urls: [url],
          summary: parsed.rawSummary || parsed.growthChanges.join("; ").slice(0, 500),
          extracted_json: {
            type: "website_analysis",
            growthChanges: parsed.growthChanges,
            frictionPoints: parsed.frictionPoints,
            calmNextSteps: parsed.calmNextSteps,
          },
          tokens_estimate: Math.ceil(combinedContent.length / 4),
        });
      } catch (err) {
        console.warn("[analyze] snapshot save failed", err);
      }
    }

    return NextResponse.json({
      growthChanges: parsed.growthChanges,
      frictionPoints: parsed.frictionPoints,
      calmNextSteps: parsed.calmNextSteps,
      rawSummary: parsed.rawSummary,
    });
  } catch (error) {
    console.error("[analyze] error", error);
    return NextResponse.json({ error: "Unable to analyze right now." }, { status: 500 });
  }
}
