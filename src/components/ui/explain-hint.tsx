'use client';

import { useState } from "react";
import { explainContent } from "@/app/tanjia/explain/explainContent";
import { useViewModes } from "@/src/components/ui/view-modes";

type ExplainKey = keyof typeof explainContent;

export function ExplainHint({ target }: { target: ExplainKey }) {
  const { explainMode } = useViewModes();
  const [open, setOpen] = useState(false);

  if (!explainMode) return null;
  const content = explainContent[target];
  if (!content) return null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700 shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
        aria-label="Explain this"
      >
        ⓘ
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-neutral-200 bg-white p-3 text-xs text-neutral-700 shadow-lg">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">Why</p>
          <p className="mb-2">{content.why}</p>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">What it replaces</p>
          <p className="mb-2">{content.replaces}</p>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">Client version</p>
          <p>{content.clientVersion}</p>
        </div>
      ) : null}
    </div>
  );
}
