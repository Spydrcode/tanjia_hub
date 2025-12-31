'use client';

import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { useViewModes } from "@/src/components/ui/view-modes";

type Props = {
  secondLookUrl: string;
};

export default function PresentationClient({ secondLookUrl }: Props) {
  const { presentationMode, togglePresentation } = useViewModes();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-neutral-200 bg-gradient-to-r from-neutral-50 via-white to-neutral-50 px-4 py-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white">
            Presentation
          </span>
          <span className="text-sm text-neutral-600">{presentationMode ? "Mask on - client-safe" : "Mask off - internal view"}</span>
        </div>
        <Button size="sm" variant={presentationMode ? "secondary" : "default"} onClick={togglePresentation}>
          {presentationMode ? "Disable mask" : "Enable mask"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">What is 2ndmynd</p>
            <p className="text-base leading-6 text-neutral-800">
              2ndmynd is a quiet outreach desk for founders and operators. We keep conversations calm, permission-based, and focused on the other person&apos;s pace instead of pushing for meetings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">What is a 2nd Look</p>
            <p className="text-base leading-6 text-neutral-800">
              A 2nd Look is a focused, human review of what someone is already sharing - site, posts, or pages they point to. It is not a report or audit; it is a brief, calm pass that spots what to double-check and offers to help only if it feels useful.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">How it works</p>
            <ol className="space-y-2 text-base leading-6 text-neutral-800">
              <li>1) Listen first: capture their post or note in the helper.</li>
              <li>2) Quiet research: orchestrator + web tools pull only public, relevant signals.</li>
              <li>3) Draft calmly: generate a short reply or DM and keep scheduling optional.</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Example output</p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Comment</p>
                <p className="mt-2 text-sm leading-6 text-neutral-800">
                  Thanks for walking through the August pilot numbers and the new onboarding checkpoints. I can keep an eye on the signup and billing flow you mentioned and share a calm 2nd Look if useful. {secondLookUrl}
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">DM</p>
                <p className="mt-2 text-sm leading-6 text-neutral-800">
                  Loved how you reopened the rollout and left a 2-week feedback window. Want a short 2nd Look on the member signup copy? Happy to keep it light. {secondLookUrl}
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Follow-up</p>
                <p className="mt-2 text-sm leading-6 text-neutral-800">
                  Next: send a brief check-in tying back to their pilot note. Log: acknowledged their update and holding unless they want notes. Follow-ups: in 3 days, optional nudge for a calm review; in 7 days, close the loop and pause if no ask.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Try it quietly</p>
              <p className="text-sm leading-6 text-neutral-800">Open the helper to generate a calm comment, DM, or follow-up with masking ready.</p>
            </div>
            <Button asChild size="sm" variant="default">
              <a href="/tanjia/helper">Open helper</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
