import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tanjiaServerConfig } from "@/lib/tanjia-config";
import { toolFetchPublicPage, toolWebSearch } from "@/src/lib/agents/tools";
import { runAgent } from "@/src/lib/agents/runtime";
import { ensureHttpsUrl } from "@/src/lib/env";
import { quietFounderRules, jsonOnlyRule } from "@/src/lib/agents/prompt-kits";
import { LeadEnrichResponseSchema } from "@/src/lib/agents/schemas";
import { tryParseWithRepair } from "@/src/lib/agents/repair";

const MAX_SNIPPETS = 3;

type EnrichInput = { website?: string; name?: string; location?: string; notes?: string };

async function gatherSignals({ website, name, location }: EnrichInput) {
  const snippetSources: { url: string; via: string }[] = [];
  const snippets: string[] = [];
  let normalizedWebsite = website ? ensureHttpsUrl(website.trim()) : undefined;

  const seenUrls = new Set<string>();

  async function fetchAndStore(url?: string, via?: string) {
    if (!url) return;
    const safeUrl = ensureHttpsUrl(url);
    if (seenUrls.has(safeUrl)) return;
    seenUrls.add(safeUrl);
    const { output } = await toolFetchPublicPage({ url: safeUrl });
    if (output?.snippet) {
      snippetSources.push({ url: output.url, via: via || "website" });
      snippets.push(`${via || "website"}: ${output.snippet}`);
      if (!normalizedWebsite) normalizedWebsite = output.url;
    }
  }

  await fetchAndStore(normalizedWebsite, "homepage");

  try {
    if (normalizedWebsite) {
      const origin = new URL(normalizedWebsite).origin;
      await Promise.all([
        fetchAndStore(`${origin}/about`, "about"),
        fetchAndStore(`${origin}/services`, "services"),
      ]);
    }
  } catch {
    // ignore
  }

  const queryBase = name ? `${name} ${location || ""}`.trim() : normalizedWebsite ? new URL(normalizedWebsite).hostname : "";
  const searchQuery = queryBase || "company overview";
  const searchResult = await toolWebSearch({ query: searchQuery });
  const searchSnippets = searchResult.output?.results?.slice(0, MAX_SNIPPETS) || [];
  for (const result of searchSnippets) {
    if (!result.url) continue;
    snippetSources.push({ url: result.url, via: "search" });
    if (result.snippet) snippets.push(`search: ${result.snippet}`);
  }

  return { normalizedWebsite, snippetSources, snippets };
}

function buildPrompt(data: EnrichInput, snippets: string[], sources: { url: string; via: string }[]) {
  const lines = [
    `Name: ${data.name || ""}`,
    `Location: ${data.location || ""}`,
    `Website: ${data.website || ""}`,
    data.notes ? `Notes: ${data.notes}` : null,
  ].filter(Boolean);

  const context = snippets.length
    ? `Observed snippets (keep it brief):\n- ${snippets.slice(0, MAX_SNIPPETS).join("\n- ")}`
    : "Very limited public info. Offer cautious takeaways.";
  const sourceList = sources.map((s) => `${s.via}: ${s.url}`).slice(0, 8).join("\n");

  const systemPrompt = `
${quietFounderRules}
${jsonOnlyRule}
- Evidence required: each likely need must include evidence and confidence (0-1).
- Avoid generic needs unless supported (e.g., "marketing" or "CRM" only if evidence).
- Add one "secondLookAngle" on how a quiet review could help, optional and permission-based.
  `.trim();

  const userPrompt = `
Lead enrichment. Keep it short and cautious.
${lines.join("\n")}
Sources:
${sourceList || "none"}
${context}

JSON shape is defined by the schema provided; do not add extra fields.
`.trim();

  return { systemPrompt, userPrompt };
}

function safeParse(content: string): EnrichResponse | null {
  try {
    return JSON.parse(content) as EnrichResponse;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as EnrichInput | null;
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { normalizedWebsite, snippetSources, snippets } = await gatherSignals(body);
  const { systemPrompt, userPrompt } = buildPrompt({ ...body, website: normalizedWebsite }, snippets, snippetSources);

  const agentResult = await runAgent({
    model: tanjiaServerConfig.agentModelSmall,
    systemPrompt,
    userPrompt,
    tools: [],
    executeTool: async () => null,
  });

  const parsed =
    (await tryParseWithRepair({
      raw: agentResult.content || "",
      schema: LeadEnrichResponseSchema,
      repairPrompt: "Repair to the lead enrichment schema.",
    })) || { success: false };

  const safeData =
    parsed.success && parsed.data
      ? parsed.data
      : LeadEnrichResponseSchema.parse({
          signals: {
            website: normalizedWebsite || body.website || "",
            snippetSources,
          },
          overview: {
            bio: "Limited public info; keep outreach light.",
            likelyNeeds: [],
            suggestedNextStep: "Offer a short alignment to learn more before suggesting anything.",
            secondLookAngle: "Offer a brief second look only if they want it.",
          },
        });

  return NextResponse.json(safeData);
}
