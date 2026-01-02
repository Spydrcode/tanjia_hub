'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, History } from "lucide-react";
import { PageShell } from "@/src/components/ui/page-shell";
import { IntentHeader } from "@/src/components/ui/intent-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { ProgressStepper, Step } from "@/src/components/ui/progress-stepper";
import { BulletListCard } from "@/src/components/ui/output-card";
import { SecondLookShare } from "@/src/components/ui/second-look-share";
import { tanjiaConfig } from "@/lib/tanjia-config";

type Lead = {
  id: string;
  name: string;
  website?: string | null;
};

type AnalysisResult = {
  growthChanges: string[];
  frictionPoints: string[];
  calmNextSteps: string[];
  rawSummary?: string;
};

type HistoryItem = {
  id: string;
  created_at: string;
  url?: string | null;
  lead?: { id: string; name: string } | null;
  growth_changes: string[];
  friction_points: string[];
  calm_next_steps: string[];
};

type Props = {
  leads: Lead[];
  history: HistoryItem[];
};

export function AnalyzeClient({ leads, history }: Props) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiPayload, setApiPayload] = useState<Record<string, any> | null>(null);
  const [processingStep, setProcessingStep] = useState(0);

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const urlToAnalyze = selectedLead?.website || customUrl;

  const steps: Step[] = [
    { label: "Fetching", status: processingStep > 0 ? "complete" : (isProcessing ? "active" : "pending") },
    { label: "Extracting", status: processingStep > 1 ? "complete" : (processingStep === 1 ? "active" : "pending") },
    { label: "Summarizing", status: processingStep > 2 ? "complete" : (processingStep === 2 ? "active" : "pending") },
  ];

  const handleSubmit = async () => {
    if (!urlToAnalyze?.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setApiPayload(null);
    setProcessingStep(0);

    try {
      // Simulate progress steps
      const stepInterval = setInterval(() => {
        setProcessingStep(prev => Math.min(prev + 1, 2));
      }, 1500);

      const response = await fetch("/api/tanjia/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLeadId,
          url: urlToAnalyze.trim(),
        }),
      });

      clearInterval(stepInterval);

      const data = await response.json().catch(() => null);
      setApiPayload(data);

      if (!response.ok || !data) {
        const message = (data as any)?.error || "Failed to run analysis";
        throw new Error(message);
      }

      setProcessingStep(3);
      setResult({
        growthChanges: data.growthChanges || [],
        frictionPoints: data.frictionPoints || [],
        calmNextSteps: data.calmNextSteps || [],
        rawSummary: data.rawSummary,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <PageShell maxWidth="lg">
      <IntentHeader
        badge="Operator"
        badgeVariant="operator"
        title="Website"
        anchor="Analysis"
        subtitle="Understand what someone's business is doing and where they might be stuck."
        backHref="/tanjia/tools"
        backLabel="Back to Tools"
      />

      {/* Input Section */}
      <Card className="border-neutral-200 bg-white/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-neutral-900">
            What should I analyze?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!urlToAnalyze?.trim() || isProcessing}
            className="w-full bg-neutral-900 text-white hover:bg-neutral-800"
          >
            {isProcessing ? "Analyzing..." : "Run analysis"}
          </Button>
        </CardContent>
      </Card>

      {/* Progress Section */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-neutral-200 bg-white/80 backdrop-blur">
            <CardContent className="py-4">
              <ProgressStepper steps={steps} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4">
              <p className="text-sm text-red-700">{error}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results Section */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <BulletListCard
            title="What changed with growth"
            items={result.growthChanges}
          />
          
          <BulletListCard
            title="Friction points"
            items={result.frictionPoints}
          />
          
          <BulletListCard
            title="Calm next steps"
            items={result.calmNextSteps}
          />

          <Card className="border-neutral-200 bg-white/80 backdrop-blur">
            <CardContent className="flex flex-wrap items-center gap-3 py-4">
              <SecondLookShare
                url={tanjiaConfig.secondLookUrl}
                note={`Analysis for ${selectedLead?.name || urlToAnalyze}: ${result.calmNextSteps[0] || 'Ready when you are.'}`}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open('/tanjia/present', '_blank')}
                className="gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open client-safe view
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Raw API payload for troubleshooting */}
      {apiPayload && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-neutral-200 bg-white/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-neutral-900">
                Latest API response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap break-words text-xs text-neutral-700 bg-neutral-50 border border-neutral-100 rounded-md p-3">
                {JSON.stringify(apiPayload, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-neutral-200 bg-white/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-neutral-900">
                <History className="h-4 w-4 text-neutral-500" />
                Recent analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-md border border-neutral-100 bg-neutral-50 p-3"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-neutral-900">
                        {item.lead?.name || item.url || 'Unknown'}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {item.calm_next_steps?.length || 0} steps
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </PageShell>
  );
}
