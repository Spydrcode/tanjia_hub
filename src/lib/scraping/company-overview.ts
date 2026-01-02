import { analysisV1Schema, type AnalysisV1, type FrictionZone, type MissingSignal, type EvidenceItem } from "@/src/lib/agents/analysis-v1";
import { formatCalmCopy } from "@/src/lib/copy/rules";
import { ensureHttpsUrl } from "@/src/lib/env";
import { runAgent } from "@/src/lib/agents/runtime";
import { toolFetchPublicPage, toolWebSearch } from "@/src/lib/agents/tools";

type CollectResult = {
  normalizedUrl: string;
  combinedContent: string;
  sources: string[];
  missingSignals: MissingSignal[];
  evidence: EvidenceItem[];
};

const frictionKeys: FrictionZone["key"][] = ["clarity", "time", "follow_up", "systems", "decision_fatigue"];

const defaultRationales: Record<FrictionZone["key"], string> = {
  clarity: "Public messaging suggests they are refining positioning.",
  time: "Owner-led signs imply limited bandwidth.",
  follow_up: "No clear follow-up flows on public pages.",
  systems: "Few visible systems; likely manual ops.",
  decision_fatigue: "Broad offerings imply decision load.",
};

function defaultFrictionZones(confidence: AnalysisV1["snapshot"]["confidence"]): FrictionZone[] {
  return frictionKeys.map((key) => ({
    key,
    score: 45,
    confidence,
    rationale: defaultRationales[key],
  }));
}

function defaultNextActions(): AnalysisV1["nextActions"] {
  return [
    {
      category: "listen",
      title: "Ask how new work arrives",
      why: "Clarifies whether growth is referral-heavy or outbound.",
      questionToAsk: "When someone reaches out, what usually triggers it?",
      confidence: "low",
    },
    {
      category: "clarify",
      title: "Confirm owner workload",
      why: "Owner-led signals often mean context switching.",
      questionToAsk: "What work is hardest to hand off right now?",
      confidence: "low",
    },
    {
      category: "map",
      title: "Trace their follow-up rhythm",
      why: "Reveals where leads cool off.",
      questionToAsk: "How do you keep in touch after a first conversation?",
      confidence: "low",
    },
  ];
}

function addMissingSignal(list: MissingSignal[], item: MissingSignal) {
  if (!list.find((m) => m.key === item.key)) {
    list.push(item);
  }
}

