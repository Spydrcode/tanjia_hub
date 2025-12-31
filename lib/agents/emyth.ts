import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runAgent, type AgentTool } from "@/src/lib/agents/runtime";
import { toolDefinitions, toolFetchPublicPage, toolWebSearch } from "@/src/lib/agents/tools";
import { tanjiaServerConfig } from "@/lib/tanjia-config";

export const PrimaryAimSchema = z.object({
  statement: z.string().min(1).max(800),
  non_negotiables: z.array(z.string().min(1).max(200)).length(3),
  avoidances: z.array(z.string().min(1).max(200)).length(3),
});

const RoleMapSchema = z.object({
  roles: z.array(z.string().min(1).max(200)).min(5).max(7),
  overload_hotspots: z.array(z.string().min(1).max(200)).min(2).max(4),
  next_role_to_define: z.string().min(1).max(200),
  proof_points: z.array(z.string().min(1).max(200)).min(2).max(4),
});

const OnVsInSchema = z.object({
  trapped_in_execution: z.array(z.string().min(1).max(200)).min(2).max(4),
  only_owner_decisions: z.array(z.string().min(1).max(200)).min(2).max(4),
  smallest_next_step: z.string().min(1).max(200),
});

const FollowThroughSchema = z.object({
  next_action: z.enum(["comment", "dm", "save", "wait"]),
  log_note: z.string().min(1).max(400),
  followups: z
    .array(
      z.object({
        when: z.string().min(1).max(20),
        text: z.string().min(1).max(300),
      }),
    )
    .min(2)
    .max(2),
  stall_risk: z.string().min(1).max(200),
});

type Mode = "prospecting" | "meeting" | "client" | "onsite";
type Task = "role_map" | "on_vs_in" | "follow_through";

function modeTools(mode: Mode, allowDeep: boolean) {
  if (mode === "prospecting") return [...toolDefinitions] as unknown as AgentTool[];
  if (mode === "onsite" && allowDeep) return [...toolDefinitions] as unknown as AgentTool[];
  return [] as AgentTool[];
}

async function executeTool(name: string, input: unknown) {
  if (name === "fetch_public_page") return (await toolFetchPublicPage(input)).output ?? { url: (input as any)?.url, snippet: "" };
  if (name === "web_search") return (await toolWebSearch(input)).output ?? { results: [] };
  return {};
}

export async function getPrimaryAim(supabase: SupabaseClient, ownerId: string) {
  const { data } = await supabase.from("owner_profile").select("primary_aim").eq("owner_id", ownerId).single();
  return data?.primary_aim || null;
}

export async function savePrimaryAim(supabase: SupabaseClient, ownerId: string, aim: z.infer<typeof PrimaryAimSchema>) {
  await supabase.from("owner_profile").upsert({ owner_id: ownerId, primary_aim: aim });
}

type RunInput = {
  task: Task;
  leadId?: string | null;
  pastedText?: string | null;
  notes?: string | null;
  mode: Mode;
  deep?: boolean | null;
  ownerId: string;
};

