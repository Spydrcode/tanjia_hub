'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { GradientPill } from "@/src/components/ui/gradient-pill";
import { SensitiveText } from "@/src/components/ui/sensitive-text";
import { GradientHeading } from "@/src/components/ui/gradient-heading";
import { useViewModes } from "@/src/components/ui/view-modes";
import { CommandBar, type CommandAction } from "./components/command-bar";
import { FocusSheet } from "./components/focus-sheet";
import { CaptureFocus } from "./focus/capture";
import { ReplyFocus } from "./focus/reply";
import { FollowupFocus } from "./focus/followup";
import { MentorFocus } from "./focus/mentor";

export type MeetingSummary = {
  id: string;
  title: string;
  start_at: string;
  location_name?: string | null;
  status?: string | null;
};

export type FollowupSummary = {
  id: string;
  lead_id: string;
  note?: string | null;
  due_at?: string | null;
  lead_name?: string | null;
};

export type LeadSummary = {
  id: string;
  name: string;
  website?: string | null;
  status?: string | null;
  lastSnapshot?: string | null;
  nextFollowup?: string | null;
};

type DashboardClientProps = {
  description: string;
  nextMeeting?: MeetingSummary;
  followupsDue: FollowupSummary[];
  leads: LeadSummary[];
  siteUrl: string;
};

type PresetId = "prospecting" | "meeting" | "client" | "onsite";

type Preset = {
  id: PresetId;
  name: string;
  description: string;
  focusMode: boolean;
  presentationMode: boolean;
  density: "compact" | "comfortable";
  statusSurface: "expanded" | "compact" | "hidden";
  primaryTool: string;
};

const presets: Preset[] = [
  {
    id: "prospecting",
    name: "Prospecting",
    description: "Research, capture, and draft outreach fast.",
    focusMode: false,
    presentationMode: false,
    density: "compact",
    statusSurface: "hidden",
    primaryTool: "leads",
  },
  {
    id: "meeting",
    name: "Meeting",
    description: "Stay focused in-session with minimal UI.",
    focusMode: true,
    presentationMode: false,
    density: "compact",
    statusSurface: "hidden",
    primaryTool: "helper",
  },
  {
    id: "client",
    name: "Client 1:1",
    description: "Client View demo with masking and examples.",
    focusMode: true,
    presentationMode: true,
    density: "comfortable",
    statusSurface: "hidden",
    primaryTool: "presentation",
  },
  {
    id: "onsite",
    name: "On-site",
    description: "Large targets for quick capture on the go.",
    focusMode: true,
    presentationMode: false,
    density: "comfortable",
    statusSurface: "hidden",
    primaryTool: "leads",
  },
];

const focusKey = "tanjia_focus_mode";
const presetKey = "tanjia_preset";

