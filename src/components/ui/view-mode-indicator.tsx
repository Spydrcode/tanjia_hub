'use client';

import { useViewModes } from "@/src/components/ui/view-modes";

export function ViewModeIndicator() {
  const { explainMode, presentationMode } = useViewModes();
  if (!explainMode && !presentationMode) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-2 sm:pt-3">
      <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-3 py-2 text-xs text-neutral-800 shadow-lg backdrop-blur">
        {presentationMode ? (
          <>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-900">
              Presentation Mode: Sensitive info hidden
            </span>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText("/tanjia/system-overview")}
              className="rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
            >
              Copy client-safe link
            </button>
          </>
        ) : null}
        {explainMode ? (
          <span className="rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-indigo-900">
            Explain Mode
          </span>
        ) : null}
      </div>
    </div>
  );
}
