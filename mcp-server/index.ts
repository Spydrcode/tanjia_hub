import http from "http";
import { URL } from "url";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const MAX_MS = 5000;
const MAX_SNIPPET = 1200;

function json(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MAX_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text();
    return text.replace(/\s+/g, " ").slice(0, MAX_SNIPPET);
  } finally {
    clearTimeout(timeout);
  }
}

async function handleFetchPublicPage(req: http.IncomingMessage, res: http.ServerResponse, payload: any) {
  const url = typeof payload?.url === "string" ? payload.url : "";
  if (!/^https:\/\//i.test(url)) return json(res, 400, { error: "https required" });
  try {
    const snippet = await fetchWithTimeout(url);
    return json(res, 200, { url, snippet });
  } catch {
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
