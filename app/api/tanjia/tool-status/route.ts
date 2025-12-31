import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { featureFlags } from "@/src/lib/env";

type Status = "healthy" | "degraded" | "offline";

type StatusItem = { id: string; label: string; status: Status; detail?: string };

const CACHE_MS = 45 * 1000;
let cached: { timestamp: number; payload: { updatedAt: string; items: StatusItem[] } } | null = null;

async function safeFetch(url: string, opts?: RequestInit, timeoutMs = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);
    return res;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function checkSupabase() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("leads").select("id").limit(1);
    if (error) throw error;
    return { status: "healthy" as Status, detail: "DB reachable" };
  } catch (err) {
    return { status: "degraded" as Status, detail: "DB read failed" };
  }
}

async function checkRoute(path: string) {
  const res = await safeFetch(path, { method: "OPTIONS" });
  if (res && res.ok) return { status: "healthy" as Status, detail: "Responding" };
  if (res && res.status >= 400) return { status: "degraded" as Status, detail: `Status ${res.status}` };
  return { status: "offline" as Status, detail: "No response" };
}

function flagStatus(id: string, label: string, enabled: boolean): StatusItem {
  return { id, label, status: enabled ? "healthy" : "degraded", detail: enabled ? "Enabled" : "Disabled" };
}

export async function GET() {
  if (cached && Date.now() - cached.timestamp < CACHE_MS) {
    return NextResponse.json(cached.payload, { status: 200 });
  }

  const [db, commentRoute, dmRoute, followupRoute, primaryAimRoute, emythRunRoute] = await Promise.all([
    checkSupabase(),
    checkRoute("/api/tanjia/comment-reply"),
    checkRoute("/api/tanjia/dm-reply"),
    checkRoute("/api/tanjia/followup-plan"),
    checkRoute("/api/tanjia/emyth/primary-aim"),
    checkRoute("/api/tanjia/emyth/run"),
  ]);

  const items: StatusItem[] = [
    flagStatus("mcp", "MCP", featureFlags.mcpEnabled),
    { id: "web_search", label: "Web search", status: featureFlags.mcpEnabled ? "healthy" : "degraded", detail: featureFlags.mcpEnabled ? "Ready" : "MCP disabled" },
    { id: "fetch_public_page", label: "Fetch page", status: featureFlags.mcpEnabled ? "healthy" : "degraded", detail: featureFlags.mcpEnabled ? "Ready" : "MCP disabled" },
    { id: "db", label: "DB", status: db.status, detail: db.detail },
    { id: "comment-reply", label: "Comment reply", status: commentRoute.status, detail: commentRoute.detail },
    { id: "dm-reply", label: "DM reply", status: dmRoute.status, detail: dmRoute.detail },
    { id: "followup-plan", label: "Follow-up plan", status: followupRoute.status, detail: followupRoute.detail },
    { id: "emyth-primary-aim", label: "E-Myth primary aim", status: primaryAimRoute.status, detail: primaryAimRoute.detail },
    { id: "emyth-run", label: "E-Myth run", status: emythRunRoute.status, detail: emythRunRoute.detail },
  ];

  const payload = { updatedAt: new Date().toISOString(), items };
  cached = { timestamp: Date.now(), payload };

  return NextResponse.json(payload);
}
