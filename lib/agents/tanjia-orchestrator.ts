import { z } from "zod";
import { tanjiaServerConfig } from "@/lib/tanjia-config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPineconeClient } from "@/lib/pinecone/client";
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

  const pinecone = createPineconeClient();

  const website = normalizeWebsite(lead.website) || undefined;
  const suggestedSources = [website, website ? `${website}/about` : null, website ? `${website}/services` : null].filter(
    Boolean,
  ) as string[];

  // clone to satisfy mutable array expectation of OpenAI client
  const tools: AgentTool[] = [...toolDefinitions] as AgentTool[];

  async function runOnce(model: string) {
    const collected: SourceCapture[] = [];
    const executionTrace: AgentTrace[] = [];

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

    const { content, trace } = await runAgent({
      model,
      systemPrompt,
      userPrompt,
      tools,
      maxSteps: 6,
      executeTool: executor,
    });

    executionTrace.push(trace);

    let parsedJson: unknown = null;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      parsedJson = null;
    }
    const parsed = OutputSchema.safeParse(parsedJson);
    const outputs = parsed.success
      ? parsed.data
      : OutputSchema.parse({
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

    return { outputs, collected, trace, signalThin };
  }

  const modelsUsed: string[] = [];
  let finalOutputs: z.infer<typeof OutputSchema> | null = null;
  let finalTrace: AgentTrace | null = null;
  let finalSources: SourceCapture[] = [];
  let signalThin = false;

  // small run
  const smallRun = await runOnce(tanjiaServerConfig.agentModelSmall);
  modelsUsed.push(tanjiaServerConfig.agentModelSmall);
  finalOutputs = smallRun.outputs;
  finalTrace = smallRun.trace;
  finalSources = smallRun.collected;
  signalThin = smallRun.signalThin;

  // escalate to MED if thin and med configured
  if (signalThin && tanjiaServerConfig.agentModelMed) {
    const medRun = await runOnce(tanjiaServerConfig.agentModelMed);
    modelsUsed.push(tanjiaServerConfig.agentModelMed);
    finalOutputs = medRun.outputs;
    finalTrace = medRun.trace;
    finalSources = medRun.collected;
    signalThin = medRun.signalThin;
  }

  // deep -> LARGE
  if (deep) {
    const largeRun = await runOnce(tanjiaServerConfig.agentModelLarge);
    modelsUsed.push(tanjiaServerConfig.agentModelLarge);
    finalOutputs = largeRun.outputs;
    finalTrace = largeRun.trace;
    finalSources = largeRun.collected;
    signalThin = largeRun.signalThin;
  }

  if (!finalOutputs || !finalTrace) throw new Error("No outputs produced.");

  const { data: snapshot, error: snapshotError } = await supabase
    .from("lead_snapshots")
    .insert({
      lead_id: leadId,
      summary: finalOutputs.summary || finalOutputs.talkingPoints.join(" ").slice(0, 200) || "",
      extracted_json: {
        runType: deep ? "deep" : "standard",
        models_used: modelsUsed,
        tool_status: {
          mcpEnabled: featureFlags.mcpEnabled,
          pineconeEnabled: featureFlags.pineconeEnabled,
          resendEnabled: featureFlags.resendEnabled,
        },
        sources: finalSources.map((s) => ({ url: s.url, via: s.via, snippet: s.snippet })),
        outputs: finalOutputs,
        signalThin,
        agent_trace: finalTrace,
      },
      source_urls: finalSources.map((s) => s.url),
    })
    .select("id")
    .single();

  if (snapshotError || !snapshot) {
    throw new Error(snapshotError?.message || "Could not save snapshot.");
  }

  if (pinecone && featureFlags.pineconeEnabled && tanjiaServerConfig.pineconeIndexName) {
    const openai = getOpenAIClient();
    const embedText = [
      lead.name,
      finalOutputs.summary,
      finalOutputs.talkingPoints.join(" "),
      finalOutputs.questions.join(" "),
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 1800);

    try {
      const embed = await openai.embeddings.create({
        model: EMBED_MODEL,
        input: embedText,
      });
      const vector = embed.data[0]?.embedding;
      if (vector) {
        const index = pinecone.Index(tanjiaServerConfig.pineconeIndexName);
        const namespace = index.namespace(ownerId);
        await namespace.upsert([
          {
            id: snapshot.id,
            values: vector,
            metadata: {
              leadId,
              snapshotId: snapshot.id,
              ownerId,
              summary: finalOutputs.summary.slice(0, 200),
            },
          },
        ]);
      }
    } catch (err) {
      console.warn("[tanjia] pinecone upsert failed", err);
    }
  }

  return {
    snapshotId: snapshot.id as string,
    outputs: finalOutputs,
  };
}
