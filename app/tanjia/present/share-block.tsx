'use client';

import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";

type ShareBlockProps = {
  secondLookUrl: string;
  note: string;
};

export function ShareBlock({ secondLookUrl, note }: ShareBlockProps) {
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      // silent to avoid distraction
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <p className="text-sm font-semibold text-neutral-900">If helpful</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" className="self-start" onClick={() => handleCopy(secondLookUrl)}>
            Copy Second Look
          </Button>
          <Button variant="secondary" size="sm" className="self-start" onClick={() => handleCopy(note)}>
            Copy note
          </Button>
        </div>
        <a
          href={secondLookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-700"
        >
          {secondLookUrl}
        </a>
        <p className="text-sm leading-relaxed text-neutral-700">{note}</p>
      </CardContent>
    </Card>
  );
}
