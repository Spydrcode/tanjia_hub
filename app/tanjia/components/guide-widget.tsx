'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { useViewModes } from "@/src/components/ui/view-modes";

type StatusItem = { id: string; label: string; status: "healthy" | "degraded" | "offline" };

type PresetId = "prospecting" | "meeting" | "client" | "onsite";

const presetKey = "tanjia_preset";

const primaryByPreset: Record<PresetId, string> = {
  prospecting: "Add lead and draft a calm reply",
  meeting: "Start capture quietly",
  client: "Open presentation",
  onsite: "Add lead fast",
};

const quickLinks = [
  { label: "Leads", href: "/tanjia/leads" },
  { label: "Helper", href: "/tanjia/helper" },
  { label: "Follow-ups", href: "/tanjia/followups" },
  { label: "Presentation", href: "/tanjia/presentation" },
];

export function GuideWidget() {
  const { presentationMode, explainMode } = useViewModes();
  const [open, setOpen] = useState(false);
  const [forceShow, setForceShow] = useState(false);
  const [preset, setPreset] = useState<PresetId>("prospecting");
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [followupsDue, setFollowupsDue] = useState<number>(0);
  const [hasMeeting, setHasMeeting] = useState<boolean>(false);

  useEffect(() => {
    const storedPreset = (typeof window !== "undefined" && window.localStorage.getItem(presetKey)) as PresetId | null;
    if (storedPreset) setPreset(storedPreset);

    const followupsRaw = typeof window !== "undefined" ? window.sessionStorage.getItem("tanjia_widget_followups") : null;
    if (followupsRaw) {
      try {
        const parsed = JSON.parse(followupsRaw);
        setFollowupsDue(Number(parsed.count) || 0);
      } catch {
        setFollowupsDue(0);
      }
    }
    const meetingRaw = typeof window !== "undefined" ? window.sessionStorage.getItem("tanjia_widget_next_meeting") : null;
    if (meetingRaw) {
      try {
        const parsed = JSON.parse(meetingRaw);
        setHasMeeting(Boolean(parsed.id));
      } catch {
        setHasMeeting(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/tanjia/tool-status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: any) => {
        if (!active) return;
        const items = Array.isArray(data?.items) ? (data.items as StatusItem[]) : [];
        setStatuses(items);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  const degraded = useMemo(() => statuses.filter((s) => s.status !== "healthy"), [statuses]);

  const suggestedSteps = useMemo(() => {
    if (preset === "prospecting")
      return [
        { label: "Paste a post into Helper", href: "/tanjia/helper?channel=comment" },
        { label: "Capture lead draft", href: "/tanjia/leads/new" },
        { label: "Check tool status", href: "/tanjia/tools/system" },
      ];
    if (preset === "meeting")
      return [
        { label: "Start meeting capture", href: hasMeeting ? "/tanjia/meetings" : "/tanjia/meetings/new" },
        { label: "Add quick follow-up", href: "/tanjia/followups" },
        { label: "Open helper", href: "/tanjia/helper" },
      ];
    if (preset === "client")
      return [
        { label: "Open presentation", href: "/tanjia/presentation" },
        { label: "Show example output", href: "/tanjia/presentation#example" },
        { label: "Copy client-safe link", href: "/tanjia/presentation" },
      ];
    return [
      { label: "Add lead fast", href: "/tanjia/leads/new" },
      { label: "Capture onsite note", href: "/tanjia/meetings" },
      { label: "Plan follow-up", href: "/tanjia/followups" },
    ];
  }, [preset, hasMeeting]);

  const showWidget = !presentationMode || forceShow;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {presentationMode && !forceShow ? (
        <Button
          variant="secondary"
          size="sm"
          className="pointer-events-auto shadow-sm"
          onClick={() => {
            setForceShow(true);
            setOpen(true);
          }}
        >
          Show guide (client-safe)
        </Button>
      ) : null}

      <AnimatePresence>
        {showWidget ? (
          <>
            <motion.div
              key="guide-toggle"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-auto"
            >
              <Button variant="primary" size="sm" className="shadow-lg" onClick={() => setOpen((v) => !v)}>
                Guide
              </Button>
            </motion.div>

            <AnimatePresence>
              {open ? (
                <motion.div
                  key="guide-sheet"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.2 }}
                  className="pointer-events-auto w-80"
                >
                  <Card className="border-neutral-200/80 bg-white/95 p-4 shadow-xl backdrop-blur">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">Guide</p>
                        <p className="text-sm font-semibold text-neutral-900">You&apos;re in: {preset}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                        Close
                      </Button>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-neutral-700">
                      <div className="rounded-lg bg-neutral-50 p-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Primary action</p>
                        <p className="text-sm text-neutral-900">{primaryByPreset[preset]}</p>
                        {followupsDue > 0 ? (
                          <p className="text-xs text-neutral-600">Follow-ups due: {followupsDue} today</p>
                        ) : null}
                        {degraded.length ? (
                          <p className="text-xs text-red-600">Some tools degraded: {degraded.map((d) => d.label).join(", ")}</p>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Suggested next steps</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedSteps.map((step) => (
                            <Button key={step.label} asChild size="sm" variant="secondary">
                              <Link href={step.href}>{step.label}</Link>
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Quick links</p>
                        <div className="flex flex-wrap gap-2">
                          {quickLinks.map((link) => (
                            <Button key={link.href} asChild size="sm" variant="ghost">
                              <Link href={link.href}>{link.label}</Link>
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Mentor options</p>
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-700">
                          <p>• Hold: Pause to respect their pace.</p>
                          <p>• Light check-in: “Saw your note—want me to keep an eye on it?”</p>
                          <p>• Offer 2nd Look: Calm offer only if welcome.</p>
                        </div>
                      </div>
                      {explainMode && !presentationMode ? (
                        <div className="rounded-lg border border-dashed border-neutral-200 p-2 text-xs text-neutral-600">
                          Proof-of-work available in explain mode only. No traces shown here to keep it clean.
                        </div>
                      ) : null}
                    </div>
                  </Card>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
