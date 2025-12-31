'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { GradientPill } from "@/src/components/ui/gradient-pill";
import { SensitiveText } from "@/src/components/ui/sensitive-text";
import { Badge } from "@/src/components/ui/badge";
import { useViewModes } from "@/src/components/ui/view-modes";

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
    agentPack: ["scan-post", "draft-comment", "draft-dm", "run-intel"],
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
    agentPack: ["capture-note", "draft-reply", "plan-followup", "mark-next"],
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
    agentPack: ["add-lead-fast", "capture-onsite", "plan-followup", "next-step"],
  },
];

const focusKey = "tanjia_focus_mode";
const presetKey = "tanjia_preset";

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
      .then((data) => {
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
    if (selectedPreset.presentationMode) setPresentation(true);
  }, [selectedPreset, setPresentation]);

  const applyPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    setFocusMode(preset.focusMode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(presetKey, preset.id);
      window.localStorage.setItem(focusKey, preset.focusMode ? "true" : "false");
    }
    if (preset.presentationMode) {
      if (!presentationMode) {
        setPresentation(true);
      }
    } else if (presentationMode && preset.id !== "client") {
      setPresentation(false);
    }
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
        const tone = item.status === "healthy" ? "✅" : item.status === "degraded" ? "🟡" : "🔴";
        return (
          <button
            key={item.id}
            onClick={() => router.push(`/tanjia/tools/system#${item.id}`)}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 transition hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
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
    { title: "Reply helper", desc: "Draft a comment or DM in seconds.", href: "/tanjia/helper" },
    { title: "Follow-ups", desc: "See what is due and log next steps.", href: "/tanjia/followups" },
    { title: "Leads", desc: "Capture, notes, and quiet context.", href: "/tanjia/leads" },
    { title: "Meetings", desc: "Prep, capture, and recap calmly.", href: "/tanjia/meetings" },
    { title: "Scheduler", desc: "Send a time link only if asked.", href: "/tanjia/scheduler" },
    { title: "System", desc: "Tool health and traces.", href: "/tanjia/tools/system" },
    { title: "Presentation", desc: "Client-safe view of 2ndmynd.", href: "/tanjia/presentation" },
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

  const agentActions: Record<string, { label: string; description: string; run: () => Promise<void> | void; internalOnly?: boolean }> = {
    "scan-post": {
      label: "Scan Post → Capture Lead",
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
    "next-step": {
      label: "Create Next Step Message",
      description: "Draft DM-style follow-up.",
      run: () => router.push("/tanjia/helper?channel=dm"),
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">Tanjia</p>
          <h1 className="text-2xl font-semibold text-neutral-900">Command dashboard</h1>
          {!presentationMode ? (
            <p className="text-sm text-neutral-600">
              {currentPreset.description} · Success in 10 seconds: jump to the primary action below.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={focusMode ? "default" : "secondary"} size="sm" onClick={toggleFocusMode}>
            {focusMode ? "Focus mode on" : "Focus mode"}
          </Button>
          <Button variant={presentationMode ? "default" : "secondary"} size="sm" onClick={handlePresent}>
            Client-safe view
          </Button>
          <Button variant="ghost" size="sm" onClick={copyClientLink}>
            Copy client link
          </Button>
        </div>
      </div>

      <Card className="border-neutral-200">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-neutral-900">Situation presets</p>
            {presentationMode ? null : <p className="text-xs text-neutral-500">One dashboard, four situations.</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.id}
                variant={preset.id === currentPreset.id ? "default" : "secondary"}
                size="sm"
                onClick={() => applyPreset(preset)}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-neutral-200">
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900">Now</p>
              <GradientPill label={`${followupsDue.length} follow-ups`} tone={followupsDue.length ? "positive" : "neutral"} />
            </div>
            {nextMeeting ? (
              <div className="flex flex-col gap-1 rounded-lg bg-neutral-50 p-3">
                <p className="text-sm font-semibold text-neutral-900">{nextMeeting.title}</p>
                <p className="text-sm text-neutral-700">
                  {format(new Date(nextMeeting.start_at), "EEE, MMM d h:mma")} {nextMeeting.location_name ? `· ${nextMeeting.location_name}` : ""}
                </p>
                {!focusMode ? <p className="text-xs text-neutral-600">Stay present; start capture quietly if helpful.</p> : null}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button asChild size="sm">
                    <Link href={`/tanjia/meetings/${nextMeeting.id}/start`}>Start capture</Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/tanjia/meetings">Open meetings</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 rounded-lg bg-neutral-50 p-3">
                <p className="text-sm font-semibold text-neutral-900">No meeting scheduled</p>
                {!focusMode ? <p className="text-sm text-neutral-700">Create one only if it helps the relationship.</p> : null}
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href="/tanjia/meetings/new">Create meeting</Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/tanjia/scheduler">Open scheduler</Link>
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-dashed border-neutral-200 p-3">
              {nextFollowup ? (
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-neutral-900">Next follow-up</p>
                  <p className="text-sm text-neutral-700">
                    <SensitiveText text={nextFollowup.lead_name || "Lead"} id={nextFollowup.lead_id} /> ·{" "}
                    {nextFollowup.due_at ? format(new Date(nextFollowup.due_at), "MMM d h:mma") : "soon"}
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

        <Card className="border-neutral-200">
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900">Meeting quick bar</p>
              {!focusMode ? <p className="text-xs text-neutral-500">Two clicks max</p> : null}
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button asChild size="sm">
                <Link href={nextMeeting ? `/tanjia/meetings/${nextMeeting.id}/start` : "/tanjia/meetings/new"}>
                  {nextMeeting ? "Start capture" : "Create meeting"}
                </Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href="/tanjia/helper">Open helper</Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href="/tanjia/leads/new">Add lead</Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href="/tanjia/followups">Add follow-up</Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={copyClientLink}>
                Copy client-safe link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-neutral-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-neutral-900">Quick bar</p>
            {!focusMode ? <p className="text-xs text-neutral-500">Primary actions for this situation</p> : null}
          </div>
          <div className={`mt-3 grid gap-2 ${currentPreset.density === "comfortable" ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            {currentPreset.quickBarOrder.map((id) => {
              const action = quickActionsMap[id];
              if (!action) return null;
              if (action.href) {
                return (
                  <Button key={id} asChild size="sm" className="justify-start">
                    <Link href={action.href}>{action.label}</Link>
                  </Button>
                );
              }
              if (action.onClick) {
                return (
                  <Button key={id} size="sm" variant="secondary" className="justify-start" onClick={action.onClick}>
                    {action.label}
                  </Button>
                );
              }
              return null;
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-neutral-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-neutral-900">Agent actions</p>
            {!focusMode ? <p className="text-xs text-neutral-500">One-click packs per situation</p> : null}
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {currentPreset.agentPack
              .map((id) => agentActions[id])
              .filter((a) => a && (showInternal || !a.internalOnly))
              .map((action) => (
                <div key={action.label} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{action.label}</p>
                    {!focusMode ? <p className="text-xs text-neutral-600">{action.description}</p> : null}
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => action.run()}>
                    Go
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-neutral-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-neutral-900">Tools</p>
            {!focusMode ? <p className="text-xs text-neutral-500">Outcome-first shortcuts</p> : null}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {toolCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-900">{card.title}</p>
                  <span className="text-neutral-400 group-hover:text-neutral-600" aria-hidden>
                    →
                  </span>
                </div>
                {!focusMode ? <p className="mt-1 text-sm text-neutral-600">{card.desc}</p> : null}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {currentPreset.statusSurface !== "hidden" ? (
        <Card className="border-neutral-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-neutral-900">Tool status</p>
              {statusUpdated && !focusMode && currentPreset.statusSurface === "expanded" ? (
                <p className="text-xs text-neutral-500">Updated {format(new Date(statusUpdated), "MMM d, h:mma")}</p>
              ) : null}
            </div>
            {hasCriticalIssue && currentPreset.statusSurface !== "hidden" ? (
              <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">Some tools unavailable. Open System for details.</div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">{statusChips.length ? statusChips : <p className="text-sm text-neutral-600">Loading...</p>}</div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-neutral-200 lg:col-span-2">
          <CardContent className="flex flex-col gap-3 p-4">
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
          </CardContent>
        </Card>
      </div>

      {(currentPreset.id === "meeting" || currentPreset.id === "client") && (
        <Card className="border-neutral-200">
          <CardContent className="flex flex-wrap items-center gap-2 p-4">
            <p className="text-sm font-semibold text-neutral-900">Meeting strip</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={nextMeeting ? `/tanjia/meetings/${nextMeeting.id}/start` : "/tanjia/meetings/new"}>Capture note</Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href="/tanjia/followups">Add follow-up</Link>
              </Button>
              {!presentationMode ? (
                <Button asChild size="sm" variant="secondary">
                  <Link href="/tanjia/helper">Open helper</Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {!focusMode ? (
        <Card className="border-neutral-200">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-neutral-900">Recent leads</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {leads.length ? (
                leads.slice(0, 4).map((lead) => (
                  <div key={lead.id} className="rounded-lg border border-neutral-200 bg-white p-3">
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

      {showInternal ? (
        <Card className="border-neutral-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-neutral-900">Demo lane</p>
              <p className="text-xs text-neutral-500">Proof-of-work (internal only)</p>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-neutral-200 bg-white p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">What we do in 30 seconds</p>
                <p className="mt-1 text-sm text-neutral-800">
                  Calm outreach, fast replies, and structured follow-ups powered by orchestrated AI + tools. Presentation mode keeps it client-safe.
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white p-3">
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
    </div>
  );
}
