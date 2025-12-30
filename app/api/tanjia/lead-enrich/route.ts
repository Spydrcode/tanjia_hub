import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tanjiaServerConfig } from "@/lib/tanjia-config";
import { toolFetchPublicPage, toolWebSearch } from "@/src/lib/agents/tools";
import { runAgent } from "@/src/lib/agents/runtime";
import { ensureHttpsUrl } from "@/src/lib/env";

const MAX_SNIPPETS = 3;

type EnrichInput = { website?: string; name?: string; location?: string; notes?: string };

type EnrichResponse = {
  signals: {
    website: string;
    title?: string;
    services?: string[];
    locations?: string[];
    contact?: { email?: string; phone?: string };
    socials?: { platform: string; url: string }[];
    credibility?: string[];
    snippetSources?: { url: string; via: string }[];
  };
  overview: {
    bio: string;
    likelyNeeds: string[];
    suggestedNextStep: string;
  };
};

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

function buildPrompt(data: EnrichInput, snippets: string[]) {
  const lines = [
    `Name: ${data.name || ""}`,
    `Location: ${data.location || ""}`,
    `Website: ${data.website || ""}`,
    data.notes ? `Notes: ${data.notes}` : null,
  ].filter(Boolean);

  const context = snippets.length
    ? `Observed snippets (keep it brief):\n- ${snippets.slice(0, MAX_SNIPPETS).join("\n- ")}`
    : "Very limited public info. Offer cautious takeaways.";

  const systemPrompt = `You are a calm operator supporting a director of networking. Tone: Quiet Founder, permission-based, no hype, no clarity jargon.
Return ONLY valid JSON matching this schema:
{
  "signals": {
    "website": string,
    "title"?: string,
    "services"?: string[],
    "locations"?: string[],
    "contact"?: { "email"?: string, "phone"?: string },
    "socials"?: { "platform": string, "url": string }[],
    "credibility"?: string[],
    "snippetSources"?: { "url": string, "via": string }[]
  },
  "overview": {
    "bio": string,
    "likelyNeeds": string[],
    "suggestedNextStep": string
  }
}
Rules: short sentences. If info is thin, say so. Never invent people or promises. Avoid sales language.`;

  const userPrompt = `${lines.join("\n")}\n${context}\nRespond with JSON only.`;

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
  const { systemPrompt, userPrompt } = buildPrompt({ ...body, website: normalizedWebsite }, snippets);

  const agentResult = await runAgent({
    model: tanjiaServerConfig.agentModelSmall,
    systemPrompt,
    userPrompt,
    tools: [],
    executeTool: async () => null,
  });

  const parsed = safeParse(agentResult.content || "");

  const signals = {
    website: normalizedWebsite || body.website || "",
    title: parsed?.signals?.title,
    services: parsed?.signals?.services || [],
    locations: parsed?.signals?.locations || [],
    contact: parsed?.signals?.contact || {},
    socials: parsed?.signals?.socials || [],
    credibility: parsed?.signals?.credibility || [],
    snippetSources,
  } satisfies EnrichResponse["signals"];

  const overview = {
    bio: parsed?.overview?.bio || "Limited public info; keep outreach light.",
    likelyNeeds: parsed?.overview?.likelyNeeds?.length ? parsed.overview.likelyNeeds : ["Too little info to be confident."],
    suggestedNextStep: parsed?.overview?.suggestedNextStep || "Offer a short alignment to learn more before suggesting anything.",
  } satisfies EnrichResponse["overview"];

  return NextResponse.json({ signals, overview } satisfies EnrichResponse);
}
