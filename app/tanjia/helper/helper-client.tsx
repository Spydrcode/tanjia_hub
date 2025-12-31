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
import { useViewModes } from "@/src/components/ui/view-modes";

type AgentResponse = { text: string; traceId: string | null };
type FollowupResponse = { next_action: string; log_note: string; followups: { when: string; text: string }[]; traceId: string | null };
type ResultState =
  | { kind: "message"; data: AgentResponse }
  | { kind: "followup"; data: FollowupResponse }
  | null;

const channelOptions: ChannelType[] = ["comment", "dm", "followup"];
const intentOptions: IntentType[] = ["reflect", "invite", "schedule", "encourage"];

type Props = {
  cal15Url: string;
  cal30Url: string;
  initialLeadId?: string;
  initialLeadName?: string;
  emythHints?: { overload?: string; follow?: string };
};

export default function HelperClient({ cal15Url, cal30Url, initialLeadId, initialLeadName, emythHints }: Props) {
  const [channel, setChannel] = useState<ChannelType>("dm");
  const [intent, setIntent] = useState<IntentType>("reflect");
  const [ownerMessage, setOwnerMessage] = useState("");
  const [contextNotes, setContextNotes] = useState("");
  const [leadId, setLeadId] = useState(initialLeadId || "");
  const [leadName, setLeadName] = useState(initialLeadName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState>(null);
  const [lastChannel, setLastChannel] = useState<ChannelType>("dm");
  const showToast = useToast();
  const { presentationMode, explainMode } = useViewModes();

  const isDisabled = useMemo(() => loading || ownerMessage.trim().length === 0, [loading, ownerMessage]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const endpoint =
        channel === "comment"
          ? "/api/tanjia/comment-reply"
          : channel === "dm"
            ? "/api/tanjia/dm-reply"
            : "/api/tanjia/followup-plan";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          intent,
          what_they_said: ownerMessage.trim(),
          notes: contextNotes.trim() || null,
          leadId: leadId.trim() || null,
        }),
      });

      const data = (await response.json().catch(() => null)) as AgentResponse | FollowupResponse | null;
      if (!response.ok) {
        const message = (data as { error?: string } | null)?.error || "Something went wrong.";
        throw new Error(message);
      }

      if (!data) {
        throw new Error("No draft returned. Try again.");
      }
      if (channel === "followup") {
        const followup = data as FollowupResponse;
        if (!followup.next_action || !followup.followups) throw new Error("No plan returned. Try again.");
        setResult({ kind: "followup", data: followup });
      } else {
        const message = data as AgentResponse;
        if (!message.text) throw new Error("No draft returned. Try again.");
        setResult({ kind: "message", data: message });
      }
      setLastChannel(channel);
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
    setResult(null);
    setError(null);
    setLastChannel("dm");
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
          {!presentationMode && emythHints ? (
            <div className="rounded-md bg-neutral-100 px-3 py-2 text-xs text-neutral-700">
              {emythHints.overload ? <p>Owner role overload: {emythHints.overload}</p> : null}
              {emythHints.follow ? <p>Next action system: {emythHints.follow}</p> : null}
            </div>
          ) : null}
          <Button size="sm" variant="ghost" onClick={clearLead}>
            Clear
          </Button>
        </div>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 text-sm text-neutral-700">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Channel</span>
              <div className="flex gap-2">
                {channelOptions.map((option) => {
                  const active = channel === option;
                  return (
                    <Button
                      key={option}
                      type="button"
                      variant={active ? "primary" : "secondary"}
                      size="sm"
                      className="flex-1 uppercase tracking-[0.08em]"
                      onClick={() => setChannel(option)}
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>
            </div>

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
                {loading ? "Generating..." : "Generate"}
              </Button>
              <Button type="button" onClick={handleReset} variant="secondary" className="w-full sm:w-auto">
                Reset
              </Button>
            </div>
            <p className="text-xs text-neutral-500">If it doesn't feel true, don't send it.</p>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {result?.kind === "message" && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-600">
                {lastChannel === "comment" ? "Public comment" : lastChannel === "dm" ? "Direct message" : "Follow-up"}
              </p>
              {!presentationMode && explainMode && result.data.traceId ? (
                <span className="text-xs text-neutral-500">Trace: {result.data.traceId}</span>
              ) : null}
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm leading-6 text-neutral-800">
                <SensitiveText text={result.data.text} mask="message" />
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleCopy(result.data.text)}>
                  Copy
                </Button>
              </div>
              {!presentationMode && explainMode ? (
                <p className="mt-2 text-xs text-neutral-500">Trace stored internally {result.data.traceId ? `(id: ${result.data.traceId})` : ""}.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {result?.kind === "followup" && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-600">Follow-up plan</p>
              {!presentationMode && explainMode && result.data.traceId ? (
                <span className="text-xs text-neutral-500">Trace: {result.data.traceId}</span>
              ) : null}
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Next action</p>
              <p className="text-sm leading-6 text-neutral-800">{result.data.next_action}</p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Log note</p>
              <p className="text-sm leading-6 text-neutral-800">{result.data.log_note}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {result.data.followups.map((item, idx) => (
                <div key={`${item.when}-${idx}`} className="rounded-lg border border-neutral-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">{item.when}</p>
                  <p className="text-sm leading-6 text-neutral-800">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => handleCopy(result.data.next_action)}>
                Copy next action
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleCopy(
                    `${result.data.next_action}\nLog: ${result.data.log_note}\nFollowups:\n${result.data.followups.map((f) => `- ${f.when}: ${f.text}`).join("\n")}`,
                  )
                }
              >
                Copy plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-1 text-xs text-neutral-500">
        <p>Keep it human. Only use what feels true.</p>
        <p>
          Cal links: 15m {cal15Url} | 30m {cal30Url}
        </p>
      </div>
    </div>
  );
}
