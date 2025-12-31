'use client';

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Textarea, Input } from "@/src/components/ui/input";
import { useViewModes } from "@/src/components/ui/view-modes";

type Props = { onClose: () => void };

type ReplyMode = "comment" | "dm" | "followup";

export function ReplyFocus({ onClose }: Props) {
  const { explainMode, presentationMode } = useViewModes();
  const [mode, setMode] = useState<ReplyMode>("comment");
  const [text, setText] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text?: string; reasoning?: { client?: string; internal?: string } } | null>(null);

  const endpoint =
    mode === "comment" ? "/api/tanjia/comment-reply" : mode === "dm" ? "/api/tanjia/dm-reply" : "/api/tanjia/followup-plan";

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: mode === "comment" ? "comment" : mode === "dm" ? "dm" : "followup",
          what_they_said: text,
          notes,
        }),
      });
      const data = await res.json();
      setResult({ text: data.text || data.next_action, reasoning: data.reasoning });
    } catch {
      setResult({ text: "Unable to generate right now.", reasoning: undefined });
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (result?.text) navigator.clipboard?.writeText(result.text);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["comment", "dm", "followup"] as ReplyMode[]).map((m) => (
          <Button key={m} size="sm" variant={mode === m ? "primary" : "secondary"} onClick={() => setMode(m)}>
            {m === "comment" ? "Comment" : m === "dm" ? "DM" : "Follow-up"}
          </Button>
        ))}
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste their post or message" className="min-h-[140px]" />
      <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" />
      <div className="flex gap-2">
        <Button size="sm" onClick={run} disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </Button>
        {result?.text ? (
          <Button size="sm" variant="secondary" onClick={copy}>
            Copy
          </Button>
        ) : null}
      </div>
      {result?.text ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-800">
          <p>{result.text}</p>
          {result.reasoning?.client ? <p className="mt-2 text-xs text-neutral-600">Why: {result.reasoning.client}</p> : null}
          {result.reasoning?.internal && explainMode && !presentationMode ? (
            <p className="text-[11px] text-neutral-500">Internal: {result.reasoning.internal}</p>
          ) : null}
        </div>
      ) : null}
      <div className="text-xs text-neutral-500">
        Need more?{" "}
        <button className="underline" onClick={onClose}>
          Open full helper
        </button>
      </div>
    </div>
  );
}
