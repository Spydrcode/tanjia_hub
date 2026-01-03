'use client';

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/src/components/ui/button";

type Step = {
  title: string;
  body: string;
  selector: string;
};

const steps: Step[] = [
  { title: "Client View", body: "Masking keeps names, traces, and internal notes hidden for clients.", selector: "[data-tour='client-view']" },
  { title: "What is 2ndmynd", body: "A quiet outreach desk — this card explains the posture and tone.", selector: "[data-tour='what-2ndmynd']" },
  { title: "What is a 2nd Look", body: "Grounded description to keep the offer human and concise.", selector: "[data-tour='what-second-look']" },
  { title: "How it works", body: "Three-step rundown for meetings or demos.", selector: "[data-tour='how-it-works']" },
  { title: "Example outputs", body: "Safe sample comment, DM, and follow-up — no real data shown.", selector: "[data-tour='example-output']" },
  { title: "Next step", body: "Invite them to open the presentation or share the link calmly.", selector: "[data-tour='cta']" },
];

const storageKey = "tanjia_presentation_tour_dismissed";

export function PresentationTour({ presentationMode }: { presentationMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);
  const [highlight, setHighlight] = useState<DOMRect | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    setDismissed(stored === "true");
    if (presentationMode && stored !== "true") setOpen(true);
  }, [presentationMode]);

  const current = useMemo(() => steps[index], [index]);

  useEffect(() => {
    if (!open || !current) {
      setHighlight(null);
      return;
    }
    const el = typeof document !== "undefined" ? (document.querySelector(current.selector) as HTMLElement | null) : null;
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlight(rect);
    } else {
      setHighlight(null);
    }
  }, [current, open]);

  const closeTour = () => {
    setOpen(false);
    setDismissed(true);
    if (typeof window !== "undefined") window.localStorage.setItem(storageKey, "true");
  };

  const restart = () => {
    setIndex(0);
    setOpen(true);
    setDismissed(false);
    if (typeof window !== "undefined") window.localStorage.removeItem(storageKey);
  };

  if (!presentationMode) return null;

  return (
    <>
      <div className="flex items-center justify-end">
        <Button size="sm" variant="secondary" onClick={() => (dismissed ? restart() : setOpen(true))}>
          {dismissed ? "Start tour" : "Tour"}
        </Button>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="tour-overlay"
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {highlight ? (
              <div
                className="pointer-events-none fixed rounded-xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] transition-all duration-200"
                style={{
                  top: Math.max(highlight.top - 8, 8),
                  left: Math.max(highlight.left - 8, 8),
                  width: highlight.width + 16,
                  height: highlight.height + 16,
                }}
              />
            ) : null}
            <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="pointer-events-auto rounded-xl border border-neutral-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">Presentation walkthrough</p>
                    <p className="text-sm font-semibold text-neutral-900">{current?.title}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={closeTour}>
                    Skip
                  </Button>
                </div>
                <p className="mt-2 text-sm text-neutral-700">{current?.body}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="text-xs text-neutral-500">
                    Step {index + 1} of {steps.length}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setIndex((i) => Math.max(i - 1, 0))} disabled={index === 0}>
                      Back
                    </Button>
                    {index < steps.length - 1 ? (
                      <Button size="sm" onClick={() => setIndex((i) => Math.min(i + 1, steps.length - 1))}>
                        Next
                      </Button>
                    ) : (
                      <Button size="sm" onClick={closeTour}>
                        Done
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <Button size="sm" variant="ghost" onClick={restart}>
                    Restart
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