export async function runEmythTask(supabase: SupabaseClient, input: RunInput) {
  const leadId = input.leadId || null;

  let leadContext = "";
  let latestSnapshot: any = null;
  if (leadId) {
    const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).eq("owner_id", input.ownerId).single();
    if (lead) {
      leadContext = [lead.name, lead.website, lead.location, lead.notes].filter(Boolean).join("\n");
    }
    const { data: snap } = await supabase
      .from("lead_snapshots")
      .select("extracted_json")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    latestSnapshot = snap?.extracted_json;
  }

  const primaryAim = await getPrimaryAim(supabase, input.ownerId);

  const systemBase = `
You are producing E-Myth aligned outputs in a quiet founder tone.
Never mention software or AI. Avoid speculation; if signals are thin, say "based on limited info" but keep concise.
Primary Aim: ${primaryAim ? JSON.stringify(primaryAim) : "Not set; stay neutral."}
Lead context: ${leadContext || "None"}
Latest snapshot: ${latestSnapshot ? JSON.stringify(latestSnapshot).slice(0, 800) : "None"}
Pasted text: ${input.pastedText || "None"}
Notes: ${input.notes || "None"}
`.trim();

  let schema: typeof RoleMapSchema | typeof OnVsInSchema | typeof FollowThroughSchema;
  let userInstruction = "";

  if (input.task === "role_map") {
    schema = RoleMapSchema;
    userInstruction = `
Return role_map JSON with keys: roles (5-7), overload_hotspots (2-4), next_role_to_define, proof_points (from provided text only).
`.trim();
  } else if (input.task === "on_vs_in") {
    schema = OnVsInSchema;
    userInstruction = `
Return on_vs_in JSON with keys: trapped_in_execution (2-4), only_owner_decisions (2-4), smallest_next_step.
`.trim();
  } else {
    schema = FollowThroughSchema;
    userInstruction = `
Return follow_through JSON: next_action ("comment"|"dm"|"save"|"wait"), log_note, followups [{when:"3d",text}, {when:"7d",text}], stall_risk.
`.trim();
  }

  const tools = modeTools(input.mode, Boolean(input.deep));
  const start = Date.now();
  const { content, trace, parsed, _meta } = await runAgent({
    systemPrompt: systemBase,
    userPrompt: userInstruction,
    tools,
    maxSteps: tools.length ? 4 : 1,
    executeTool,
    context: {
      taskName: input.task === "role_map" ? "emyth_role_map" : input.task === "on_vs_in" ? "emyth_on_vs_in" : "emyth_follow_through",
      hasTools: Boolean(tools.length),
      inputLength: userInstruction.length + systemBase.length,
      schemaName: input.task,
      userText: input.pastedText || input.notes || "",
    },
    validate: (raw) => {
      try {
        const json = JSON.parse(raw || "{}");
        const safe = (schema as any).parse(json);
        return { ok: true, parsed: safe };
      } catch (err: any) {
        return { ok: false, reason: err?.message || "parse_failed" };
      }
    },
  });
  const durationMs = Date.now() - start;

  const fallbackResult =
    input.task === "role_map"
      ? {
          roles: ["Based on limited info", "Operations", "Sales touchpoints", "Accountability check", "Client follow-up"],
          overload_hotspots: ["Owner doing sales and delivery", "No dedicated follow-up role"],
          next_role_to_define: "Create a follow-through role",
          proof_points: ["Signals are thin", "Derived from provided text"],
        }
      : input.task === "on_vs_in"
        ? {
            trapped_in_execution: ["Handles execution daily", "Context switching often"],
            only_owner_decisions: ["Prioritize which relationships to deepen", "Define what to pause"],
            smallest_next_step: "Block 30 minutes to decide what to stop doing.",
          }
        : {
            next_action: "save",
            log_note: "Based on limited info; holding until more context.",
            followups: [
              { when: "3d", text: "Check for a signal to follow-up calmly." },
              { when: "7d", text: "Close loop and offer to pause." },
            ],
            stall_risk: "Low context; risk of stalling due to silence.",
          };

  const result = parsed || fallbackResult;

  const traceId = trace?.start || `${Date.now()}`;
  const toolsUsed = (trace?.tools_called || []).map((t) => t.name);

  if (leadId) {
    await supabase
      .from("lead_snapshots")
      .insert({
        lead_id: leadId,
        summary: `E-Myth ${input.task}`,
        extracted_json: {
          ...(latestSnapshot || {}),
          emyth: {
            ...(latestSnapshot?.emyth || {}),
            [input.task]: {
              ...result,
              model_used: _meta.model_used,
              tool_usage_summary: toolsUsed,
              created_at: new Date().toISOString(),
              attempt_count: _meta.attempt_count,
              escalation_reason: _meta.escalation_reason,
            },
          },
          agent_trace: trace ? { ...trace, _meta } : trace,
        },
        source_urls: [],
      })
      .select("id")
      .single();
  }

  return { result, traceId, toolsUsed, durationMs };
}
