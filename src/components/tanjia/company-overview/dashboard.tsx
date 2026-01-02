'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Info, Loader2, Shield, Sparkles } from "lucide-react";
import { type AnalysisV1, type Confidence } from "@/src/lib/agents/analysis-v1";
import { confidenceLabel } from "@/src/lib/copy/rules";
import { useViewModes } from "@/src/components/ui/view-modes";
import { PageShell } from "@/src/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { ProgressStepper, type Step } from "@/src/components/ui/progress-stepper";
import { Badge } from "@/src/components/ui/badge";
import { gradientText } from "@/src/components/ui/brand";
import { Separator } from "@/src/components/ui/separator";

type Lead = { id: string; name: string; website?: string | null };
type HistoryItem = { id?: string; createdAt?: string; analysis: AnalysisV1 };

type Props = {
  leads: Lead[];
  history: HistoryItem[];
  initialAnalysis?: AnalysisV1 | null;
  siteUrl: string;
};

const frictionCopy: Record<string, string> = {
  clarity: "Messaging clarity",
  time: "Time bandwidth",
  follow_up: "Follow-up rhythm",
  systems: "Systems & process",
  decision_fatigue: "Decision fatigue",
};

const statusOrder: Array<Step["label"]> = ["Fetch", "Extract", "Infer", "Compose"];

function confidenceTone(confidence?: Confidence) {
  switch (confidence) {
    case "high":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "medium":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-neutral-100 text-neutral-800 border-neutral-200";
  }
}

function barWidth(score: number) {
  const value = Math.min(100, Math.max(0, score));
  return `${value}%`;
}

