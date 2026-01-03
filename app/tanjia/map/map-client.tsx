'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Globe, Search, FileText, Loader2, CheckCircle, AlertCircle, Clock, ExternalLink, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ProgressStepper, Step } from "@/src/components/ui/progress-stepper";
import { BulletListCard } from "@/src/components/ui/output-card";
import { SecondLookShare } from "@/src/components/ui/second-look-share";
import { formatDistanceToNow } from "date-fns";
import { type AnalysisV1 } from "@/src/lib/agents/analysis-v1";

type Lead = {
  id: string;
  name: string;
  website?: string | null;
};

type AnalysisResult = {
  id?: string;
  leadId?: string | null;
  url?: string;
  growthChanges: string[];
  frictionPoints: string[];
  calmNextSteps: string[];
  rawSummary?: string;
  createdAt?: string;
};

type Props = {
  leads: Lead[];
  recentAnalyses: AnalysisResult[];
};

type AnalysisStatus = 'idle' | 'fetching' | 'extracting' | 'summarizing' | 'complete' | 'error';

export function MapClient({ leads, recentAnalyses }: Props) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const urlToAnalyze = selectedLead?.website || customUrl;

  const steps: Step[] = [
    { label: "Fetching", status: status === 'fetching' ? 'active' : (status === 'idle' ? 'pending' : 'complete') },
    { label: "Extracting", status: status === 'extracting' ? 'active' : (['idle', 'fetching'].includes(status) ? 'pending' : 'complete') },
    { label: "Summarizing", status: status === 'summarizing' ? 'active' : (['idle', 'fetching', 'extracting'].includes(status) ? 'pending' : 'complete') },
  ];

  const handleRunAnalysis = async () => {
    if (!urlToAnalyze?.trim()) return;
    
    setStatus('fetching');
    setError(null);
    setResult(null);

    try {
      // Show progress steps with actual timing
      const fetchStart = Date.now();
      
      const response = await fetch("/api/tanjia/company-overview/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLeadId,
          url: urlToAnalyze.trim(),
        }),
      });

      // Update status based on elapsed time
      const elapsed = Date.now() - fetchStart;
      if (elapsed > 500) setStatus('extracting');
      if (elapsed > 1500) setStatus('summarizing');

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Analysis failed");
      }

      const data = await response.json();
      const analysis: AnalysisV1 | undefined = data?.analysis;

      if (!analysis) {
        throw new Error("No analysis returned");
      }

      setResult({
        leadId: selectedLeadId,
        url: urlToAnalyze.trim(),
        growthChanges: analysis.inference.growthShape.signals.map((s) => s.label || analysis.snapshot.whatTheyDo),
        frictionPoints: analysis.inference.frictionZones.map((f) => f.rationale),
        calmNextSteps: analysis.nextActions.map((a) => a.title),
        rawSummary: analysis.snapshot.whatTheyDo,
        createdAt: new Date().toISOString(),
      });
      setStatus('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus('error');
    }
  };

  const loadPreviousAnalysis = (analysis: AnalysisResult) => {
    setResult(analysis);
    setStatus('complete');
    if (analysis.leadId) {
      setSelectedLeadId(analysis.leadId);
    }
  };

  const handleCopySummary = () => {
    if (!result) return;
    const text = [
      result.rawSummary,
      "",
      "What's changed:",
      ...result.growthChanges.map(c => `• ${c}`),
      "",
      "Where friction might be:",
      ...result.frictionPoints.map(f => `• ${f}`),
      "",
      "Possible next steps:",
      ...result.calmNextSteps.map(s => `• ${s}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusIcon = {
    idle: <Globe className="h-5 w-5 text-neutral-400" />,
    fetching: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
    extracting: <Search className="h-5 w-5 text-amber-500 animate-pulse" />,
    summarizing: <FileText className="h-5 w-5 text-violet-500 animate-pulse" />,
    complete: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
  };

  const statusLabel = {
    idle: "Ready to scan",
    fetching: "Fetching website…",
    extracting: "Extracting signals…",
    summarizing: "Building summary…",
    complete: "Analysis complete",
    error: "Error occurred",
  };

  const presentUrl = result?.leadId 
    ? `/tanjia/present?lead=${result.leadId}` 
    : `/tanjia/present?zone=map`;

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <Card className="border-neutral-200 bg-white/90 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {statusIcon[status]}
              <div>
                <p className="font-medium text-neutral-900">{statusLabel[status]}</p>
                <p className="text-xs text-neutral-500">Website analyzer • Saved to database</p>
              </div>
            </div>
            {status === 'complete' && (
              <Button variant="ghost" size="sm" onClick={() => { setStatus('idle'); setResult(null); }}>
                New scan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Input Section */}
      {status === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-neutral-200 bg-white/80 backdrop-blur">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Select a lead (uses their website)
                </label>
                <select
                  value={selectedLeadId || ""}
                  onChange={(e) => {
                    setSelectedLeadId(e.target.value || null);
                    if (e.target.value) setCustomUrl("");
                  }}
                  className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">Or enter a URL below</option>
                  {leads.filter(l => l.website).map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} — {lead.website}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedLeadId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Or paste a URL
                  </label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}

              <Button
                onClick={handleRunAnalysis}
                disabled={!urlToAnalyze?.trim()}
                className="w-full bg-amber-600 text-white hover:bg-amber-700"
              >
                Run website scan
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Progress */}
      {['fetching', 'extracting', 'summarizing'].includes(status) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-neutral-200 bg-white/80 backdrop-blur">
            <CardContent className="p-5">
              <ProgressStepper steps={steps} />
              <p className="mt-4 text-sm text-neutral-600 text-center">
                {status === 'fetching' && "Reading their public pages quietly…"}
                {status === 'extracting' && "Finding signals in what they've shared…"}
                {status === 'summarizing' && "Building a calm summary…"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Error */}
      {status === 'error' && error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setStatus('idle')} className="mt-2">
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <AnimatePresence>
        {status === 'complete' && result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            {/* Summary */}
            {result.rawSummary && (
              <Card className="border-neutral-200 bg-white/80 backdrop-blur">
                <CardContent className="p-4">
                  <p className="text-sm text-neutral-700 leading-relaxed">{result.rawSummary}</p>
                  {result.url && (
                    <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {result.url}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <BulletListCard
              title="What changed with growth"
              items={result.growthChanges.slice(0, 3)}
            />
            
            <BulletListCard
              title="Friction points"
              items={result.frictionPoints.slice(0, 3)}
            />
            
            <BulletListCard
              title="Calm next steps"
              items={result.calmNextSteps.slice(0, 3)}
            />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopySummary}
                className="flex-1"
              >
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copied!" : "Copy summary"}
              </Button>
              <Link href={presentUrl} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Client View
                </Button>
              </Link>
            </div>

            <Card className="border-emerald-100 bg-emerald-50/30 backdrop-blur">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-emerald-800 mb-3">
                  Share Second Look
                </h4>
                <SecondLookShare
                  url="https://www.2ndmynd.com/second-look"
                  note={result.calmNextSteps[0] || "A clearer picture of where you are now."}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {status === 'idle' && recentAnalyses.length > 0 && (
        <Card className="border-neutral-200 bg-white/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent analyses
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {recentAnalyses.slice(0, 5).map((analysis) => {
                const lead = analysis.leadId ? leads.find(l => l.id === analysis.leadId) : null;
                return (
                  <button
                    key={analysis.id}
                    onClick={() => loadPreviousAnalysis(analysis)}
                    className="w-full p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {lead?.name || analysis.url || "Analysis"}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {analysis.rawSummary?.slice(0, 60) || analysis.growthChanges[0]?.slice(0, 60) || "No summary"}…
                        </p>
                      </div>
                      <span className="text-xs text-neutral-400 ml-2 shrink-0">
                        {analysis.createdAt ? formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true }) : ""}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
