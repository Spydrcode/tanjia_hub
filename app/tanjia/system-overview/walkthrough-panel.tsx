'use client';

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { useViewModes } from "@/src/components/ui/view-modes";

const bullets = [
  "This hub is how we run networking day to day - so follow-ups don't rely on memory.",
  "Scheduling stays inside the workspace: a quick 15-minute alignment or a 30-minute working session.",
  "When someone books, the system logs it and creates the right follow-ups automatically.",
  "Messages and notes become next steps - so nothing falls through the cracks.",
  "Operating Rhythm shows whether the system is working without exposing personal details.",
  "AI helps draft responses and next steps, but the relationship stays human.",
  "We only add complexity when growth earns it.",
];

export default function WalkthroughPanel() {
  const { explainMode, presentationMode } = useViewModes();
  const [open, setOpen] = useState(true);
  const script = useMemo(() => bullets.join("\n"), []);

  if (!explainMode || presentationMode) return null;

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">Internal</p>
            <p className="text-sm font-semibold text-neutral-900">60-second walkthrough</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigator.clipboard?.writeText(script)}
              aria-label="Copy script"
            >
              Copy script
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)} aria-label="Toggle walkthrough">
              {open ? "Hide" : "Show"}
            </Button>
          </div>
        </div>
        {open ? (
          <ul className="space-y-2 text-sm text-neutral-700">
            {bullets.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-400" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
