'use client';

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./button";

type CopyButtonProps = {
  text: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function CopyButton({ text, label = "Copy", variant = "secondary", size = "sm", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleCopy} className={className}>
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 mr-1.5" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          {label}
        </>
      )}
    </Button>
  );
}
