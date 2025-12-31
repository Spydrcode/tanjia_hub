
'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { GradientPill } from "@/src/components/ui/gradient-pill";
import { SensitiveText } from "@/src/components/ui/sensitive-text";
import { Badge } from "@/src/components/ui/badge";
import { Textarea } from "@/src/components/ui/input";
import { useViewModes } from "@/src/components/ui/view-modes";
import { GradientHeading } from "@/src/components/ui/gradient-heading";
import { QuickBar, type QuickAction } from "./components/quick-bar";
import { ToolCard } from "./components/tool-card";

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

type StatusItem = { id: string; label: string; status: "healthy" | "degraded" | "offline"; detail?: string };

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
  quickBarOrder: string[];
  agentPack: string[];
};

const presets: Preset[] = [
  {
    id: "prospecting",
    name: "Prospecting",
    description: "Research, capture, and draft outreach fast.",
    focusMode: false,
    presentationMode: false,
    density: "compact",
    statusSurface: "expanded",
    primaryTool: "leads",
    quickBarOrder: ["add-lead", "open-leads", "open-helper", "run-intel", "open-followups", "open-meetings", "open-scheduler"],
    agentPack: ["scan-post", "draft-comment", "draft-dm", "run-intel", "role-map", "on-vs-in"],
  },
  {
    id: "meeting",
    name: "Meeting",
    description: "Stay focused in-session with minimal UI.",
    focusMode: true,
    presentationMode: false,
    density: "compact",
    statusSurface: "compact",
    primaryTool: "helper",
    quickBarOrder: ["start-capture", "open-helper", "add-followup", "add-lead", "open-followups"],
    agentPack: ["capture-note", "draft-reply", "plan-followup", "mark-next", "follow-through"],
  },
  {
    id: "client",
    name: "Client 1:1",
    description: "Client-safe demo with masking and examples.",
    focusMode: true,
    presentationMode: true,
    density: "comfortable",
    statusSurface: "hidden",
    primaryTool: "presentation",
    quickBarOrder: ["open-presentation", "copy-client-link", "show-example", "open-helper"],
    agentPack: ["open-presentation", "show-example", "copy-client-link", "demo-summary"],
  },
  {
    id: "onsite",
    name: "On-site",
    description: "Large targets for quick capture on the go.",
    focusMode: true,
    presentationMode: false,
    density: "comfortable",
    statusSurface: "compact",
    primaryTool: "leads",
    quickBarOrder: ["add-lead", "capture-note", "add-followup", "open-helper"],
    agentPack: ["add-lead-fast", "capture-onsite", "plan-followup", "next-step", "onsite-role-map"],
  },
];

const focusKey = "tanjia_focus_mode";
const presetKey = "tanjia_preset";

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 } }),
};

