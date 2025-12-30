import { Pinecone } from "@pinecone-database/pinecone";
import { serverEnv, featureFlags } from "@/src/lib/env";

export function createPineconeClient() {
  if (!featureFlags.pineconeEnabled) return null;
  try {
    return new Pinecone({
      apiKey: serverEnv.PINECONE_API_KEY || "",
    });
  } catch {
    return null;
  }
}