export function CompanyOverviewDashboard({ leads, history, initialAnalysis, siteUrl }: Props) {
  const { presentationMode, explainMode } = useViewModes();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [deepScan, setDeepScan] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisV1 | null>(initialAnalysis || null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(history || []);
  const [activeHistoryId, setActiveHistoryId] = useState<string | undefined>(history?.[0]?.id);
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedLeadId) return;
    const lead = leads.find((l) => l.id === selectedLeadId);
    if (lead?.website) setUrl(lead.website);
  }, [selectedLeadId, leads]);

  const steps: Step[] = statusOrder.map((label, idx) => ({
    label,
    status: progressStep > idx ? "complete" : progressStep === idx ? "active" : "pending",
  }));

  const runOverview = async () => {
    if (!url.trim()) return;
    setStatus("running");
    setProgressStep(0);
    setError(null);

    const timer = setInterval(() => {
      setProgressStep((prev) => Math.min(prev + 1, statusOrder.length - 1));
    }, 800);

    try {
      const response = await fetch("/api/tanjia/company-overview/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          leadId: selectedLeadId || undefined,
          deepScan,
        }),
      });

      clearInterval(timer);
      setProgressStep(statusOrder.length);

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Unable to run overview right now.");
        setStatus("error");
        return;
      }

      const newAnalysis = data.analysis as AnalysisV1;
      setAnalysis(newAnalysis);
      setActiveHistoryId(data.id);

      const newHistory: HistoryItem = { id: data.id, createdAt: data.createdAt, analysis: newAnalysis };
      setHistoryItems((prev) => {
        const merged = [newHistory, ...prev.filter((h) => h.id !== data.id)].slice(0, 5);
        return merged;
      });
      setStatus("idle");
    } catch (err) {
      clearInterval(timer);
      setStatus("error");
      setError("Unable to run overview right now.");
    }
  };

  const loadHistory = (id: string) => {
    const item = historyItems.find((h) => h.id === id);
    if (item) {
      setAnalysis(item.analysis);
      setActiveHistoryId(id);
      setError(null);
    }
  };

  const confidence = analysis?.snapshot.confidence || "low";
  const lastUpdated = analysis?.input.fetchedAt
    ? formatDistanceToNow(new Date(analysis.input.fetchedAt), { addSuffix: true })
    : "Not yet run";

  const copySnapshot = async () => {
    if (!analysis) return;
    const text = [
      "Company snapshot:",
      analysis.snapshot.whatTheyDo,
      `Who they serve: ${analysis.snapshot.whoTheyServe.join(", ") || "unspecified"}`,
      `Confidence: ${confidenceLabel(analysis.snapshot.confidence)}`,
      "",
      "Why we think this:",
      ...analysis.snapshot.rationale.map((r) => `- ${r}`),
    ].join("\n");
    await navigator.clipboard?.writeText(text);
  };

  const copyNextSteps = async () => {
    if (!analysis) return;
    const text = [
      "Calm next steps:",
      ...analysis.nextActions.map(
        (a) => `- [${a.category}] ${a.title} — ${a.why} (Ask: ${a.questionToAsk})`
      ),
    ].join("\n");
    await navigator.clipboard?.writeText(text);
  };

  const clientSafeLink = `${siteUrl.replace(/\/$/, "")}/tanjia/presentation`;
  const copyClientSafe = async () => {
    await navigator.clipboard?.writeText(clientSafeLink);
  };

  const selectedWhoTheyServe = analysis?.snapshot.whoTheyServe || [];

  return (
    <PageShell maxWidth="xl" className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white/90 p-5 shadow-sm backdrop-blur"
      >
        <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Tools → Company Overview</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900">
              Company <span className={gradientText()}>Overview</span>
            </h1>
            <p className="text-sm text-neutral-600">
              A calm snapshot of what they do, who they serve, and where pressure likely lives.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`border ${confidenceTone(confidence)}`}>{confidenceLabel(confidence)}</Badge>
            <span className="text-xs text-neutral-500">Last updated {lastUpdated}</span>
            <Button variant="secondary" size="sm" onClick={copySnapshot}>
              Copy Snapshot
            </Button>
            <Button variant="secondary" size="sm" onClick={copyNextSteps}>
              Copy Next Steps
            </Button>
            <Button variant="secondary" size="sm" onClick={copyClientSafe}>
              Copy client-safe view
            </Button>
            <Link href="/tanjia/presentation" target="_blank">
              <Button variant="ghost" size="sm">Open client-safe view</Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <Card className="border-neutral-200 bg-white/90 backdrop-blur shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-neutral-900">What should I analyze?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-2">
              <label className="text-sm font-medium text-neutral-700">Lead (uses their website)</label>
              <Select value={selectedLeadId || ""} onChange={(e) => setSelectedLeadId(e.target.value || null)}>
                <option value="">Optional: pick a lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} {lead.website ? `— ${lead.website}` : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div className="lg:col-span-1 space-y-2">
              <label className="text-sm font-medium text-neutral-700">URL</label>
              <Input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="lg:col-span-1 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={deepScan}
                  onChange={(e) => setDeepScan(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                Deep scan (about/services/contact)
              </label>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={runOverview}
              disabled={!url.trim() || status === "running"}
              className="bg-neutral-900 text-white hover:bg-neutral-800"
            >
              {status === "running" ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Running overview
                </span>
              ) : (
                "Run overview"
              )}
            </Button>
            <button
              type="button"
              className="text-sm text-neutral-500 hover:text-neutral-800 underline-offset-2 hover:underline"
              onClick={() => setUrl((prev) => prev || "https://example.com/about")}
            >
              Paste a specific page URL (about/services) for stronger signal
            </button>
          </div>
          {status === "running" && <ProgressStepper steps={steps} />}
          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}
          {historyItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-neutral-600 uppercase tracking-[0.08em]">History</span>
              <Select value={activeHistoryId || ""} onChange={(e) => loadHistory(e.target.value)}>
                {!activeHistoryId && <option value="">Latest overview</option>}
                {historyItems.map((item) => (
                  <option key={item.id || item.analysis.input.fetchedAt} value={item.id || item.analysis.input.fetchedAt}>
                    {item.analysis.snapshot.whatTheyDo?.slice(0, 40) || "Overview"} ·{" "}
                    {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : "recent"}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {analysis ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="border-neutral-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-neutral-900">Business Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-neutral-800">{analysis.snapshot.whatTheyDo}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedWhoTheyServe.length > 0 ? (
                    selectedWhoTheyServe.map((aud) => (
                      <Badge key={aud} variant="secondary" className="rounded-full bg-neutral-100 text-neutral-800">
                        {aud}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-500">No audience specified on public pages.</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                  <span>Service model: <strong className="text-neutral-900">{analysis.snapshot.serviceModel}</strong></span>
                  <span>Stage: <strong className="text-neutral-900">{analysis.snapshot.companyStage}</strong></span>
                  <span>Revenue model: <strong className="text-neutral-900">{analysis.snapshot.revenueModel}</strong></span>
                  <span>Owner-led: <strong className="text-neutral-900">{analysis.snapshot.ownerLedLikelihood}</strong></span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-neutral-700">Why we think this</p>
                  <ul className="space-y-1 text-sm text-neutral-700 list-disc list-inside">
                    {analysis.snapshot.rationale.map((rationale, idx) => (
                      <li key={idx}>{rationale}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-neutral-900">Likely Friction Zones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.inference.frictionZones.map((zone) => (
                  <div key={zone.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-800">{frictionCopy[zone.key]}</span>
                      <span className="text-xs text-neutral-500">{confidenceLabel(zone.confidence)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700"
                        style={{ width: barWidth(zone.score) }}
                      />
                    </div>
                    <p className="text-xs text-neutral-600">{zone.rationale}</p>
                  </div>
                ))}
                {analysis.inference.frictionZones.length === 0 && (
                  <p className="text-xs text-neutral-500">Friction signals are light; provisional read only.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="border-neutral-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-neutral-900">Growth Shape</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-neutral-800">{analysis.inference.growthShape.summary}</p>
                <ul className="space-y-1 text-sm text-neutral-700 list-disc list-inside">
                  {analysis.inference.growthShape.signals.length > 0 ? (
                    analysis.inference.growthShape.signals.map((signal, idx) => (
                      <li key={idx}>
                        <span className="font-medium text-neutral-900">{signal.label}</span>
                        {signal.detail ? ` — ${signal.detail}` : ""}
                      </li>
                    ))
                  ) : (
                    <li className="text-neutral-600">
                      No explicit growth markers found; listing plausible patterns with low confidence.
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-neutral-900">Existing Systems (Inferred)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.inference.systems.detected.length > 0 ? (
                  <div className="space-y-2">
                    {analysis.inference.systems.detected.map((sys, idx) => (
                      <div key={`${sys.label}-${idx}`} className="flex items-center justify-between text-sm text-neutral-800">
                        <span>{sys.label}</span>
                        <Badge variant="secondary" className="text-xs">{confidenceLabel(sys.confidence)}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-600">
                    No tooling footprint detected on public pages; assuming baseline tools with low confidence.
                  </p>
                )}
                {analysis.inference.systems.inferred.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-neutral-700">Likely baselines</p>
                      {analysis.inference.systems.inferred.map((sys, idx) => (
                        <div key={`${sys.label}-${idx}`} className="flex items-center justify-between text-sm text-neutral-800">
                          <span>{sys.label}</span>
                          <Badge variant="secondary" className="text-xs">{confidenceLabel(sys.confidence)}</Badge>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-4"
          >
            <Card className="border-neutral-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-neutral-900">Calm Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {analysis.nextActions.map((action, idx) => (
                  <div key={idx} className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-900">{action.title}</p>
                      <Badge variant="secondary" className="text-[11px] uppercase tracking-wide">
                        {action.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-600 mt-1">{action.why}</p>
                    <p className="text-xs text-neutral-700 mt-2">
                      Ask: <span className="font-medium text-neutral-900">{action.questionToAsk}</span>
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1">{confidenceLabel(action.confidence)}</p>
                  </div>
                ))}
              </CardContent>
              <CardContent className="flex flex-wrap gap-2 pt-1">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Create Follow-up Plan
                </Button>
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Draft First Message
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/tanjia/leads">Add to Leads</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-neutral-200 bg-white/90 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-neutral-900">Evidence & Missing Signals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <details className="rounded-lg border border-neutral-200 bg-neutral-50 p-3" open={!presentationMode}>
                  <summary className="text-sm font-semibold text-neutral-800 cursor-pointer flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Evidence
                  </summary>
                  {presentationMode ? (
                    <p className="text-xs text-neutral-500 mt-2">Evidence is hidden in client-safe view.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {analysis.evidence.length > 0 ? (
                        analysis.evidence.slice(0, 5).map((ev, idx) => (
                          <div key={idx} className="rounded-md border border-neutral-200 bg-white p-2 text-xs text-neutral-700">
                            <p className="font-semibold text-neutral-800">{ev.url}</p>
                            <p className="text-neutral-600">{ev.snippet}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-500">No evidence captured yet.</p>
                      )}
                    </div>
                  )}
                </details>

                <details className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <summary className="text-sm font-semibold text-neutral-800 cursor-pointer flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Missing signals
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {analysis.missingSignals.map((item, idx) => (
                      <Badge key={idx} variant="secondary" className="rounded-full bg-neutral-100 text-neutral-800">
                        {item.label}
                      </Badge>
                    ))}
                    {analysis.missingSignals.length === 0 && (
                      <span className="text-xs text-neutral-500">No gaps noted.</span>
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-neutral-700">Try these pages next</p>
                    <div className="flex flex-wrap gap-2">
                      {["/about", "/services", "/pricing", "/team"].map((path) => (
                        <Button
                          key={path}
                          size="sm"
                          variant="secondary"
                          onClick={() => setUrl((prev) => {
                            if (!prev) return path;
                            try {
                              const base = new URL(prev);
                              return `${base.origin}${path}`;
                            } catch {
                              return `${prev.replace(/\/$/, "")}${path}`;
                            }
                          })}
                        >
                          Scan {path}
                        </Button>
                      ))}
                    </div>
                  </div>
                </details>

                {explainMode && (
                  <details className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <summary className="text-sm font-semibold text-neutral-800 cursor-pointer flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Inspect output
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] text-neutral-700 bg-white border border-neutral-200 rounded-md p-3">
                      {JSON.stringify(analysis, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : (
        <Card className="border-dashed border-neutral-200 bg-white/70 text-center shadow-sm">
          <CardContent className="py-12 space-y-3">
            <p className="text-sm text-neutral-700">Run an overview to see the dashboard.</p>
            <Button onClick={runOverview} disabled={!url.trim()} className="bg-neutral-900 text-white hover:bg-neutral-800">
              Run overview
            </Button>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
