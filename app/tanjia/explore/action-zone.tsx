'use client';

import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";

type ActionZoneProps = {
  question: string;
  secondLookLink: string;
};

export function ActionZone({ question, secondLookLink }: ActionZoneProps) {
  const secondLookNote = "This gives you a clearer way to see how growth has changed what you're carrying.";

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      // keep silent to avoid distraction
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <p className="text-sm font-semibold text-neutral-900 uppercase tracking-[0.08em]">Clarify</p>
        <p className="text-xs text-neutral-600">One calm move.</p>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-600">Suggested clarifying question</p>
          <p className="text-sm leading-relaxed text-neutral-800">{question}</p>
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => handleCopy(question)}
          >
            Copy question
          </Button>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-600">Second Look</p>
          <p className="text-sm leading-relaxed text-neutral-700">Use only when they ask what a next step could be.</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => handleCopy(secondLookLink)}
            >
              Copy Second Look
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => handleCopy(secondLookNote)}
            >
              Copy note
            </Button>
          </div>
          <a
            href={secondLookLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-700"
          >
            {secondLookLink}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
