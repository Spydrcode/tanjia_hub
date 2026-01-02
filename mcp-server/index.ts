import http from "http";
import { URL } from "url";
import * as cheerio from "cheerio";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const MAX_MS = 10000;
const MAX_SNIPPET = 2500;

function json(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function fetchWithTimeout(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MAX_MS);
  try {
    const res = await fetch(url, { 
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TanjiaBot/1.0; +https://2ndmynd.com)",
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractContent(html: string): { snippet: string; title?: string } {
  const $ = cheerio.load(html);
  
  // Remove non-content elements
  $("script, style, noscript, iframe, nav, footer, aside, form").remove();
  $("[role='navigation'], [role='complementary'], [role='banner']").remove();
  
  // Extract title
  const title = 
    $("title").text().trim() || 
    $('meta[property="og:title"]').attr("content") || 
    $("h1").first().text().trim() || 
    undefined;
  
  // Extract description
  const description = 
    $('meta[name="description"]').attr("content") || 
    $('meta[property="og:description"]').attr("content") || 
    "";
  
  // Try to get main content
  let mainContent = "";
  const contentSelectors = [
    "article",
    '[role="main"]',
    "main",
    ".content",
    ".main-content",
    "#content",
    "#main",
  ];
  
  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      mainContent = element.text();
      break;
    }
  }
  
  // Fallback to body
  if (!mainContent) {
    mainContent = $("body").text();
  }
  
  // Extract key headings
  const headings: string[] = [];
  $("h1, h2, h3").each((_, element) => {
    const text = $(element).text().trim();
    if (text && text.length > 0 && headings.length < 10) {
      headings.push(text);
    }
  });
  
  // Build snippet
  let snippet = "";
  
  if (title) {
    snippet += `# ${title}\n\n`;
  }
  
  if (description) {
    snippet += `${description}\n\n`;
  }
  
  if (headings.length > 0) {
    snippet += "## Key Sections:\n";
    headings.forEach(h => {
      snippet += `- ${h}\n`;
    });
    snippet += "\n";
  }
  
  // Add main content
  snippet += "## Content:\n";
  const cleanContent = mainContent
    .replace(/\s+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
  
  const remainingSpace = MAX_SNIPPET - snippet.length - 100;
  snippet += cleanContent.slice(0, Math.max(remainingSpace, 500));
  
  return {
    snippet: snippet.slice(0, MAX_SNIPPET),
    title,
  };
}

async function handleFetchPublicPage(req: http.IncomingMessage, res: http.ServerResponse, payload: any) {
  const url = typeof payload?.url === "string" ? payload.url : "";
  if (!/^https:\/\//i.test(url)) return json(res, 400, { error: "https required" });
  try {
    const html = await fetchWithTimeout(url);
    if (!html) return json(res, 502, { error: "fetch failed" });
    
    const { snippet, title } = extractContent(html);
    return json(res, 200, { url, snippet, title });
  } catch (error) {
    console.error("[mcp-server] fetch error:", error);
    return json(res, 502, { error: "fetch failed" });
  }
}

async function handleWebSearch(req: http.IncomingMessage, res: http.ServerResponse, payload: any) {
  const query = typeof payload?.query === "string" ? payload.query.trim() : "";
  if (!query) return json(res, 400, { results: [] });
  // Minimal stub: return empty results to avoid external calls
  return json(res, 200, { results: [] });
}

const server = http.createServer(async (req, res) => {
  if (!req.url || req.method !== "POST") return json(res, 404, { error: "not found" });
  const path = new URL(req.url, "http://localhost").pathname;
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    let payload: any = null;
    try {
      payload = body ? JSON.parse(body) : {};
    } catch {
      payload = {};
    }
    if (path === "/fetch_public_page") return handleFetchPublicPage(req, res, payload);
    if (path === "/web_search") return handleWebSearch(req, res, payload);
    return json(res, 404, { error: "not found" });
  });
});

server.listen(PORT, () => {
  console.log(`MCP stub listening on ${PORT}`);
});