export async function collectCompanyContent(url: string, deepScan = false): Promise<CollectResult> {
  const normalizedUrl = ensureHttpsUrl(url);
  const base = new URL(normalizedUrl);
  const sources: string[] = [];
  const snippets: string[] = [];
  const evidence: EvidenceItem[] = [];
  const missingSignals: MissingSignal[] = [];

  async function fetchSnippet(targetUrl: string) {
    const res = await toolFetchPublicPage({ url: targetUrl });
    if (res.output?.snippet) {
      const snippet = res.output.snippet;
      snippets.push(`# Source: ${res.output.url}\n${snippet}`);
      sources.push(res.output.url);
      evidence.push({
        type: "text",
        url: res.output.url,
        snippet: snippet.slice(0, 300),
      });
      return true;
    }
    return false;
  }

  const primaryPaths = [
    "",
    "/about",
    "/services",
    "/contact",
    "/team",
    "/pricing",
    ...(deepScan ? ["/blog", "/company", "/work", "/clients"] : []),
  ];

  for (const path of primaryPaths) {
    const target = path ? `${base.origin}${path}` : normalizedUrl;
    const ok = await fetchSnippet(target);
    if (!ok) {
      const key = path.replace(/^\//, "") || "home";
      addMissingSignal(missingSignals, {
        key: `${key}_page`,
        label: `No clear ${key === "home" ? "home" : key} page content found`,
        suggestion: `Try scanning ${target}`,
      });
    }
  }

  // Web search to pick up additional public pages
  try {
    const domain = base.hostname.replace(/^www\./, "");
    const search = await toolWebSearch({ query: `${domain} site:${domain}` });
    const searchResults = search.output?.results?.slice(0, 3) || [];
    for (const result of searchResults) {
      if (result?.snippet) {
        snippets.push(`# Search result: ${result.url}\n${result.snippet}`);
        evidence.push({
          type: "link",
          url: result.url,
          snippet: result.snippet.slice(0, 300),
        });
      }
      if (result?.url) {
        await fetchSnippet(result.url);
      }
    }
  } catch (err) {
    console.warn("[company_overview] search fetch failed", err);
  }

  return {
    normalizedUrl,
    combinedContent: snippets.join("\n\n---\n\n").slice(0, 12000),
    sources,
    missingSignals,
    evidence,
  };
}

function sanitizeAnalysis(analysis: AnalysisV1): AnalysisV1 {
  // apply copy rules across key narrative fields
  analysis.snapshot.whatTheyDo = formatCalmCopy(analysis.snapshot.whatTheyDo) as string;
  analysis.snapshot.rationale = formatCalmCopy(analysis.snapshot.rationale) as string[];
  analysis.inference.narrative.calmOverview = formatCalmCopy(analysis.inference.narrative.calmOverview) as string;
  analysis.inference.narrative.whatWeKnow = formatCalmCopy(analysis.inference.narrative.whatWeKnow) as string[];
  analysis.inference.narrative.whatWeDontKnow = formatCalmCopy(analysis.inference.narrative.whatWeDontKnow) as string[];
  analysis.inference.growthShape.summary = formatCalmCopy(analysis.inference.growthShape.summary) as string;
  analysis.inference.growthShape.signals = analysis.inference.growthShape.signals.map((s) => ({
    ...s,
    label: formatCalmCopy(s.label) as string,
    detail: s.detail ? (formatCalmCopy(s.detail) as string) : s.detail,
  }));
  analysis.nextActions = analysis.nextActions.map((a) => ({
    ...a,
    title: formatCalmCopy(a.title) as string,
    why: formatCalmCopy(a.why) as string,
    questionToAsk: formatCalmCopy(a.questionToAsk) as string,
  }));
  return analysis;
}

function fillDefaults(
  parsed: Partial<AnalysisV1>,
  collected: CollectResult,
  leadId?: string,
  deepScan?: boolean,
): AnalysisV1 {
  const base: AnalysisV1 = analysisV1Schema.parse({
    version: "analysis_v1",
    input: {
      url: collected.normalizedUrl,
      leadId,
      deepScan: Boolean(deepScan),
      fetchedAt: new Date().toISOString(),
    },
    snapshot: {
      whatTheyDo: parsed.snapshot?.whatTheyDo || "No explicit description found yet.",
      whoTheyServe: parsed.snapshot?.whoTheyServe?.length ? parsed.snapshot.whoTheyServe : [],
      serviceModel: parsed.snapshot?.serviceModel || "unknown",
      companyStage: parsed.snapshot?.companyStage || "unknown",
      ownerLedLikelihood: parsed.snapshot?.ownerLedLikelihood || "unknown",
      revenueModel: parsed.snapshot?.revenueModel || "unknown",
      confidence: parsed.snapshot?.confidence || "low",
      rationale: parsed.snapshot?.rationale?.length ? parsed.snapshot.rationale : ["Signals are light; using cautious inference."],
    },
    inference: {
      growthShape: parsed.inference?.growthShape || {
        summary: "No explicit growth markers found on public pages.",
        signals: [],
        confidence: "low",
      },
      frictionZones: parsed.inference?.frictionZones?.length
        ? parsed.inference.frictionZones
        : defaultFrictionZones(parsed.snapshot?.confidence || "low"),
      systems: parsed.inference?.systems || { detected: [], inferred: [] },
      narrative: parsed.inference?.narrative || {
        calmOverview: "Here is what we can responsibly infer so far.",
        whatWeKnow: [],
        whatWeDontKnow: [],
      },
    },
    nextActions: parsed.nextActions?.length ? parsed.nextActions : defaultNextActions(),
    evidence: parsed.evidence?.length ? parsed.evidence : collected.evidence,
    missingSignals:
      parsed.missingSignals?.length || collected.missingSignals.length
        ? [...(parsed.missingSignals || []), ...collected.missingSignals]
        : [
            { key: "about_page", label: "No about page found", suggestion: "Scan /about for founder voice." },
            { key: "services_page", label: "No services detail found", suggestion: "Scan /services for offers." },
          ],
  });

  const ensuredFriction = frictionKeys.map((key) => base.inference.frictionZones.find((f) => f.key === key) || {
    key,
    score: 45,
    confidence: base.snapshot.confidence,
    rationale: defaultRationales[key],
  });

  return sanitizeAnalysis({
    ...base,
    inference: {
      ...base.inference,
      frictionZones: ensuredFriction,
    },
  });
}

export async function runCompanyAnalysis(params: {
  url: string;
  leadId?: string;
  deepScan?: boolean;
}): Promise<{ analysis: AnalysisV1; raw: string }> {
  const { url, leadId, deepScan } = params;
  const collected = await collectCompanyContent(url, Boolean(deepScan));

  if (!collected.combinedContent) {
    const fallback = fillDefaults({}, collected, leadId, deepScan);
    return { analysis: fallback, raw: JSON.stringify(fallback) };
  }

  const systemPrompt = `
You build calm company overviews for an owner-operator. Speak plainly, avoid jargon, and hedge when signals are light.
Always respond with valid JSON following the analysis_v1 schema.
- Use short sentences.
- Provide 2–4 rationale bullets for snapshot.
- Populate growth signals, friction zones, and next actions even when signals are light (mark confidence low).
- Include missingSignals when public pages lack common sections.
- Never say "too thin" or "insufficient data"; say what you can responsibly infer and what to check next.
`.trim();

  const userPrompt = `
Website URL: ${collected.normalizedUrl}
Deep scan: ${Boolean(deepScan)}
Lead linked: ${leadId || "none"}
Sources seen:
${collected.sources.map((s) => `- ${s}`).join("\n") || "- none"}

Combined content:
${collected.combinedContent}

Respond with a JSON object shaped exactly like analysis_v1. Include:
- version
- input { url, leadId?, deepScan?, fetchedAt }
- snapshot
- inference
- nextActions
- evidence (keep small)
- missingSignals
`.trim();

  try {
    const { content } = await runAgent({
      systemPrompt,
      userPrompt,
      tools: [],
      maxSteps: 1,
      executeTool: async () => ({}),
      context: {
        taskName: "company_overview",
        hasTools: false,
        inputLength: collected.combinedContent.length,
        userText: collected.normalizedUrl,
      },
    });

    let parsed: Partial<AnalysisV1> = {};
    try {
      parsed = JSON.parse(content || "{}");
    } catch {
      parsed = {};
    }

    const analysis = fillDefaults(parsed as Partial<AnalysisV1>, collected, leadId, deepScan);
    return { analysis, raw: content || "" };
  } catch (error) {
    console.error("[company_overview] agent error", error);
    const fallback = fillDefaults({}, collected, leadId, deepScan);
    return { analysis: fallback, raw: JSON.stringify(fallback) };
  }
}
