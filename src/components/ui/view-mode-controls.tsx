'use client';

import Link from "next/link";
import { useViewModes } from "@/src/components/ui/view-modes";
import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export function ViewModeControls({ showCopyLink }: { showCopyLink?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { explainMode, presentationMode, toggleExplain, togglePresentation, setPresentation } = useViewModes();

  const handleWalkthrough = useCallback(() => {
    if (explainMode) toggleExplain();
    setPresentation(true);
    if (pathname !== "/tanjia/system-overview") {
      router.push("/tanjia/system-overview");
    }
  }, [explainMode, pathname, router, setPresentation, toggleExplain]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleExplain}
        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400 ${
          explainMode ? "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200" : "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200"
        }`}
      >
        {explainMode ? "Explain: On" : "Explain"}
      </button>
      <button
        type="button"
        onClick={togglePresentation}
        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400 ${
          presentationMode ? "bg-amber-100 text-amber-900 ring-1 ring-amber-200" : "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200"
        }`}
      >
        {presentationMode ? "Presentation: On" : "Presentation"}
      </button>
      <button
        type="button"
        onClick={handleWalkthrough}
        title="Hides sensitive info and opens the client-safe overview."
        className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
      >
        Client view
      </button>
      {showCopyLink ? (
        <Link
          href="/tanjia/system-overview"
          className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
        >
          Client-safe link
        </Link>
      ) : null}
    </div>
  );
}
