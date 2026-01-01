'use client';

import { useState } from "react";
import { Button } from "./button";

type SecondLookShareProps = {
  url: string;
  note?: string;
  showNote?: boolean;
};

export function SecondLookShare({ url, note, showNote = true }: SecondLookShareProps) {
  const [copied, setCopied] = useState<"url" | "note" | null>(null);

  const handleCopy = async (text: string, type: "url" | "note") => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // silent
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => handleCopy(url, "url")}
      >
        {copied === "url" ? "Copied!" : "Copy Second Look"}
      </Button>
      {showNote && note && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleCopy(note, "note")}
        >
          {copied === "note" ? "Copied!" : "Copy note"}
        </Button>
      )}
    </div>
  );
}
