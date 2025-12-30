import type OpenAI from "openai";
import { getOpenAIClient } from "@/src/lib/openai/client";

export type AgentTool = any;

export type AgentTrace = {
  model: string;
  steps: number;
  tools_called: { name: string; input: unknown; output_summary: string }[];
  urls_fetched: string[];
  searches_run: string[];
  start: string;
  end: string;
};

export type AgentRunResult = {
  content: string;
  trace: AgentTrace;
};

export type ToolExecutor = (name: string, input: unknown) => Promise<unknown>;

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
  model,
  systemPrompt,
  userPrompt,
  tools,
  maxSteps = 6,
  executeTool,
}: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  tools: AgentTool[];
  maxSteps?: number;
  executeTool: ToolExecutor;
}): Promise<AgentRunResult> {
  const client = getOpenAIClient();
  const trace: AgentTrace = {
    model,
    steps: 0,
    tools_called: [],
    urls_fetched: [],
    searches_run: [],
    start: new Date().toISOString(),
    end: "",
  };

  const executedCalls = new Set<string>();

  let response: any = await (client.responses.create as any)({
    model,
    input: [
      { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
      { role: "user", content: [{ type: "input_text", text: userPrompt }] },
    ],
    tools: tools as any,
    temperature: 0.35,
  });

  let finalContent = "";

  for (let i = 0; i < maxSteps; i++) {
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
      model,
      response_id: response.id,
      tool_outputs: toolOutputs,
      temperature: 0.35,
    });
  }

  if (!finalContent) {
    finalContent = extractText(response);
  }

  trace.end = new Date().toISOString();

  return { content: finalContent, trace };
}
