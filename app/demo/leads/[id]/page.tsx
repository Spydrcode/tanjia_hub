import type { Metadata } from "next";
import { format } from "date-fns";
import LeadDetailClient from "../../../tanjia/leads/[id]/client";
import { DangerZone } from "../../../tanjia/leads/[id]/danger-zone";
import {
  runLeadIntelligenceAction,
  createFollowup,
  updateLeadStatus,
  updateLeadNotes,
  saveMessageDraft,
  markFollowupDone,
  snoozeFollowup,
  deleteLead,
} from "../../../tanjia/leads/actions";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { PageShell } from "@/src/components/ui/page-shell";
import { IntentHeader } from "@/src/components/ui/intent-header";
import { PinButton } from "@/app/tanjia/components/pin-button";
import { DEMO_WORKSPACE_ID } from "@/src/lib/workspaces/constants";

export const metadata: Metadata = {
  title: "Demo Lead Detail",
  description: "Lead detail scoped to demo workspace",
  robots: { index: false, follow: false },
};

export default async function DemoLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  const { supabase, user } = await requireAuthOrRedirect();

  const leadWithWorkspace = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("workspace_id", DEMO_WORKSPACE_ID)
    .single();

  const leadLegacy = leadWithWorkspace.error?.message?.includes("workspace_id")
    ? await supabase.from("leads").select("*").eq("id", leadId).eq("owner_id", user.id).single()
    : null;

  const lead = leadWithWorkspace.data || leadLegacy?.data;

  const snapshotsWithWorkspace = await supabase
    .from("lead_snapshots")
    .select("id, created_at, summary, extracted_json")
    .eq("lead_id", leadId)
    .eq("workspace_id", DEMO_WORKSPACE_ID)
    .order("created_at", { ascending: false })
    .limit(3);

  const snapshotsLegacy = snapshotsWithWorkspace.error?.message?.includes("workspace_id")
    ? await supabase
        .from("lead_snapshots")
        .select("id, created_at, summary, extracted_json")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(3)
    : null;

  const snapshots = snapshotsWithWorkspace.data || snapshotsLegacy?.data;

  const followupsWithWorkspace = await supabase
    .from("followups")
    .select("id, note, due_at, done, created_at")
    .eq("lead_id", leadId)
    .eq("workspace_id", DEMO_WORKSPACE_ID)
    .order("due_at", { ascending: true });

  const followupsLegacy = followupsWithWorkspace.error?.message?.includes("workspace_id")
    ? await supabase
        .from("followups")
        .select("id, note, due_at, done, created_at")
        .eq("lead_id", leadId)
        .order("due_at", { ascending: true })
    : null;

  const followups = followupsWithWorkspace.data || followupsLegacy?.data;

  const activeLead = lead;

  if (!activeLead) {
    return (
      <div className="py-16">
        <IntentHeader title="Lead not found" subtitle="This lead is unavailable." backHref="/demo/leads" backLabel="Back to leads" />
      </div>
    );
  }

  const latestSnapshot = (snapshots || [])[0];
  const outputs = (latestSnapshot?.extracted_json as any)?.outputs;

  const helperHref = `/demo/helper${leadId ? `?leadId=${leadId}` : ""}`;
  const schedulerParams = new URLSearchParams();
  schedulerParams.set("source", "lead");
  schedulerParams.set("leadId", leadId);
  if ((activeLead as any).name) schedulerParams.set("leadName", (activeLead as any).name);
  if ((activeLead as any).email) schedulerParams.set("leadEmail", (activeLead as any).email);
  const schedulerHref = `/demo/scheduler?${schedulerParams.toString()}`;

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

  const lastRunLabel = latestSnapshot?.created_at
    ? `Last run ${format(new Date(latestSnapshot.created_at), "MMM d, h:mma")}`
    : "No runs yet.";

  return (
    <PageShell maxWidth="lg">
      <div className="flex items-start justify-between gap-4">
        <IntentHeader
          badge="Demo"
          title={(activeLead as any).name || "Lead"}
          subtitle={lastRunLabel}
          backHref="/demo/leads"
          backLabel="Back to Leads"
        />
        <PinButton
          item={{
            id: leadId,
            type: "lead",
            title: (activeLead as any).name || "Lead",
            href: `/demo/leads/${leadId}`,
            subtitle: `Lead${(activeLead as any).company ? ` • ${(activeLead as any).company}` : ""}`,
          }}
        />
      </div>

      <LeadDetailClient
        leadId={leadId}
        leadName={(activeLead as any).name}
        leadWebsite={(activeLead as any).website}
        leadLocation={(activeLead as any).location}
        leadEmail={(activeLead as any).email}
        leadStatus={(activeLead as any).status}
        leadNotes={(activeLead as any).notes}
        snapshot={outputs}
        snapshotMeta={latestSnapshot as any}
        followups={(followups as any) || []}
        calLinks={{ "15": "", "30": "" }}
        helperHref={helperHref}
        schedulerHref={schedulerHref}
        canSendEmail={false}
        onRunStandard={runStandard}
        onRunDeep={runDeep}
        onSaveNotes={saveNotes}
        onSaveDraft={saveDraft}
        onAddFollowup={addFollowup}
        onDoneFollowup={doneFollowup}
        onSnoozeFollowup={snooze}
        onUpdateStatus={setStatus}
      />

      <DangerZone leadId={leadId} onDeleteAction={deleteLead} />
    </PageShell>
  );
}
