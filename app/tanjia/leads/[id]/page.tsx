import type { Metadata } from "next";
import { format } from "date-fns";
import LeadDetailClient from "./client";
import {
  runLeadIntelligenceAction,
  createFollowup,
  updateLeadStatus,
  updateLeadNotes,
  saveMessageDraft,
  markFollowupDone,
  snoozeFollowup,
} from "../actions";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { featureFlags } from "@/src/lib/env";
import { demoLeads, demoFollowups } from "@/lib/demo-data";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { PageHeader } from "@/src/components/ui/page-header";

export const metadata: Metadata = {
  title: "Lead Detail",
  description: "Lead details and intelligence.",
  robots: { index: false, follow: false },
};

type SnapshotOutputs = {
  summary?: string | null;
  talkingPoints?: string[];
  questions?: string[];
  drafts?: {
    comment?: string[];
    dm?: string[];
    email?: string[];
  };
};

type SnapshotMeta = {
  created_at?: string;
  summary?: string | null;
  models?: string[];
  sources?: { url: string; via?: string }[];
  agentTrace?: { steps?: number; tools_called?: unknown[] };
  runType?: string;
};

type Followup = {
  id: string;
  note: string;
  due_at?: string | null;
  done?: boolean | null;
};

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const leadId = params.id;
  const { supabase } = await requireAuthOrRedirect();
  const isDemo = featureFlags.showcaseMode;

  const { data: lead } =
    !isDemo ? await supabase.from("leads").select("*").eq("id", leadId).single() : { data: null };

  const { data: snapshots } =
    !isDemo
      ? await supabase
          .from("lead_snapshots")
          .select("id, created_at, summary, extracted_json")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false })
          .limit(3)
      : { data: [] };

  const { data: followups } =
    !isDemo
      ? await supabase
          .from("followups")
          .select("id, note, due_at, done, created_at")
          .eq("lead_id", leadId)
          .order("due_at", { ascending: true })
      : { data: undefined };

  const demoLead = isDemo ? demoLeads.find((l) => l.id === leadId) : null;
  const activeLead = demoLead || lead;

  if (!activeLead) {
    return (
      <div className="py-16">
        <PageHeader
          title="Lead not found"
          description="This lead is unavailable."
          actionHref="/tanjia/leads"
          actionLabel="Back to leads"
          actionVariant="ghost"
        />
      </div>
    );
  }

  const demoSnapshot = demoLead?.snapshot
    ? [
        {
          id: `${demoLead.id}-snap`,
          created_at: demoLead.updated_at || new Date().toISOString(),
          summary: demoLead.snapshot.summary,
          extracted_json: {
            outputs: demoLead.snapshot,
            models_used: demoLead.snapshot.modelsUsed,
            sources: [{ url: demoLead.website, via: "demo" }],
            runType: "demo",
          },
        },
      ]
    : [];

  const allSnapshots = demoSnapshot.length ? demoSnapshot : snapshots || [];
  const latestSnapshot = allSnapshots?.[0];
  const outputs = (latestSnapshot?.extracted_json as any)?.outputs as SnapshotOutputs | undefined;

  const snapshotMeta: SnapshotMeta | undefined = latestSnapshot
    ? {
        created_at: latestSnapshot.created_at,
        summary: (latestSnapshot.extracted_json as any)?.summary || latestSnapshot.summary,
        models:
          ((latestSnapshot.extracted_json as any)?.models_used ||
            (latestSnapshot.extracted_json as any)?.modelsUsed) ?? undefined,
        sources: (latestSnapshot.extracted_json as any)?.sources,
        agentTrace: (latestSnapshot.extracted_json as any)?.agent_trace,
        runType: (latestSnapshot.extracted_json as any)?.runType,
      }
    : undefined;

  const activeFollowups: Followup[] = isDemo
    ? demoFollowups[demoLead?.id ?? ""] || []
    : (followups as Followup[] | null | undefined) || [];

  async function runStandard() {
    "use server";
    await runLeadIntelligenceAction(leadId, false);
  }

  async function runDeep() {
    "use server";
    await runLeadIntelligenceAction(leadId, true);
  }

  async function saveNotes(notes: string) {
    "use server";
    await updateLeadNotes(leadId, notes);
  }

  async function saveDraft(channel: string, intent: string, body: string) {
    "use server";
    await saveMessageDraft(leadId, channel, intent, body);
  }

  async function addFollowup(note: string, due_at?: string) {
    "use server";
    await createFollowup(leadId, note, due_at);
  }

  async function doneFollowup(followupId: string) {
    "use server";
    await markFollowupDone(followupId, leadId);
  }

  async function snooze(followupId: string, days: number) {
    "use server";
    await snoozeFollowup(followupId, days);
  }

  async function setStatus(status: string) {
    "use server";
    await updateLeadStatus(leadId, status);
  }

  const helperHref = `/tanjia/helper${leadId ? `?leadId=${leadId}` : ""}`;
  const schedulerParams = new URLSearchParams();
  schedulerParams.set("source", "lead");
  if (leadId) schedulerParams.set("leadId", leadId);
  if ((activeLead as any).name) schedulerParams.set("leadName", (activeLead as any).name);
  if ((activeLead as any).email) schedulerParams.set("leadEmail", (activeLead as any).email);
  const schedulerHref = `/tanjia/scheduler?${schedulerParams.toString()}`;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title={(activeLead as any).name || "Lead"}
        description="Capture, run, use, follow-up."
        actionLabel="Back to leads"
        actionHref="/tanjia/leads"
        actionVariant="ghost"
      >
        <p className="text-xs text-neutral-500">
          {latestSnapshot?.created_at
            ? `Last run ${format(new Date(latestSnapshot.created_at), "MMM d, h:mma")}`
            : "No runs yet."}
        </p>
      </PageHeader>

      <LeadDetailClient
        leadId={leadId}
        leadName={(activeLead as any).name}
        leadWebsite={(activeLead as any).website}
        leadLocation={(activeLead as any).location}
        leadEmail={(activeLead as any).email}
        leadStatus={(activeLead as any).status}
        leadNotes={(activeLead as any).notes}
        snapshot={outputs}
        snapshotMeta={snapshotMeta}
        followups={activeFollowups}
        calLinks={{ "15": tanjiaConfig.calEvent15Url, "30": tanjiaConfig.calEvent30Url }}
        helperHref={helperHref}
        schedulerHref={schedulerHref}
        canSendEmail={featureFlags.resendEnabled}
        onRunStandard={isDemo ? undefined : runStandard}
        onRunDeep={isDemo ? undefined : runDeep}
        onSaveNotes={saveNotes}
        onSaveDraft={saveDraft}
        onAddFollowup={addFollowup}
        onDoneFollowup={doneFollowup}
        onSnoozeFollowup={snooze}
        onUpdateStatus={setStatus}
      />
    </div>
  );
}
