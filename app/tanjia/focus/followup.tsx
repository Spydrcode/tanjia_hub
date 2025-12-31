'use client';

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Textarea, Input } from "@/src/components/ui/input";
import { useViewModes } from "@/src/components/ui/view-modes";

type Props = { onClose: () => void };

export function FollowupFocus({ onClose }: Props) {
  const { explainMode, presentationMode } = useViewModes();
  const [text, setText] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/tanjia/followup-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "followup", what_they_said: text, notes }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Unable to plan right now." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="What they said" className="min-h-[140px]" />
      <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" />
      <div className="flex gap-2">
        <Button size="sm" onClick={run} disabled={loading}>
          {loading ? "Planning..." : "Plan follow-up"}
        </Button>
        {result?.next_action ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigator.clipboard?.writeText(result.next_action || "")}
          >
            Copy next action
          </Button>
        ) : null}
      </div>
      {result?.next_action ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-800 space-y-2">
          <p className="font-semibold text-neutral-900">Next</p>
          <p>{result.next_action}</p>
          <p className="font-semibold text-neutral-900">Follow-ups</p>
          <ul className="list-disc pl-4">
            {(result.followups || []).map((f: any, idx: number) => (
              <li key={idx}>{`${f.when}: ${f.text}`}</li>
            ))}
          </ul>
          {result.reasoning?.client ? <p className="text-xs text-neutral-600">Why: {result.reasoning.client}</p> : null}
          {result.reasoning?.internal && explainMode && !presentationMode ? (
            <p className="text-[11px] text-neutral-500">Internal: {result.reasoning.internal}</p>
          ) : null}
        </div>
      ) : null}
      <div className="text-xs text-neutral-500">
        Need the full planner?{" "}
        <button className="underline" onClick={onClose}>
          Open follow-ups
        </button>
      </div>
    </div>
  );
}
