import OpenAI from "openai";
import { getOpenAIClient } from "@/src/lib/openai/client";

export type AgentTool = OpenAI.Chat.Completions.ChatCompletionTool;

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

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  let finalContent = "";

  for (let i = 0; i < maxSteps; i++) {
    trace.steps += 1;
    const completion = await client.chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.35,
    });

    const choice = completion.choices[0];
    const message = choice?.message;
    if (message?.tool_calls?.length) {
      for (const call of message.tool_calls) {
        const name = call.function.name;
        let input: unknown = {};
        try {
          input = JSON.parse(call.function.arguments || "{}");
        } catch {
          input = call.function.arguments;
        }

        const output = await executeTool(name, input).catch(() => ({ error: "tool execution failed" }));

        if (name === "fetch_url" || name === "fetch_public_page") {
          const url = (input as { url?: string })?.url;
          if (url) trace.urls_fetched.push(url);
        }
        if (name === "web_search") {
          const query = (input as { query?: string })?.query;
          if (query) trace.searches_run.push(query);
        }

        trace.tools_called.push({
          name,
          input,
          output_summary: JSON.stringify(output).slice(0, 400),
        });

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(output),
        });
      }
      continue;
    }

    finalContent = message?.content || "";
    break;
  }

  trace.end = new Date().toISOString();

  return { content: finalContent, trace };
}
