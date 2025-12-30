'use client';

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { useViewModes } from "@/src/components/ui/view-modes";

type Health = {
  mcpEnabled: boolean;
  fetchConfigured: boolean;
  webSearchConfigured: boolean;
  checks: { fetchPublicPageOk: boolean; webSearchOk: boolean };
  latencyMs?: { fetch?: number; webSearch?: number };
};

export default function McpHealthCard() {
  const { explainMode, presentationMode } = useViewModes();
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    if (!explainMode || presentationMode) return;
    let cancelled = false;
    fetch("/api/tanjia/mcp-health")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setHealth(data as Health);
      })
      .catch(() => setHealth(null));
    return () => {
      cancelled = true;
    };
  }, [explainMode, presentationMode]);

  if (!explainMode || presentationMode || !health) return null;

  const badge = (ok: boolean | undefined) => (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
        ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
      }`}
    >
      {ok ? "OK" : "Check"}
    </span>
  );

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-900">Internal check: MCP</p>
          {badge(health.mcpEnabled)}
        </div>
        <div className="grid gap-2 text-sm text-neutral-700 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
            <span>Fetch configured</span>
            {badge(health.fetchConfigured && health.checks.fetchPublicPageOk)}
          </div>
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
            <span>Search configured</span>
            {badge(health.webSearchConfigured && health.checks.webSearchOk)}
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          Latency ms - fetch: {health.latencyMs?.fetch ?? "n/a"}, search: {health.latencyMs?.webSearch ?? "n/a"}
        </p>
      </CardContent>
    </Card>
  );
}
