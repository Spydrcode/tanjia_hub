import type { Metadata } from "next";
import { PageHeader } from "@/src/components/ui/page-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { ExplainHint } from "@/src/components/ui/explain-hint";
import WalkthroughPanel from "./walkthrough-panel";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import McpHealthCard from "./mcp-health-card";
import { brandGradients } from "@/src/components/ui/brand";

export const metadata: Metadata = {
  title: "System overview",
  description: "Client View of how the hub runs day to day.",
  robots: { index: false, follow: false },
};

const lastUpdated = new Date().toLocaleString();

type MetricDelta = { last7d: number; prev7d: number; delta: number };

async function fetchMetrics(): Promise<Record<string, MetricDelta>> {
  try {
    const res = await fetch("/api/tanjia/metrics", { cache: "no-store" });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, MetricDelta>;
  } catch {
    return {};
  }
}

function DeltaPill({ delta = 0 }: { delta?: number }) {
  const sign = delta > 0 ? "+" : "";
  const tone =
    delta > 0
      ? "text-emerald-700 bg-emerald-50 border-emerald-100"
      : delta < 0
        ? "text-amber-700 bg-amber-50 border-amber-100"
        : "text-neutral-700 bg-neutral-50 border-neutral-100";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {sign}
      {delta}
    </span>
  );
}

export default async function SystemOverviewPage() {
  await requireAuthOrRedirect();
  const metrics = await fetchMetrics();

  const operatingCards = [
    { label: "Scheduling opened", value: metrics.schedule_opened },
    { label: "Duration picked", value: metrics.duration_selected },
    { label: "Bookings created", value: metrics.bookings_created },
    { label: "Bookings canceled", value: metrics.bookings_canceled },
    { label: "Follow-ups created", value: metrics.followups_created },
    { label: "Follow-ups completed", value: metrics.followups_completed },
    metrics.unmatched_bookings ? { label: "Unmatched bookings", value: metrics.unmatched_bookings } : null,
  ].filter(Boolean) as { label: string; value: MetricDelta }[];

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="System"
        anchor="overview"
        eyebrow="Tanjia"
        description="A Client View of how the hub runs day to day."
        actionHref="/tanjia"
        actionLabel="Back to hub"
        actionVariant="ghost"
      >
        <p className="text-xs text-neutral-500">Last updated: {lastUpdated}</p>
      </PageHeader>

      <WalkthroughPanel />
      <McpHealthCard />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={`shadow-sm bg-gradient-to-br ${brandGradients.surface}`}>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900">Scheduling without friction</p>
              <span className="rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700">
                Cal.com
              </span>
            </div>
            <p className="text-sm text-neutral-700">
              Scheduling stays inside the workspace. Two options: 15 minutes for a quick alignment, 30 minutes for a working session.
              Embedded booking and tracking, no redirects.
            </p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm bg-gradient-to-br ${brandGradients.surface}`}>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-semibold text-neutral-900">Follow-ups that don't rely on memory</p>
            <p className="text-sm text-neutral-700">
              When a booking is created or changes, follow-ups are created automatically. Messages stay calm, no automation spam.
            </p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm bg-gradient-to-br ${brandGradients.surface}`}>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-semibold text-neutral-900">Conversations that turn into next steps</p>
            <p className="text-sm text-neutral-700">
              Notes and replies become structured actions so nothing gets lost between channels.
            </p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm bg-gradient-to-br ${brandGradients.surface}`}>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-semibold text-neutral-900">Draft help that stays human-led</p>
            <p className="text-sm text-neutral-700">
              Agents help with drafts, triage, and next steps, but relationships stay human-led.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900">Operating rhythm (last 7 days)</p>
            <div className="flex items-center gap-2">
              <ExplainHint target="metrics.operatingRhythm" />
              <span className="text-xs text-neutral-500">Aggregated counts only</span>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {operatingCards.map((item) => (
              <div key={item.label} className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">{item.label}</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-semibold text-neutral-900">{item.value?.last7d ?? 0}</p>
                  {item.value ? <DeltaPill delta={item.value.delta} /> : null}
                </div>
                <p className="text-xs text-neutral-500">Prev 7d: {item.value?.prev7d ?? 0}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card className={`shadow-sm bg-gradient-to-br ${brandGradients.surface}`}>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-semibold text-neutral-900">What this proves</p>
            <p className="text-sm text-neutral-700">Started free / low-cost.</p>
            <p className="text-sm text-neutral-700">Only pay when usage grows.</p>
            <p className="text-sm text-neutral-700">Systems reduce load without adding tools.</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="space-y-2 p-4 text-sm text-neutral-700">
            <p>This is an internal system. Versions of it are built for other owner-led businesses when it makes sense.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="space-y-2 p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">Quiet Founder note</p>
          <p className="text-sm text-neutral-700">This started simple. We only add complexity when growth earns it.</p>
        </CardContent>
      </Card>

      <footer className="pt-2 text-xs text-neutral-500">
        <p>Internal view - {tanjiaConfig.siteUrl}</p>
      </footer>
    </div>
  );
}
