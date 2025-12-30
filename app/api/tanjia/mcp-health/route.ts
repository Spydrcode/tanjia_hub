import { NextResponse } from "next/server";
import { featureFlags, serverEnv } from "@/src/lib/env";
import { toolFetchPublicPage, toolWebSearch } from "@/src/lib/agents/tools";

const TEST_URL = "https://example.com";
const TEST_QUERY = "2ndmynd";

export async function GET() {
  const mcpEnabled = featureFlags.mcpEnabled && Boolean(serverEnv.MCP_SERVER_URL);
  const configured = Boolean(serverEnv.MCP_SERVER_URL);

  let fetchOk = false;
  let fetchLatency: number | undefined;
  let searchOk = false;
  let searchLatency: number | undefined;

  if (configured) {
    const startFetch = Date.now();
    const fetchResult = await toolFetchPublicPage({ url: TEST_URL });
    fetchOk = Boolean(fetchResult.output);
    fetchLatency = fetchOk ? Date.now() - startFetch : undefined;

    const startSearch = Date.now();
    const searchResult = await toolWebSearch({ query: TEST_QUERY });
    searchOk = Boolean(searchResult.output?.results?.length);
    searchLatency = searchOk ? Date.now() - startSearch : undefined;
  }

  return NextResponse.json({
    mcpEnabled,
    configured,
    tools: ["fetch_public_page", "web_search"],
    checks: {
      fetchPublicPageOk: fetchOk,
      webSearchOk: searchOk,
    },
    latencyMs: {
      fetch: fetchLatency,
      webSearch: searchLatency,
    },
  });
}
