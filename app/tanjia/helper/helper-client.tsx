'use client';

import { useMemo, useState } from "react";
import type { ChannelType, IntentType } from "@/lib/tanjia-config";
import { Card, CardContent } from "@/src/components/ui/card";
import { Select } from "@/src/components/ui/select";
import { Input, Textarea } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useToast } from "@/src/components/ui/toast";
import { SensitiveText } from "@/src/components/ui/sensitive-text";

type AgentResponse = { options: string[] };

const channelOptions: ChannelType[] = ["comment", "dm", "followup"];
const intentOptions: IntentType[] = ["reflect", "invite", "schedule", "encourage"];

type Props = {
  cal15Url: string;
  cal30Url: string;
  initialLeadId?: string;
  initialLeadName?: string;
};

export default function HelperClient({ cal15Url, cal30Url, initialLeadId, initialLeadName }: Props) {
  const [channel, setChannel] = useState<ChannelType>("dm");
  const [intent, setIntent] = useState<IntentType>("reflect");
  const [ownerMessage, setOwnerMessage] = useState("");
  const [contextNotes, setContextNotes] = useState("");
  const [leadId, setLeadId] = useState(initialLeadId || "");
  const [leadName, setLeadName] = useState(initialLeadName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const showToast = useToast();

  const isDisabled = useMemo(() => loading || ownerMessage.trim().length === 0, [loading, ownerMessage]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const response = await fetch("/api/tanjia-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          intent,
          ownerMessage: ownerMessage.trim(),
          contextNotes: contextNotes.trim() || undefined,
          leadId: leadId.trim() || undefined,
        }),
      });

      const data = (await response.json().catch(() => null)) as AgentResponse | null;
      if (!response.ok) {
        const message = (data as { error?: string } | null)?.error || "Something went wrong.";
        throw new Error(message);
      }

      if (!data || !data.options || data.options.length === 0) {
        throw new Error("No options returned. Try again.");
      }
      setResults(data.options);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to generate right now.";
      setError(message);
      showToast("Could not generate", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setChannel("dm");
    setIntent("reflect");
    setOwnerMessage("");
    setContextNotes("");
    setResults([]);
    setError(null);
    showToast("Reset", "default");
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied", "success");
    } catch {
      setError("Could not copy. Please try manually.");
    }
  };

  const shorten = (text: string) => {
    const firstSentence = text.split(". ")[0] || text;
    const trimmed = firstSentence.trim();
    return trimmed.length > 180 ? `${trimmed.slice(0, 180)}...` : trimmed;
  };

  const clearLead = () => {
    setLeadId("");
    setLeadName("");
  };

  return (
    <div className="flex flex-col gap-6">
      {leadId ? (
        <div className="flex items-center gap-2">
          <Badge variant="muted">
            Using: <SensitiveText text={leadName || leadId} id={leadId} />
          </Badge>
          <Button size="sm" variant="ghost" onClick={clearLead}>
            Clear
          </Button>
        </div>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-neutral-700">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Channel</span>
              <Select value={channel} onChange={(e) => setChannel(e.target.value as ChannelType)} aria-label="Channel">
                {channelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </label>

            <label className="flex flex-col gap-2 text-sm text-neutral-700">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Intent</span>
              <Select value={intent} onChange={(e) => setIntent(e.target.value as IntentType)} aria-label="Intent">
                {intentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">What they said</span>
            <Textarea
              value={ownerMessage}
              onChange={(e) => setOwnerMessage(e.target.value)}
              className="min-h-[140px]"
              placeholder='Example: "Loved your update on the new rollout. If you want a quiet look at the service page, happy to help."'
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Notes (optional)</span>
            <Textarea
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              className="min-h-[80px]"
              placeholder="Context, timing, or what you want to avoid"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Lead ID (optional)</span>
            <Input
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              placeholder="Use for lead context from snapshots"
            />
          </label>

          <div className="sticky bottom-0 flex flex-col gap-3 bg-white/70 pb-2 pt-1 backdrop-blur sm:static sm:bg-transparent sm:p-0 sm:backdrop-blur-0">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" onClick={handleSubmit} disabled={isDisabled} className="w-full sm:w-auto">
                {loading ? "Generating..." : "Generate options"}
              </Button>
              <Button type="button" onClick={handleReset} variant="secondary" className="w-full sm:w-auto">
                Reset
              </Button>
            </div>
            <p className="text-xs text-neutral-500">If it doesn’t feel true, don’t send it.</p>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {results.length > 0 && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-neutral-600">Pick what fits. Edit freely.</p>
            {results.map((option, index) => (
              <div key={index} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-6 text-neutral-800">
                    <SensitiveText text={option} mask="message" />
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleCopy(option)}>
                    Copy
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleCopy(shorten(option))}>
                    Shorten
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-1 text-xs text-neutral-500">
        <p>Keep it human. Only use what feels true.</p>
        <p>Cal links: 15m {cal15Url} · 30m {cal30Url}</p>
      </div>
    </div>
  );
}