export default function DashboardClient({ description, nextMeeting, followupsDue, leads, siteUrl }: DashboardClientProps) {
  const router = useRouter();
  const { presentationMode, setPresentation, explainMode, toggleExplain } = useViewModes();
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<Preset>(presets[0]);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [statusUpdated, setStatusUpdated] = useState<string | null>(null);
  const [traceInfo, setTraceInfo] = useState<{ id?: string | null; tools?: string[]; durationMs?: number } | null>(null);
  const [exampleOutput] = useState<string>(
    "Appreciate the way you reopened the member rollout - calling out the August pilot and the feedback window. I can give a quiet 2nd Look on signup and billing if useful.",
  );
  const [emythDrawer, setEmythDrawer] = useState<{ open: boolean; task?: "role_map" | "on_vs_in" | "follow_through"; title?: string }>({ open: false });
  const [emythInput, setEmythInput] = useState("");
  const [emythResult, setEmythResult] = useState<any>(null);
  const [emythLoading, setEmythLoading] = useState(false);
  const [emythProof, setEmythProof] = useState<{ traceId?: string; toolsUsed?: string[]; durationMs?: number } | null>(null);
  const [showEmythInfo, setShowEmythInfo] = useState(false);

  useEffect(() => {
    const storedPresetId = typeof window !== "undefined" ? (window.localStorage.getItem(presetKey) as PresetId | null) : null;
    const initialPreset = presets.find((p) => p.id === storedPresetId) || presets[0];
    const storedFocus = typeof window !== "undefined" ? window.localStorage.getItem(focusKey) : null;
    setSelectedPreset(initialPreset);
    setFocusMode(storedFocus === "true" || initialPreset.focusMode);
    if (initialPreset.presentationMode) setPresentation(true);
    let active = true;
    fetch("/api/tanjia/tool-status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: any) => {
        if (!active) return;
        setStatuses(Array.isArray(data?.items) ? data.items : []);
        setStatusUpdated(typeof data?.updatedAt === "string" ? data.updatedAt : null);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, [setPresentation]);

  useEffect(() => {
    if (selectedPreset.id === "client" || selectedPreset.presentationMode) setPresentation(true);
  }, [selectedPreset, setPresentation]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("tanjia_widget_followups", JSON.stringify({ count: followupsDue.length }));
      window.sessionStorage.setItem("tanjia_widget_next_meeting", JSON.stringify(nextMeeting ? { id: nextMeeting.id } : {}));
    }
  }, [followupsDue, nextMeeting]);

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
  const showInternal = !presentationMode;
  const nextFollowup = followupsDue[0];

  const statusFiltered = useMemo(() => {
    if (currentPreset.statusSurface === "hidden") return [];
    if (currentPreset.statusSurface === "compact") {
      return statuses.filter((s) => ["db", "comment-reply", "dm-reply", "followup-plan"].includes(s.id));
    }
    return statuses;
  }, [currentPreset.statusSurface, statuses]);

  const hasCriticalIssue = statusFiltered.some((s) => s.status !== "healthy");

  const statusChips = useMemo(
    () =>
      statusFiltered.map((item) => {
        const tone = item.status === "healthy" ? "[OK]" : item.status === "degraded" ? "[Check]" : "[Down]";
        return (
          <button
            key={item.id}
            onClick={() => router.push(`/tanjia/tools/system#${item.id}`)}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm transition hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
          >
            <span aria-hidden>{tone}</span>
            <span>{item.label}</span>
            {currentPreset.statusSurface === "expanded" && item.detail ? <span className="text-neutral-500">{item.detail}</span> : null}
          </button>
        );
      }),
    [currentPreset.statusSurface, router, statusFiltered],
  );
  const toolCards = [
    { title: "Reply helper", desc: "Draft a comment or DM in seconds.", href: "/tanjia/helper", icon: "helper" },
    { title: "Follow-ups", desc: "See what is due and log next steps.", href: "/tanjia/followups", icon: "followups" },
    { title: "Leads", desc: "Capture, notes, and quiet context.", href: "/tanjia/leads", icon: "leads" },
    { title: "Meetings", desc: "Prep, capture, and recap calmly.", href: "/tanjia/meetings", icon: "meetings" },
    { title: "Scheduler", desc: "Send a time link only if asked.", href: "/tanjia/scheduler", icon: "scheduler" },
    { title: "System", desc: "Tool health and traces.", href: "/tanjia/tools/system", icon: "system" },
    { title: "E-Myth", desc: "Primary Aim, role map, follow-through.", href: "/tanjia/tools/emyth", icon: "emyth" },
    { title: "Presentation", desc: "Client-safe view of 2ndmynd.", href: "/tanjia/presentation", icon: "presentation" },
  ];

  const quickActionsMap: Record<string, { label: string; href?: string; onClick?: () => void }> = {
    "add-lead": { label: "Add lead", href: "/tanjia/leads/new" },
    "open-leads": { label: "Open leads", href: "/tanjia/leads" },
    "open-helper": { label: "Open helper", href: "/tanjia/helper" },
    "run-intel": { label: "Run intelligence", onClick: () => router.push("/tanjia/leads") },
    "open-followups": { label: "Open follow-ups", href: "/tanjia/followups" },
    "open-meetings": { label: "Open meetings", href: "/tanjia/meetings" },
    "open-scheduler": { label: "Open scheduler", href: "/tanjia/scheduler" },
    "start-capture": { label: "Start capture", href: nextMeeting ? `/tanjia/meetings/${nextMeeting.id}/start` : "/tanjia/meetings/new" },
    "add-followup": { label: "Add follow-up", href: "/tanjia/followups" },
    "open-presentation": { label: "Open presentation", href: "/tanjia/presentation" },
    "copy-client-link": { label: "Copy client link", onClick: copyClientLink },
    "show-example": { label: "Show example", onClick: () => setTraceInfo({ ...traceInfo }) },
    "capture-note": { label: "Capture note", href: "/tanjia/meetings" },
    "capture-onsite": { label: "Capture onsite", href: "/tanjia/meetings" },
    "add-lead-fast": { label: "Add lead fast", href: "/tanjia/leads/new" },
    "next-step": { label: "Next step message", href: "/tanjia/helper" },
  };

  const agentActions: Record<
    string,
    { label: string; description: string; run: () => Promise<void> | void; internalOnly?: boolean; task?: "role_map" | "on_vs_in" | "follow_through" }
  > = {
    "scan-post": {
      label: "Scan Post -> Capture Lead",
      description: "Extract key details and prefill a lead.",
      run: () => router.push("/tanjia/leads/new"),
    },
    "draft-comment": {
      label: "Draft Public Comment",
      description: "Calls comment-reply for one comment.",
      run: () => router.push("/tanjia/helper?channel=comment"),
    },
    "draft-dm": {
      label: "Draft DM",
      description: "Calls dm-reply for one DM.",
      run: () => router.push("/tanjia/helper?channel=dm"),
    },
    "run-intel": {
      label: "Run Intelligence",
      description: "Use orchestrator on selected lead.",
      run: () => router.push("/tanjia/leads"),
    },
    "role-map": {
      label: "Role Map (E-Myth)",
      description: "Map roles and overloads.",
      run: () => setEmythDrawer({ open: true, task: "role_map", title: "Role Map (E-Myth)" }),
      task: "role_map",
    },
    "on-vs-in": {
      label: "On vs In Shift",
      description: "Perspective shift for owners.",
      run: () => setEmythDrawer({ open: true, task: "on_vs_in", title: "On vs In Shift" }),
      task: "on_vs_in",
    },
    "capture-note": {
      label: "Capture Note",
      description: "Quick note inside meeting.",
      run: () => router.push("/tanjia/meetings"),
    },
    "draft-reply": {
      label: "Draft Reply",
      description: "Generate comment/DM in helper.",
      run: () => router.push("/tanjia/helper"),
    },
    "plan-followup": {
      label: "Plan Follow-up",
      description: "Structured plan via followup-plan.",
      run: () => router.push("/tanjia/helper?channel=followup"),
    },
    "follow-through": {
      label: "Follow-Through Plan",
      description: "Run follow-through intelligence.",
      run: () => setEmythDrawer({ open: true, task: "follow_through", title: "Follow-Through Plan" }),
      task: "follow_through",
    },
    "mark-next": {
      label: "Mark Next Action",
      description: "Log a quick next step.",
      run: () => router.push("/tanjia/followups"),
    },
    "open-presentation": {
      label: "Open Presentation",
      description: "Client-safe view.",
      run: () => router.push("/tanjia/presentation"),
    },
    "show-example": {
      label: "Show Example Output",
      description: "Client-safe mock output.",
      run: () => setTraceInfo({ id: "demo", tools: [], durationMs: 0 }),
    },
    "copy-client-link": {
      label: "Copy Client-safe Link",
      description: "One-click copy.",
      run: () => copyClientLink(),
    },
    "demo-summary": {
      label: "2nd Look Summary",
      description: "Sanitized demo summary only.",
      run: () => setTraceInfo({ id: "demo-summary", tools: ["demo"], durationMs: 1200 }),
      internalOnly: true,
    },
    "add-lead-fast": {
      label: "Add Lead Fast",
      description: "Large tap target capture.",
      run: () => router.push("/tanjia/leads/new"),
    },
    "capture-onsite": {
      label: "Capture Onsite Notes",
      description: "Quick note flow.",
      run: () => router.push("/tanjia/meetings"),
    },
    "onsite-role-map": {
      label: "On-site Role Map",
      description: "Roles from onsite notes.",
      run: () => setEmythDrawer({ open: true, task: "role_map", title: "On-site Role Map" }),
      task: "role_map",
    },
    "next-step": {
      label: "Create Next Step Message",
      description: "Draft DM-style follow-up.",
      run: () => router.push("/tanjia/helper?channel=dm"),
    },
  };
  const handleEmythRun = async () => {
    if (!emythDrawer.task) return;
    setEmythLoading(true);
    setEmythResult(null);
    setEmythProof(null);
    try {
      const res = await fetch("/api/tanjia/emyth/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: emythDrawer.task,
          leadId: null,
          pastedText: emythInput,
          notes: emythInput,
          mode: currentPreset.id,
          deep: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Run failed");
      setEmythResult(data.result);
      setEmythProof({ traceId: data.traceId, toolsUsed: data.toolsUsed, durationMs: data.durationMs });
    } catch (err) {
      setEmythResult({ error: "Unable to run right now." });
    } finally {
      setEmythLoading(false);
    }
  };

  const quickActions: QuickAction[] = currentPreset.quickBarOrder
    .map((id) => (quickActionsMap[id] ? { id, ...quickActionsMap[id] } : null))
    .filter(Boolean) as QuickAction[];

  return (
    <div className="space-y-6">
      <motion.div
        className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-6 text-white shadow-lg"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.1),transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.1),transparent_35%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-200">Tanjia</p>
            <GradientHeading leading="Command" trailing="dashboard" className="text-3xl font-semibold leading-tight" />
            {!presentationMode ? (
              <p className="max-w-2xl text-sm text-neutral-100">
                {currentPreset.description} — Success in 10 seconds: jump to the primary action below.
              </p>
            ) : (
              <p className="text-sm text-neutral-100">Client-safe view is active. Traces remain hidden.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <GradientPill label={description} tone="neutral" />
              <GradientPill label={`Primary: ${currentPreset.primaryTool}`} tone="positive" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={focusMode ? "secondary" : "primary"} size="sm" onClick={toggleFocusMode} className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              {focusMode ? "Focus mode on" : "Focus mode"}
            </Button>
            <Button variant={presentationMode ? "secondary" : "primary"} size="sm" onClick={handlePresent} className="border-white/20 bg-white text-neutral-900 hover:bg-neutral-100">
              Client-safe view
            </Button>
            <Button variant="ghost" size="sm" onClick={copyClientLink} className="text-white hover:bg-white/10">
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
                  className={clsx(
                    "rounded-full",
                    preset.id === currentPreset.id ? "shadow-md shadow-neutral-200" : "border-neutral-200 bg-white",
                  )}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0} className="lg:col-span-2">
          <Card className="border-neutral-200/80 bg-white/90 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-900">Now</p>
                <GradientPill label={`${followupsDue.length} follow-ups`} tone={followupsDue.length ? "positive" : "neutral"} />
              </div>
              {nextMeeting ? (
                <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-gradient-to-r from-neutral-50 via-white to-neutral-50 p-3">
                  <p className="text-sm font-semibold text-neutral-900">{nextMeeting.title}</p>
                  <p className="text-sm text-neutral-700">
                    {format(new Date(nextMeeting.start_at), "EEE, MMM d h:mma")} {nextMeeting.location_name ? `• ${nextMeeting.location_name}` : ""}
                  </p>
                  {!focusMode ? <p className="text-xs text-neutral-600">Stay present; start capture quietly if helpful.</p> : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button asChild size={focusMode ? "lg" : "sm"}>
                      <Link href={`/tanjia/meetings/${nextMeeting.id}/start`}>Start capture</Link>
                    </Button>
                    <Button asChild size={focusMode ? "lg" : "sm"} variant="secondary">
                      <Link href="/tanjia/meetings">Open meetings</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-3">
                  <p className="text-sm font-semibold text-neutral-900">No meeting scheduled</p>
                  {!focusMode ? <p className="text-sm text-neutral-700">Create one only if it helps the relationship.</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size={focusMode ? "lg" : "sm"}>
                      <Link href="/tanjia/meetings/new">Create meeting</Link>
                    </Button>
                    <Button asChild size={focusMode ? "lg" : "sm"} variant="secondary">
                      <Link href="/tanjia/scheduler">Open scheduler</Link>
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-dashed border-neutral-200 p-3">
                {nextFollowup ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-neutral-900">Next follow-up</p>
                    <p className="text-sm text-neutral-700">
                      <SensitiveText text={nextFollowup.lead_name || "Lead"} id={nextFollowup.lead_id} /> • {nextFollowup.due_at ? format(new Date(nextFollowup.due_at), "MMM d h:mma") : "soon"}
                    </p>
                    {!focusMode ? (
                      <p className="text-sm text-neutral-700">
                        <SensitiveText text={nextFollowup.note || "Follow up"} mask="note" />
                      </p>
                    ) : null}
                    <div className="pt-1">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/tanjia/leads/${nextFollowup.lead_id}`}>Open lead</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-700">No follow-ups queued.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0.1}>
          <Card className="border-neutral-200/80 bg-white/90 shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-900">Meeting quick bar</p>
                {!focusMode ? <p className="text-xs text-neutral-500">Two clicks max</p> : null}
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button asChild size={focusMode ? "lg" : "sm"}>
                  <Link href={nextMeeting ? `/tanjia/meetings/${nextMeeting.id}/start` : "/tanjia/meetings/new"}>
                    {nextMeeting ? "Start capture" : "Create meeting"}
                  </Link>
                </Button>
                <Button asChild size={focusMode ? "lg" : "sm"} variant="secondary">
                  <Link href="/tanjia/helper">Open helper</Link>
                </Button>
                <Button asChild size={focusMode ? "lg" : "sm"} variant="secondary">
                  <Link href="/tanjia/leads/new">Add lead</Link>
                </Button>
                <Button asChild size={focusMode ? "lg" : "sm"} variant="secondary">
                  <Link href="/tanjia/followups">Add follow-up</Link>
                </Button>
                <Button size={focusMode ? "lg" : "sm"} variant="ghost" onClick={copyClientLink}>
                  Copy client-safe link
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="border-neutral-200/80 bg-white/90 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-neutral-900">Quick bar</p>
            {!focusMode ? <p className="text-xs text-neutral-500">Primary actions for this situation</p> : null}
          </div>
          <QuickBar actions={quickActions} density={currentPreset.density} focusMode={focusMode} />
        </CardContent>
      </Card>

      <Card className="border-neutral-200/80 bg-white/90 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-neutral-900">Agent actions</p>
            {!focusMode ? <p className="text-xs text-neutral-500">One-click packs per situation</p> : null}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {currentPreset.agentPack
              .map((id) => agentActions[id])
              .filter((a) => a && (showInternal || !a.internalOnly))
              .map((action, idx) => {
                const hideLive = !(explainMode && !presentationMode);
                const isEmyth = Boolean(action.task);
                if (hideLive && isEmyth) return null;
                return (
                  <motion.div
                    key={action.label}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={idx * 0.05}
                    className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white/90 p-3 shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{action.label}</p>
                      {!focusMode ? <p className="text-xs text-neutral-600">{action.description}</p> : null}
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => action.run()} disabled={hideLive && isEmyth}>
                      Go
                    </Button>
                  </motion.div>
                );
              })}
          </div>
        </CardContent>
      </Card>
      <Card className="border-neutral-200/80 bg-white/90 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-neutral-900">Tools</p>
            {!focusMode ? <p className="text-xs text-neutral-500">Outcome-first shortcuts</p> : null}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {toolCards.map((card, idx) => (
              <motion.div key={card.href} variants={cardVariants} initial="hidden" animate="visible" custom={idx * 0.05}>
                <ToolCard
                  title={card.title}
                  description={card.desc}
                  href={card.href}
                  icon={card.icon as any}
                  primary={card.title.toLowerCase().includes(currentPreset.primaryTool)}
                  statusChip={card.href.includes(currentPreset.primaryTool) ? "Ready" : undefined}
                />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {currentPreset.statusSurface !== "hidden" ? (
        <Card className="border-neutral-200/80 bg-white/90 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-neutral-900">Tool status</p>
              {statusUpdated && !focusMode && currentPreset.statusSurface === "expanded" ? (
                <p className="text-xs text-neutral-500">Updated {format(new Date(statusUpdated), "MMM d, h:mma")}</p>
              ) : null}
            </div>
            {hasCriticalIssue ? (
              <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">Some tools unavailable. Open System for details.</div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">{statusChips.length ? statusChips : <p className="text-sm text-neutral-600">Loading...</p>}</div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-neutral-200/80 bg-white/90 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-neutral-900">Timeline replay</p>
            <p className="text-xs text-neutral-500">Client-safe view of progress</p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-5">
            {[
              { key: "listen", title: "Listen", desc: "Captured what was shared.", done: true },
              { key: "capture", title: "Capture", desc: nextMeeting ? "Meeting set; capture ready." : "Meeting optional.", done: Boolean(nextMeeting) },
              { key: "insight", title: "Insight", desc: "Calm reply/plan generated.", done: Boolean(traceInfo) },
              { key: "next", title: "Next step", desc: nextFollowup ? "Follow-up queued." : "Not yet.", done: Boolean(nextFollowup) },
              { key: "loop", title: "Follow-through", desc: nextFollowup ? "Due soon." : "Pending", done: false },
            ].map((step, idx) => (
              <motion.div key={step.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <div className="rounded-lg border border-neutral-200 bg-white/90 p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">{step.title}</p>
                  <p className="text-sm text-neutral-800">{step.desc}</p>
                  <p className="text-[11px] text-neutral-500">{step.done ? "Done" : step.key === "next" ? "Next" : "Not yet"}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-neutral-200/80 bg-white/90 shadow-sm lg:col-span-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
            <p className="text-sm font-semibold text-neutral-900">Presentation</p>
            {!focusMode ? (
              <p className="text-sm text-neutral-700">Client-safe walkthrough of 2ndmynd and 2nd Look. Masks sensitive info automatically.</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/tanjia/presentation">Open presentation</Link>
              </Button>
              <Button size="sm" variant="secondary" onClick={copyClientLink}>
                Copy link
              </Button>
            </div>
            <p className="text-xs text-neutral-600">Reasoning (client-safe): Shows what a 2nd Look is and keeps masking on by default.</p>
            {showInternal ? <p className="text-[11px] text-neutral-500">Internal: Masks traces/PII; examples stay generic for live demos.</p> : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-neutral-200/80 bg-white/90 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-neutral-900">Mentor next steps</p>
            <p className="text-xs text-neutral-500">{currentPreset.id === "meeting" ? "Collapsed in meeting view" : "Calm options"}</p>
          </div>
          <div className={`mt-3 grid gap-3 ${currentPreset.id === "meeting" ? "sm:grid-cols-1" : "sm:grid-cols-3"}`}>
            {[
              { label: "Hold (no action)", why: "Respect their pace and keep space open.", message: "Happy to pause until you want a light check-in." },
              { label: "Light check-in", why: "Acknowledges their update without pressure.", message: "Saw your note—want me to keep an eye on it, or pause?" },
              { label: "Offer a 2nd Look", why: "Permission-based support when ready.", message: "If useful, I can share a quick 2nd Look. If not, all good." },
            ].map((opt, idx) => (
              <motion.div
                key={opt.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-lg border border-neutral-200 bg-white/90 p-3 shadow-sm"
              >
                <p className="text-sm font-semibold text-neutral-900">{opt.label}</p>
                <p className="text-xs text-neutral-600">{opt.why}</p>
                <p className="mt-1 text-sm text-neutral-800">{opt.message}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {currentPreset.id === "client" && presentationMode ? (
        <Card className="border-neutral-200/80 bg-white/90 shadow-sm">
          <CardContent className="space-y-2 p-4 sm:p-5">
            <p className="text-sm font-semibold text-neutral-900">Client-safe examples</p>
            <p className="text-sm text-neutral-700">
              Responsibility Map: Owner handling outreach, delivery, and follow-through; next role is client success. On vs In: Move from fixing pages to deciding what journeys matter. Follow-Through: 3d check-in, 7d close loop; stall risk if silent.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {(currentPreset.id === "meeting" || currentPreset.id === "client") && (
        <Card className="border-neutral-200/80 bg-white/90 shadow-sm">
          <CardContent className="flex flex-wrap items-center gap-2 p-4 sm:p-5">
            <p className="text-sm font-semibold text-neutral-900">Meeting strip</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size={focusMode ? "lg" : "sm"}>
                <Link href={nextMeeting ? `/tanjia/meetings/${nextMeeting.id}/start` : "/tanjia/meetings/new"}>Capture note</Link>
              </Button>
              <Button asChild size={focusMode ? "lg" : "sm"} variant="secondary">
                <Link href="/tanjia/followups">Add follow-up</Link>
              </Button>
              {!presentationMode ? (
                <Button asChild size={focusMode ? "lg" : "sm"} variant="secondary">
                  <Link href="/tanjia/tools/emyth">Follow-through</Link>
                </Button>
              ) : null}
              {!presentationMode ? (
                <Button asChild size={focusMode ? "lg" : "sm"} variant="secondary">
                  <Link href="/tanjia/helper">Open helper</Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}
      {!focusMode ? (
        <Card className="border-neutral-200/80 bg-white/90 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm font-semibold text-neutral-900">Recent leads</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {leads.length ? (
                leads.slice(0, 4).map((lead) => (
                  <div key={lead.id} className="rounded-lg border border-neutral-200 bg-white/90 p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          <SensitiveText text={lead.name} id={lead.id} />
                        </p>
                        {lead.website ? <p className="text-xs text-neutral-600">{lead.website}</p> : null}
                      </div>
                      <Badge variant="muted">{lead.status || "new"}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-600">
                      <span>Last run: {lead.lastSnapshot ? format(new Date(lead.lastSnapshot), "MMM d, h:mma") : "Not yet"}</span>
                      <span>Next follow-up: {lead.nextFollowup ? format(new Date(lead.nextFollowup), "MMM d, h:mma") : "None"}</span>
                    </div>
                    <div className="pt-2">
                      <Link href={`/tanjia/leads/${lead.id}`} className="text-sm text-neutral-800 underline-offset-4 hover:underline">
                        Open quietly
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                  No leads yet. Add one person you want to follow; we&apos;ll keep it private.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {showInternal && explainMode ? (
        <Card className="border-neutral-200/80 bg-white/90 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-neutral-900">Demo lane</p>
              <p className="text-xs text-neutral-500">Proof-of-work (internal only)</p>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-neutral-200 bg-white/90 p-3 shadow-sm">
                <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">What we do in 30 seconds</p>
                <p className="mt-1 text-sm text-neutral-800">
                  Calm outreach, fast replies, and structured follow-ups powered by orchestrated AI + tools. Presentation mode keeps it client-safe.
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white/90 p-3 shadow-sm">
                <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">Proof-of-work</p>
                {traceInfo ? (
                  <ul className="mt-2 space-y-1 text-sm text-neutral-800">
                    <li>Trace: {traceInfo.id || "n/a"}</li>
                    <li>Tools: {(traceInfo.tools || []).join(", ") || "n/a"}</li>
                    <li>Duration: {traceInfo.durationMs ? `${traceInfo.durationMs}ms` : "n/a"}</li>
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-neutral-700">Run an agent action to populate trace info.</p>
                )}
              </div>
            </div>
            {currentPreset.id === "client" ? (
              <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">Client-safe example</p>
                <p className="text-sm text-neutral-800">{exampleOutput}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <AnimatePresence>
        {emythDrawer.open ? (
          <motion.div
            key="emyth-drawer"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-4xl px-4 pb-6"
          >
            <Card className="border-neutral-200/80 bg-white/95 shadow-2xl backdrop-blur">
              <CardContent className="space-y-3 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{emythDrawer.title || "E-Myth inline"}</p>
                    <p className="text-xs text-neutral-500">Quiet drawer; stays off in presentation mode.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEmythDrawer({ open: false });
                      setShowEmythInfo(false);
                    }}
                  >
                    Close
                  </Button>
                </div>
                {focusMode && !showEmythInfo ? (
                  <div className="flex items-center justify-between rounded-md bg-neutral-50 p-3 text-sm text-neutral-700">
                    <span>Compact view. Tap info to expand E-Myth runner.</span>
                    <Button size="sm" variant="secondary" onClick={() => setShowEmythInfo(true)}>
                      Info
                    </Button>
                  </div>
                ) : (
                  <>
                    <Textarea
                      value={emythInput}
                      onChange={(e) => setEmythInput(e.target.value)}
                      placeholder="Paste recent post or notes"
                      className={currentPreset.density === "compact" ? "min-h-[120px]" : "min-h-[160px]"}
                    />
                    <div className="flex flex-wrap gap-2">
                      {!presentationMode && explainMode ? (
                        <Button size="sm" onClick={handleEmythRun} disabled={emythLoading}>
                          {emythLoading ? "Running..." : "Run"}
                        </Button>
                      ) : (
                        <p className="text-xs text-neutral-500">Live run hidden in client-safe mode.</p>
                      )}
                    </div>
                    {emythResult ? (
                      <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-800">
                        <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(emythResult, null, 2)}</pre>
                      </div>
                    ) : null}
                    {emythProof && explainMode && !presentationMode ? (
                      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
                        <p>Trace: {emythProof.traceId}</p>
                        <p>Tools: {(emythProof.toolsUsed || []).join(", ") || "none"}</p>
                        <p>Duration: {emythProof.durationMs ? `${emythProof.durationMs}ms` : "n/a"}</p>
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

