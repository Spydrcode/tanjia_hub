"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Check, Copy } from "lucide-react";

const noteText = `What we talked about:
- 

Follow up:
- `;

export function CopyNoteButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(noteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5 text-xs"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy note template
        </>
      )}
    </Button>
  );
}
