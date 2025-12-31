import { getOpenAIClient } from "@/src/lib/openai/client";
import {
  clampAttempts,
  escalatedModel,
  escalationBudgetLimit,
  escalationEnabled,
  pickInitialModel,
  shouldEscalate,
  type PolicyContext,
} from "@/src/lib/agents/model-policy";

export type AgentTool = any;

export type AgentTrace = {
  model: string;
  steps: number;
  tools_called: { name: string; input: unknown; output_summary: string }[];
  urls_fetched: string[];
  searches_run: string[];
  start: string;
  end: string;
  _meta?: AgentMeta;
};

export type AgentMeta = {
  model_used: string;
  attempt_count: number;
  escalation_reason?: string;
  durationMs: number;
  requestBudget?: { used: number; max: number };
};

export type AgentRunResult<TParsed = unknown> = {
  content: string;
  trace: AgentTrace;
  parsed?: TParsed;
  _meta: AgentMeta;
};

export type ToolExecutor = (name: string, input: unknown) => Promise<unknown>;

function normalizeTools(tools: AgentTool[]): any[] {
  return (tools || []).map((tool: any) => {
    if (tool && tool.function) {
      // Convert Chat Completions style to Responses API format
      return {
        type: tool.type || "function",
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      };
    }
    return tool;
  });
}

function extractToolCalls(response: any | null) {
  const calls: { id: string; name: string; arguments: unknown }[] = [];
  if (!response?.output) return calls;
  for (const part of response.output as any[]) {
    if (part.type === "tool_call" && part.tool_call) {
      const args = (() => {
        try {
          return JSON.parse(part.tool_call.arguments || "{}");
        } catch {
          return part.tool_call.arguments;
        }
      })();
      calls.push({ id: part.tool_call.id, name: part.tool_call.name, arguments: args });
    }
  }
  return calls;
}

function extractText(response: any | null) {
  if (!response?.output) return "";
  for (const part of response.output as any[]) {
    if (part.type === "output_text" && typeof part.text === "string") {
      return part.text;
    }
  }
  return "";
}

