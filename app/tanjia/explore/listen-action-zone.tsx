'use client';

import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { SecondLookShare } from "@/src/components/ui/second-look-share";

type ListenActionZoneProps = {
  question: string;
  secondLookUrl: string;
};

export function ListenActionZone({ question, secondLookUrl }: ListenActionZoneProps) {
  const secondLookNote = "This gives you a clearer way to see how growth has changed what you're carrying.";

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      // keep silent
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-600">Clarify</p>
        <p className="text-xs text-neutral-500">One calm move.</p>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3">
          <p className="text-xs font-medium text-neutral-600">Suggested question</p>
          <p className="text-sm leading-relaxed text-neutral-800">{question}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-1 self-start"
            onClick={() => handleCopy(question)}
          >
            Copy question
          </Button>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3">
          <p className="text-xs font-medium text-neutral-600">Second Look</p>
          <p className="text-sm leading-relaxed text-neutral-600">Use only when they ask what a next step could be.</p>
          <div className="mt-1">
            <SecondLookShare url={secondLookUrl} note={secondLookNote} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
