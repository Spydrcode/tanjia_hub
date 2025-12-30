import { ensureHttpsUrl, featureFlags, serverEnv } from "@/src/lib/env";

const MAX_SNIPPET = 1200;

type FetchOutput = { url: string; snippet: string };
type SearchOutput = { results: { title?: string; url: string; snippet: string }[] };

export type ToolResult =
  | { name: "fetch_url"; output: FetchOutput | null }
  | { name: "fetch_public_page"; output: FetchOutput | null }
  | { name: "web_search"; output: SearchOutput | null };

export async function toolFetchUrl(url: string): Promise<{ name: "fetch_url"; output: FetchOutput | null }> {
  const safeUrl = ensureHttpsUrl(url);
  try {
    const res = await fetch(safeUrl, { method: "GET", next: { revalidate: 120 } });
    const text = await res.text();
    return {
      name: "fetch_url",
      output: text
        ? {
            url: safeUrl,
            snippet: text.replace(/\s+/g, " ").slice(0, MAX_SNIPPET),
          }
        : null,
    };
  } catch {
    return { name: "fetch_url", output: null };
  }
}

export async function toolFetchPublicPage(url: string): Promise<{ name: "fetch_public_page"; output: FetchOutput | null }> {
  if (featureFlags.mcpEnabled && serverEnv.MCP_FETCH_URL) {
    try {
      const res = await fetch(serverEnv.MCP_FETCH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = (await res.json()) as { url?: string; snippet?: string };
        if (data.url && data.snippet) {
          return {
            name: "fetch_public_page",
            output: { url: ensureHttpsUrl(data.url), snippet: data.snippet.slice(0, MAX_SNIPPET) },
          };
        }
      }
    } catch {
      // fall through to basic fetch
    }
  }
  const basic = await toolFetchUrl(url);
  return { name: "fetch_public_page", output: basic.output };
}

export async function toolWebSearch(query: string): Promise<{ name: "web_search"; output: SearchOutput | null }> {
  if (!featureFlags.mcpEnabled || !serverEnv.MCP_WEB_SEARCH_URL) {
    return { name: "web_search", output: { results: [] } };
  }
  try {
    const res = await fetch(serverEnv.MCP_WEB_SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return { name: "web_search", output: { results: [] } };
    const data = (await res.json()) as { results?: { title?: string; url?: string; snippet?: string }[] };
    const results =
      data.results?.slice(0, 3).flatMap((item) => {
        if (!item.url) return [];
        return [
          {
            title: item.title,
            url: ensureHttpsUrl(item.url),
            snippet: (item.snippet || item.title || "").slice(0, MAX_SNIPPET),
          },
        ];
      }) ?? [];
    return { name: "web_search", output: { results } };
  } catch {
    return { name: "web_search", output: { results: [] } };
  }
}
