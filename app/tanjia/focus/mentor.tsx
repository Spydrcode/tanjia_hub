'use client';

import { Button } from "@/src/components/ui/button";
import { useState } from "react";

const options = [
  {
    label: "Hold (no action)",
    why: "Respect their pace; no pressure.",
    message: "Happy to pause—tell me when you want a light check-in.",
  },
  {
    label: "Light check-in",
    why: "Acknowledge and leave room to reply when ready.",
    message: "Noticed your note—want me to keep an eye on it, or pause for now?",
  },
  {
    label: "Offer a 2nd Look",
    why: "Permission-based offer to help.",
    message: "If useful, I can share a quick 2nd Look. If not, all good.",
  },
];

type Props = { onClose: () => void };

export function MentorFocus({ onClose }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1200);
  };
  return (
    <div className="space-y-3">
      {options.map((opt) => (
        <div key={opt.label} className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900">{opt.label}</p>
            <Button size="sm" variant="secondary" onClick={() => copy(opt.message)}>
              {copied === opt.message ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-neutral-600">{opt.why}</p>
          <p className="mt-2 text-sm text-neutral-800">{opt.message}</p>
        </div>
      ))}
      <div className="text-xs text-neutral-500">
        Need more?{" "}
        <button className="underline" onClick={onClose}>
          Open full helper
        </button>
      </div>
    </div>
  );
}
