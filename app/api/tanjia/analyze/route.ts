import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runAgent } from "@/src/lib/agents/runtime";
import { toolFetchPublicPage, toolWebSearch } from "@/src/lib/agents/tools";
import { ensureHttpsUrl } from "@/src/lib/env";

const RequestSchema = z.object({
  leadId: z.string().nullable().optional(),
  url: z
    .string()
    .min(1, "URL is required")
    .transform((val) => val.trim()),
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
  const url = ensureHttpsUrl(body.url);
  if (!url) {
    return NextResponse.json({ error: "A valid URL is required." }, { status: 400 });
  }
  const base = new URL(url);

  // Collect multiple pages + search results for richer context
  const snippets: string[] = [];
  const sources: string[] = [];

  async function fetchSnippet(targetUrl: string) {
    try {
      const res = await toolFetchPublicPage({ url: targetUrl });
      if (res.output?.snippet) {
        snippets.push(`# Source: ${res.output.url}\n${res.output.snippet}`);
        sources.push(res.output.url);
      }
    } catch (err) {
      console.warn("[analyze] fetch failed", targetUrl, err);
    }
  }

  const primaryUrls = [
    url,
    `${base.origin}/about`,
    `${base.origin}/team`,
    `${base.origin}/services`,
    `${base.origin}/pricing`,
    `${base.origin}/blog`,
    `${base.origin}/company`,
  ];

  for (const u of primaryUrls) {
    await fetchSnippet(u);
  }

  // Web search to pick up additional public pages
  try {
    const domain = base.hostname.replace(/^www\./, "");
    const search = await toolWebSearch({ query: `${domain} site:${domain}` });
    const searchResults = search.output?.results?.slice(0, 3) || [];
    for (const result of searchResults) {
      if (result?.snippet) {
        snippets.push(`# Search result: ${result.url}\n${result.snippet}`);
      }
      if (result?.url) {
        await fetchSnippet(result.url);
      }
    }
  } catch (err) {
    console.warn("[analyze] search fetch failed", err);
  }

  const combinedContent = snippets.join("\n\n---\n\n").slice(0, 9000);

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
OUTPUT CONTRACT:
- Respond with valid JSON only (no markdown).
- Each array must include at least one bullet; if there is no signal, include a single bullet that explains what is missing.

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

Fetched sources:
${sources.map((s) => `- ${s}`).join("\n") || "- none"}

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

    // Ensure we never return empty arrays to the UI
    if (
      (!parsed.growthChanges || parsed.growthChanges.length === 0) &&
      (!parsed.frictionPoints || parsed.frictionPoints.length === 0) &&
      (!parsed.calmNextSteps || parsed.calmNextSteps.length === 0)
    ) {
      parsed = {
        growthChanges: ["No clear growth signals were visible from the fetched pages."],
        frictionPoints: ["Signals were too thin to identify friction points."],
        calmNextSteps: ["Try scanning a deeper page (e.g., /about or /services) or check if the site blocks scraping."],
        rawSummary: parsed.rawSummary || "Content was too thin to summarize confidently.",
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
