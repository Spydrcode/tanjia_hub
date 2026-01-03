'use client';

import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { useViewModes } from "@/src/components/ui/view-modes";
import { GradientHeading } from "@/src/components/ui/gradient-heading";
import { motion } from "framer-motion";
import { PresentationTour } from "../components/presentation-tour";
import { stripInternalMeta } from "@/src/lib/agents/meta";

type Props = {
  secondLookUrl: string;
};

export default function PresentationClient({ secondLookUrl }: Props) {
  const { presentationMode, togglePresentation } = useViewModes();
  const safeSecondLook = stripInternalMeta({ url: secondLookUrl }).url;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-900 via-neutral-850 to-neutral-900 p-4 text-white shadow-sm"
        data-tour="client-view"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white">
              Presentation
            </span>
            <p className="text-sm text-neutral-100">{presentationMode ? "Mask on" : "Mask off"}</p>
          </div>
          <Button size="sm" variant={presentationMode ? "secondary" : "primary"} onClick={togglePresentation} className="bg-white text-neutral-900 hover:bg-neutral-100">
            {presentationMode ? "Disable mask" : "Enable mask"}
          </Button>
        </div>
      </div>

      <PresentationTour presentationMode={presentationMode} />

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card data-tour="what-2ndmynd" className="border-neutral-200/80 bg-white/95 shadow-sm">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">What is 2ndmynd</p>
              <p className="text-base leading-6 text-neutral-800">
                2ndmynd is a quiet outreach desk for founders and operators. We keep conversations calm, permission-based, and focused on the other person&apos;s pace instead of pushing for meetings.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card data-tour="what-second-look" className="border-neutral-200/80 bg-white/95 shadow-sm">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">What is a 2nd Look</p>
              <p className="text-base leading-6 text-neutral-800">
                A 2nd Look is a focused, human review of what someone is already sharing - site, posts, or pages they point to. It is not a report or audit; it is a brief, calm pass that spots what to double-check and offers to help only if it feels useful.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card data-tour="how-it-works" className="border-neutral-200/80 bg-white/95 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">How it works</p>
              <ol className="space-y-2 text-base leading-6 text-neutral-800">
                <li>1) Listen first: capture their post or note in the helper.</li>
                <li>2) Quiet research: orchestrator + web tools pull only public, relevant signals.</li>
                <li>3) Draft calmly: generate a short reply or DM and keep scheduling optional.</li>
              </ol>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          id="example"
          data-tour="example-output"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="md:col-span-2"
        >
          <Card className="border-neutral-200/80 bg-white/95 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Example output</p>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Comment</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-800">
                    Thanks for walking through the August pilot numbers and the new onboarding checkpoints. I can keep an eye on the signup and billing flow you mentioned and share a calm 2nd Look if useful. {safeSecondLook}
                  </p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">DM</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-800">
                    Loved how you reopened the rollout and left a 2-week feedback window. Want a short 2nd Look on the member signup copy? Happy to keep it light. {safeSecondLook}
                  </p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Follow-up</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-800">
                    Next: send a brief check-in tying back to their pilot note. Log: acknowledged their update and holding unless they want notes. Follow-ups: in 3 days, optional nudge for a calm review; in 7 days, close the loop and pause if no ask.
                  </p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 md:col-span-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">E-Myth examples</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-800">
                    Responsibility Map (sample): Owner covering outreach, follow-through, and delivery; next role to define is client success to prevent overload.
                    Working ON vs IN: Shift from personally fixing pages to deciding which journeys matter and sequencing them. Follow-Through System: 3d check-in, 7d close the loop; stall risk if no response after two calm nudges.
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-500">Why this: Client View drafts that mirror their note and keep offers optional.</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div data-tour="cta" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-2">
          <Card className="border-neutral-200/80 bg-white/95 shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Try it quietly</p>
                <p className="text-sm leading-6 text-neutral-800">Open the helper to generate a calm comment, DM, or follow-up with masking ready.</p>
              </div>
              <Button asChild size="sm" variant="primary">
                <a href="/tanjia/helper">Open helper</a>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div data-tour="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="md:col-span-2">
          <Card className="border-neutral-200/80 bg-white/95 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Timeline replay (Client View)</p>
              <div className="grid gap-3 sm:grid-cols-5">
                {[
                  { title: "Listen", desc: "Captured what you shared.", status: "done" },
                  { title: "Capture", desc: "Quietly saved without details.", status: "done" },
                  { title: "Insight", desc: "Prepared calm suggestions.", status: "done" },
                  { title: "Next step", desc: "Ready with a light follow-up.", status: "next" },
                  { title: "Follow-through", desc: "Keeps pace respectful.", status: "todo" },
                ].map((step, idx) => (
                  <motion.div key={step.title} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                    <div className="rounded-lg border border-neutral-200 bg-white/90 p-3 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">{step.title}</p>
                      <p className="text-sm text-neutral-800">{step.desc}</p>
                      <p className="text-[11px] text-neutral-500">{step.status === "done" ? "Done" : step.status === "next" ? "Next" : "Upcoming"}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
