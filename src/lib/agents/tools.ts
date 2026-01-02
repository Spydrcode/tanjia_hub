import { z } from "zod";
import { ensureHttpsUrl, featureFlags, serverEnv } from "@/src/lib/env";
import { scrapeWebpage, createSnippet } from "@/src/lib/scraping/scraper";

const MAX_SNIPPET = 2500;
const TIMEOUT_MS = 10000;
const ALLOWED_PROTOCOL = /^https:\/\//i;

type FetchOutput = { url: string; snippet: string };
type SearchOutput = { results: { title?: string; url: string; snippet: string }[] };

export type ToolResult =
  | { name: "fetch_public_page"; output: FetchOutput | null }
  | { name: "web_search"; output: SearchOutput | null };

const fetchSchema = z.object({ url: z.string().min(1) });
const searchSchema = z.object({ query: z.string().min(2).max(200) });

export const toolDefinitions = [
  {
    type: "function" as const,
    function: {
      name: "fetch_public_page",
      description: "Fetch a public web page and return a short snippet of text content.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", format: "uri" },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "web_search",
      description: "Search the web for a short list of relevant links and snippets.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", minLength: 2, maxLength: 200 },
        },
        required: ["query"],
      },
    },
  },
] as const;

function withTimeout<T>(promise: Promise<T>): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
  ]);
}

async function fetchViaMcp(path: string, body: unknown): Promise<any | null> {
  if (!featureFlags.mcpEnabled || !serverEnv.MCP_SERVER_URL) return null;
  try {
    const res = await withTimeout(
      fetch(`${serverEnv.MCP_SERVER_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
    if (!res || !(res as Response).ok) return null;
    return await (res as Response).json();
  } catch {
    return null;
  }
}

async function basicFetch(url: string): Promise<FetchOutput | null> {
  const safeUrl = ensureHttpsUrl(url);
  if (!ALLOWED_PROTOCOL.test(safeUrl)) return null;
  
  try {
    // Use the scraper for better content extraction
    const scraped = await scrapeWebpage(safeUrl);
    if (!scraped) return null;
    
    // Create a rich snippet with structured content
    const snippet = createSnippet(scraped, MAX_SNIPPET);
    
    return {
      url: safeUrl,
      snippet,
    };
  } catch (error) {
    console.error("[tools] basicFetch error:", error);
    return null;
  }
}

export async function toolFetchPublicPage(input: unknown): Promise<{ name: "fetch_public_page"; output: FetchOutput | null }> {
  const parsed = fetchSchema.safeParse(input);
  if (!parsed.success) return { name: "fetch_public_page", output: null };

  const targetUrl = ensureHttpsUrl(parsed.data.url);
  if (!ALLOWED_PROTOCOL.test(targetUrl)) return { name: "fetch_public_page", output: null };

  const mcp = await fetchViaMcp("fetch_public_page", { url: targetUrl });
  if (mcp?.url && mcp?.snippet) {
    return {
      name: "fetch_public_page",
      output: { url: ensureHttpsUrl(mcp.url), snippet: String(mcp.snippet).slice(0, MAX_SNIPPET) },
    };
  }
  return { name: "fetch_public_page", output: await basicFetch(targetUrl) };
}

export async function toolWebSearch(input: unknown): Promise<{ name: "web_search"; output: SearchOutput | null }> {
  const parsed = searchSchema.safeParse(input);
  if (!parsed.success) return { name: "web_search", output: { results: [] } };
  const mcp = await fetchViaMcp("web_search", parsed.data);
  if (mcp?.results) {
    const results =
      (mcp.results as any[]).slice(0, 3).flatMap((item) => {
        if (!item?.url) return [];
        return [
          {
            title: item.title,
            url: ensureHttpsUrl(String(item.url)),
            snippet: String(item.snippet || item.title || "").slice(0, MAX_SNIPPET),
          },
        ];
      }) ?? [];
    return { name: "web_search", output: { results } };
  }
  return { name: "web_search", output: { results: [] } };
}
