import { z } from "zod";
import { tanjiaServerConfig } from "@/lib/tanjia-config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { featureFlags, normalizeWebsite } from "@/src/lib/env";
import { runAgent, type AgentTrace, type AgentTool } from "@/src/lib/agents/runtime";
import { toolDefinitions, toolFetchPublicPage, toolWebSearch } from "@/src/lib/agents/tools";
import { getOpenAIClient } from "@/src/lib/openai/client";

type RunParams = {
  leadId: string;
  ownerId: string;
  deep?: boolean;
};

type SourceCapture = {
  url: string;
  snippet: string;
  via: "fetch_public_page" | "web_search";
};

const OutputSchema = z.object({
  summary: z.string().min(1).max(800),
  talkingPoints: z.array(z.string().min(1).max(240)).min(2).max(5),
  questions: z.array(z.string().min(1).max(240)).min(2).max(4),
  drafts: z.object({
    comment: z.array(z.string().min(1).max(360)).min(2).max(3),
    dm: z.array(z.string().min(1).max(360)).min(2).max(3),
    email: z.array(z.string().min(1).max(360)).min(2).max(3),
  }),
});

const EMBED_MODEL = "text-embedding-3-small";

export async function runLeadIntelligence({ leadId, ownerId, deep = false }: RunParams) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI not configured.");

  const supabase = await createSupabaseServerClient();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("owner_id", ownerId)
    .single();

  if (leadError || !lead) throw new Error("Lead not found.");


  const website = normalizeWebsite(lead.website) || undefined;
  const suggestedSources = [website, website ? `${website}/about` : null, website ? `${website}/services` : null].filter(
    Boolean,
  ) as string[];

  const tools: AgentTool[] = [...toolDefinitions] as AgentTool[];

  const requestBudget = { escalationsUsed: 0, escalationsMax: 1 };

  async function runOnce() {
    const collected: SourceCapture[] = [];

    const systemPrompt = `
You help Tanjia prepare calm, permission-based outreach. Avoid hype, diagnosis, pushy language, or inside-knowledge claims. Do not mention AI or automation. Keep everything short (1-3 sentences each). When signals are thin, say so and keep options tentative.
Return JSON with shape: { summary, talkingPoints[], questions[], drafts: {comment[], dm[], email[]} }.
Each drafts array: 2-3 options; each option <=3 sentences.
`.trim();

    const userPrompt = `
Lead:
- Name: ${lead.name}
- Website: ${website || "n/a"}
- Location: ${lead.location || "n/a"}
- Notes: ${lead.notes || "n/a"}
- Suggested sources: ${suggestedSources.join(", ") || "none"}
- Searches to try: ${[lead.name, lead.location ? `${lead.name} ${lead.location}` : ""].filter(Boolean).join(", ")}

If signals are thin, be cautious and invite correction.
`.trim();

    const executor = async (name: string, input: unknown) => {
      const payload = input as { url?: string; query?: string };
      if (name === "fetch_public_page" && payload.url) {
        const res = await toolFetchPublicPage({ url: payload.url });
        if (res.output && "url" in res.output) {
          collected.push({ url: res.output.url, snippet: res.output.snippet, via: "fetch_public_page" });
        }
        return res.output ?? { url: payload.url, snippet: "" };
      }
      if (name === "web_search" && payload.query) {
        const res = await toolWebSearch({ query: payload.query });
        if (res.output && "results" in res.output && res.output.results?.length) {
          res.output.results.forEach((r) => {
            collected.push({ url: r.url, snippet: r.snippet, via: "web_search" });
          });
        }
        return res.output ?? { results: [] };
      }
      return { error: "unsupported tool" };
    };

    const { content, trace, parsed, _meta } = await runAgent({
      systemPrompt,
      userPrompt,
      tools,
      maxSteps: 6,
      executeTool: executor,
      context: {
        taskName: "orchestrator",
        hasTools: true,
        inputLength: userPrompt.length,
        schemaName: "lead_intel",
        userText: lead.notes || "",
        requestBudget,
        complexityHint: true,
      },
      validate: (raw) => {
        try {
          const json = JSON.parse(raw || "{}");
          const safe = OutputSchema.parse(json);
          return { ok: true, parsed: safe };
        } catch (err: any) {
          return { ok: false, reason: err?.message || "parse_failed" };
        }
      },
    });

    const outputs =
      (parsed as z.infer<typeof OutputSchema>) ||
      OutputSchema.parse({
        summary: (typeof content === "string" ? content : "").slice(0, 400) || "Brief update based on limited signals.",
        talkingPoints: ["Based on public info, here are a few neutral points.", "Happy to pause if this isn't helpful."],
        questions: [
          "Is it okay to learn more about what you're focusing on?",
          "Would you like to compare notes another time?",
        ],
        drafts: {
          comment: [
            "Thanks for sharing this. If it's useful, I can learn more about what you're building.",
            "Appreciate the update-okay if I follow along quietly?",
          ],
          dm: [
            "Saw your recent work. If you'd like a calm second look, I'm here. If not, no worries.",
            "Thanks for the context. Want me to review anything specific?",
          ],
          email: [
            "Thanks for the info. If a short review would help, I can send thoughts. If not, feel free to ignore.",
            "I can take a quiet look and send a few thoughts if you want. Otherwise, no action needed.",
          ],
        },
      });

    const totalSnippetChars = collected.reduce((acc, s) => acc + s.snippet.length, 0);
    const signalThin = collected.length < 2 || totalSnippetChars < 800;

    return { outputs, collected, trace, signalThin, _meta };
  }

  const runResult = await runOnce();
  const finalOutputs = runResult.outputs;
  const finalTrace = runResult.trace;
  const finalSources = runResult.collected;
  const signalThin = runResult.signalThin;

  if (!finalOutputs || !finalTrace) throw new Error("No outputs produced.");

  const { data: snapshot, error: snapshotError } = await supabase
    .from("lead_snapshots")
    .insert({
      lead_id: leadId,
      summary: finalOutputs.summary || finalOutputs.talkingPoints.join(" ").slice(0, 200) || "",
      extracted_json: {
        runType: deep ? "deep" : "standard",
        models_used: [runResult._meta?.model_used || "gpt-4o-mini"],
        tool_status: {
          mcpEnabled: featureFlags.mcpEnabled,
          resendEnabled: featureFlags.resendEnabled,
        },
        sources: finalSources.map((s) => ({ url: s.url, via: s.via, snippet: s.snippet })),
        outputs: finalOutputs,
        signalThin,
        agent_trace: { ...finalTrace, _meta: runResult._meta },
      },
      source_urls: finalSources.map((s) => s.url),
    })
    .select("id")
    .single();

  if (snapshotError || !snapshot) {
    throw new Error(snapshotError?.message || "Could not save snapshot.");
  }


  return {
    snapshotId: snapshot.id as string,
    outputs: finalOutputs,
  };
}