export async function runAgent({
  systemPrompt,
  userPrompt,
  tools,
  maxSteps = 6,
  executeTool,
  modelHint,
  context,
  validate,
}: {
  systemPrompt: string;
  userPrompt: string;
  tools: AgentTool[];
  maxSteps?: number;
  executeTool: ToolExecutor;
  modelHint?: "mini" | "standard";
  context?: PolicyContext;
  validate?: (content: string) => { ok: boolean; parsed?: unknown; reason?: string };
}): Promise<AgentRunResult> {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
    throw new Error("runAgent called without OPENAI_API_KEY. This is a configuration error.");
  }
  const client = getOpenAIClient();
  const normalizedTools = normalizeTools(tools);
  const attempts = clampAttempts(2);
  const ctx: PolicyContext = {
    ...context,
    hasTools: context?.hasTools ?? normalizedTools.length > 0,
    inputLength: context?.inputLength ?? userPrompt.length,
    userText: context?.userText ?? userPrompt,
  };
  const budgetMax = context?.requestBudget?.escalationsMax ?? escalationBudgetLimit();
  let budgetUsed = context?.requestBudget?.escalationsUsed ?? 0;
  const debugLog = (process.env.MODEL_POLICY_DEBUG ?? "").toLowerCase() === "true";

  const totalStart = Date.now();
  let finalContent = "";
  let finalTrace: AgentTrace | null = null;
  let parsed: unknown;
  let escalationReason: string | undefined;
  let modelUsed = "";
  let attemptCount = 0;

  const initialModel = modelHint === "standard" ? escalatedModel() : pickInitialModel(ctx);

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (!escalationEnabled() && attempt > 0) break;
    if (attempt > 0 && budgetMax > 0 && budgetUsed >= budgetMax) break;
    const chosenModel = attempt === 0 ? initialModel : escalatedModel();
    modelUsed = chosenModel;
    attemptCount = attempt + 1;

    const trace: AgentTrace = {
      model: chosenModel,
      steps: 0,
      tools_called: [],
      urls_fetched: [],
      searches_run: [],
      start: new Date().toISOString(),
      end: "",
    };

    const executedCalls = new Set<string>();

    let response: any = await (client.responses.create as any)({
      model: chosenModel,
      input: [
        { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
        { role: "user", content: [{ type: "input_text", text: userPrompt }] },
      ],
      tools: normalizedTools,
      temperature: 0.35,
    });

    for (let step = 0; step < maxSteps; step++) {
      trace.steps += 1;
      const calls = extractToolCalls(response);
      if (calls.length === 0) {
        finalContent = extractText(response);
        break;
      }

      const toolOutputs: { tool_call_id: string; output: string }[] = [];
      for (const call of calls) {
        if (executedCalls.has(call.id)) continue;
        executedCalls.add(call.id);
        const output = await executeTool(call.name, call.arguments).catch(() => ({ error: "tool execution failed" }));
        if (call.name === "fetch_public_page") {
          const url = (call.arguments as { url?: string })?.url;
          if (url) trace.urls_fetched.push(url);
        }
        if (call.name === "web_search") {
          const query = (call.arguments as { query?: string })?.query;
          if (query) trace.searches_run.push(query);
        }
        trace.tools_called.push({
          name: call.name,
          input: call.arguments,
          output_summary: JSON.stringify(output).slice(0, 400),
        });
        toolOutputs.push({ tool_call_id: call.id, output: JSON.stringify(output) });
      }

      if (!toolOutputs.length) {
        finalContent = extractText(response);
        break;
      }

      response = await (client.responses.create as any)({
        model: chosenModel,
        response_id: response.id,
        tool_outputs: toolOutputs,
        temperature: 0.35,
      });
    }

    if (!finalContent) {
      finalContent = extractText(response);
    }

    trace.end = new Date().toISOString();
    finalTrace = trace;

    const validationResult = validate ? validate(finalContent) : { ok: true };
    parsed = validationResult?.parsed;
    const escalateCheck = shouldEscalate(
      { ...ctx, priorAttempt: attempt },
      {
        validationOk: Boolean(validationResult?.ok),
        content: finalContent,
        errorMessage: validationResult?.reason,
        toolCalls: trace.tools_called.length,
      },
    );

    const allowEscalate =
      escalationEnabled() && attempt < attempts - 1 && (!budgetMax || budgetUsed < budgetMax) && escalateCheck.escalate;

    if (validationResult?.ok && !escalateCheck.escalate) {
      break;
    }

    if (!allowEscalate) {
      escalationReason = escalateCheck.reason || validationResult?.reason || "max_attempts";
      break;
    }

    budgetUsed += 1;
    escalationReason = escalateCheck.reason || validationResult?.reason || "escalated";
    finalContent = "";
  }

  const meta: AgentMeta = {
    model_used: modelUsed,
    attempt_count: attemptCount,
    escalation_reason: escalationReason,
    durationMs: Date.now() - totalStart,
    requestBudget: { used: budgetUsed, max: budgetMax || attempts - 1 },
  };

  if (context?.requestBudget) {
    context.requestBudget.escalationsUsed = budgetUsed;
    context.requestBudget.escalationsMax = budgetMax || attempts - 1;
  }

  if (debugLog) {
    console.log("[model-policy]", {
      task: ctx.taskName,
      model_used: meta.model_used,
      attempt_count: meta.attempt_count,
      escalation_reason: meta.escalation_reason,
      budget: meta.requestBudget,
    });
  }

  return {
    content: finalContent,
    trace: finalTrace || {
      model: modelUsed,
      steps: 0,
      tools_called: [],
      urls_fetched: [],
      searches_run: [],
      start: new Date().toISOString(),
      end: new Date().toISOString(),
    },
    parsed,
    _meta: meta,
  };
}