export default function DashboardClient({ description, nextMeeting, followupsDue, leads, siteUrl }: DashboardClientProps) {
  const router = useRouter();
  const { presentationMode, setPresentation, explainMode, toggleExplain } = useViewModes();
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<Preset>(presets[0]);
  const [activeAction, setActiveAction] = useState<CommandAction | null>(null);

  useEffect(() => {
    const storedPresetId = typeof window !== "undefined" ? (window.localStorage.getItem(presetKey) as PresetId | null) : null;
    const initialPreset = presets.find((p) => p.id === storedPresetId) || presets[0];
    const storedFocus = typeof window !== "undefined" ? window.localStorage.getItem(focusKey) : null;
    setSelectedPreset(initialPreset);
    setFocusMode(storedFocus === "true" || initialPreset.focusMode);
    if (initialPreset.presentationMode) setPresentation(true);
  }, [setPresentation]);

  useEffect(() => {
    if (selectedPreset.id === "client" || selectedPreset.presentationMode) setPresentation(true);
  }, [selectedPreset, setPresentation]);

  const applyPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    setFocusMode(preset.focusMode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(presetKey, preset.id);
      window.localStorage.setItem(focusKey, preset.focusMode ? "true" : "false");
    }
    const shouldPresent = preset.id === "client" || preset.presentationMode;
    setPresentation(shouldPresent);
  };

  const handlePresent = () => {
    if (explainMode) toggleExplain();
    setPresentation(true);
    router.push("/tanjia/presentation");
  };

  const copyClientLink = async () => {
    try {
      await navigator.clipboard?.writeText(`${siteUrl}/tanjia/presentation`);
    } catch {
      // ignore
    }
  };

  const toggleFocusMode = () => {
    setFocusMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") window.localStorage.setItem(focusKey, next ? "true" : "false");
      return next;
    });
  };

  const currentPreset = selectedPreset;
  const nextFollowup = followupsDue[0];

  return (
    <div className="space-y-6">
      <motion.div
        className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-[#f8fafc] via-[#eef2ff] to-[#fef3f2] p-6 text-neutral-900 shadow-lg"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,0,0,0.05),transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(0,0,0,0.03),transparent_35%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-600">Tanjia</p>
            <GradientHeading leading="Command" trailing="dashboard" className="text-3xl font-semibold leading-tight" />
            {!presentationMode ? (
              <p className="max-w-2xl text-sm text-neutral-700">
                {currentPreset.description} — One intent at a time. Use the Command Bar below.
              </p>
            ) : (
              <p className="text-sm text-neutral-700">Client View is active. Traces remain hidden.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <GradientPill label={description} tone="neutral" />
              <GradientPill label={`Primary: ${currentPreset.primaryTool}`} tone="positive" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={focusMode ? "secondary" : "primary"} size="sm" onClick={toggleFocusMode}>
              {focusMode ? "Focus mode on" : "Focus mode"}
            </Button>
            <Button variant={presentationMode ? "secondary" : "primary"} size="sm" onClick={handlePresent}>
              Client View
            </Button>
            <Button variant="ghost" size="sm" onClick={copyClientLink}>
              Copy client link
            </Button>
          </div>
        </div>
      </motion.div>

      <Card className="border-none bg-white/80 shadow-md backdrop-blur">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-neutral-900">Situation presets</p>
              {presentationMode ? null : <p className="text-xs text-neutral-500">One dashboard, four situations.</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  variant={preset.id === currentPreset.id ? "primary" : "secondary"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <CommandBar preset={currentPreset.id} onSelect={(action) => setActiveAction(action)} />

      {currentPreset.id !== "client" ? (
        <Card className="border-neutral-200/80 bg-white/90 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900">Now</p>
              <GradientPill label={`${followupsDue.length} follow-ups`} tone={followupsDue.length ? "positive" : "neutral"} />
            </div>
            {currentPreset.id === "meeting" ? (
              <p className="text-xs text-neutral-600">Meeting mode is minimal. Use Command Bar actions to open one intent.</p>
            ) : (
              <>
                {nextMeeting ? (
                  <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-gradient-to-r from-neutral-50 via-white to-neutral-50 p-3">
                    <p className="text-sm font-semibold text-neutral-900">{nextMeeting.title}</p>
                    <p className="text-sm text-neutral-700">
                      {format(new Date(nextMeeting.start_at), "EEE, MMM d h:mma")} {nextMeeting.location_name ? `• ${nextMeeting.location_name}` : ""}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-700">No meetings queued.</p>
                )}
                <div className="rounded-xl border border-dashed border-neutral-200 p-3">
                  {nextFollowup ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-neutral-900">Next follow-up</p>
                      <p className="text-sm text-neutral-700">
                        <SensitiveText text={nextFollowup.lead_name || "Lead"} id={nextFollowup.lead_id} /> • {nextFollowup.due_at ? format(new Date(nextFollowup.due_at), "MMM d h:mma") : "soon"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-700">No follow-ups queued.</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-neutral-200/80 bg-white/90 shadow-sm">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <p className="text-sm font-semibold text-neutral-900">Client View CTA</p>
            <p className="text-sm text-neutral-700">Open presentation and keep masking on. One intent only.</p>
            <Button asChild size="sm">
              <Link href="/tanjia/presentation">Open presentation</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <FocusSheet
        open={activeAction === "capture"}
        title="Capture"
        description="Quick capture without leaving the meeting."
        onClose={() => setActiveAction(null)}
      >
        <CaptureFocus preset={currentPreset.id} onClose={() => setActiveAction(null)} />
      </FocusSheet>

      <FocusSheet
        open={activeAction === "reply"}
        title="Reply"
        description="Draft one calm comment, DM, or follow-up."
        onClose={() => setActiveAction(null)}
      >
        <ReplyFocus onClose={() => setActiveAction(null)} />
      </FocusSheet>

      <FocusSheet
        open={activeAction === "followup"}
        title="Follow-up plan"
        description="Light, permission-based follow-up."
        onClose={() => setActiveAction(null)}
      >
        <FollowupFocus onClose={() => setActiveAction(null)} />
      </FocusSheet>

      <FocusSheet
        open={activeAction === "mentor"}
        title="Mentor next steps"
        description="Three calm options; no pressure."
        onClose={() => setActiveAction(null)}
      >
        <MentorFocus onClose={() => setActiveAction(null)} />
      </FocusSheet>

      <FocusSheet
        open={activeAction === "present"}
        title="Present"
        description="Client View story view."
        onClose={() => setActiveAction(null)}
      >
        <div className="space-y-3">
          <p className="text-sm text-neutral-700">Open the presentation page to stay in Client View.</p>
          <Button asChild size="sm" onClick={() => setActiveAction(null)}>
            <Link href="/tanjia/presentation">Open presentation</Link>
          </Button>
        </div>
      </FocusSheet>
    </div>
  );
}
