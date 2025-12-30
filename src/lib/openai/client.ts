import OpenAI from "openai";
import { serverEnv } from "@/src/lib/env";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (cachedClient) return cachedClient;
  cachedClient = new OpenAI({
    apiKey: serverEnv.OPENAI_API_KEY || "",
  });
  return cachedClient;
}

