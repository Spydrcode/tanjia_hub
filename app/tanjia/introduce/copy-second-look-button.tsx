'use client';

import { Button } from "@/src/components/ui/button";

type CopySecondLookButtonProps = {
  url: string;
};

export function CopySecondLookButton({ url }: CopySecondLookButtonProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(url);
    } catch {
      // keep silent to avoid distraction
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      className="self-start"
      onClick={handleCopy}
    >
      Copy Second Look
    </Button>
  );
}
