import { z } from "zod";
import { getOpenAIClient } from "@/src/lib/openai/client";
import { tanjiaServerConfig } from "@/lib/tanjia-config";

type RepairParams<T> = {
  raw: string;
  schema: z.ZodSchema<T>;
  model?: string;
  systemPrompt?: string;
  repairPrompt?: string;
};

export async function tryParseWithRepair<T>({
  raw,
  schema,
  model = tanjiaServerConfig.agentModelSmall,
  systemPrompt = "You fix JSON to match the schema. Return only JSON.",
  repairPrompt = "Fix the JSON to match the schema.",
}: RepairParams<T>): Promise<{ success: boolean; data?: T; error?: unknown }> {
  const first = schema.safeParse(safeJson(raw));
  if (first.success) return { success: true, data: first.data };

  try {
    const client = getOpenAIClient();
    const repaired = await client.responses.create({
      model,
      input: [
        { role: "system", content: [{ type: "input_text", text: systemPrompt }] } as any,
        {
          role: "user",
          content: [{ type: "input_text", text: `${repairPrompt}\nSCHEMA:${schema.toString()}\nRAW:${raw.slice(0, 8000)}` }],
        } as any,
      ],
      temperature: 0,
    } as any);
    const text = extractText(repaired);
    const parsed = schema.safeParse(safeJson(text));
    if (parsed.success) return { success: true, data: parsed.data };
    return { success: false, error: parsed.error };
  } catch (error) {
    return { success: false, error };
  }
}

function safeJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractText(response: any) {
  if (!response?.output) return "";
  for (const part of response.output as any[]) {
    if (part.type === "output_text" && typeof part.text === "string") return part.text;
  }
  return "";
}
