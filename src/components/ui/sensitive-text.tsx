'use client';

import React from "react";
import { maskEmail, maskGeneric, maskNote, safeLeadLabel, useViewModes } from "@/src/components/ui/view-modes";

type MaskType = "lead" | "email" | "note" | "message";

type Props = {
  text?: string | null;
  id?: string | null;
  mask?: MaskType;
  className?: string;
};

export function SensitiveText({ text, id, mask = "lead", className }: Props) {
  const { shareMode, presentationMode } = useViewModes();

  // Use shareMode (or presentationMode for backward compatibility)
  const isHidden = shareMode || presentationMode;

  if (!isHidden) {
    return (
      <span data-sensitive="false" className={className}>
        {text}
      </span>
    );
  }

  let masked = text || "";
  if (mask === "email") masked = maskEmail(text);
  if (mask === "lead") masked = safeLeadLabel(id);
  if (mask === "note" || mask === "message") masked = maskNote(text);
  if (!masked) masked = maskGeneric(text);

  return (
    <span data-sensitive="true" className={className}>
      {masked}
    </span>
  );
}
