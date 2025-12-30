'use client';

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { Tabs } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Textarea, Input } from "@/src/components/ui/input";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Select } from "@/src/components/ui/select";
import { useToast } from "@/src/components/ui/toast";
import { SensitiveText } from "@/src/components/ui/sensitive-text";
import { useViewModes } from "@/src/components/ui/view-modes";
import { ExplainHint } from "@/src/components/ui/explain-hint";

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

type MessageDraft = {
  channel: "comment" | "dm" | "email";
  options: string[];
};

type Props = {
  leadId: string;
  leadName: string;
  leadWebsite?: string | null;
  leadLocation?: string | null;
  leadEmail?: string | null;
  leadStatus?: string | null;
  leadNotes?: string | null;
  snapshot?: SnapshotOutputs;
  snapshotMeta?: SnapshotMeta;
  followups: Followup[];
  calLinks: { "15": string; "30": string };
  helperHref: string;
  schedulerHref: string;
  canSendEmail: boolean;
  onRunStandard?: () => Promise<void>;
  onRunDeep?: () => Promise<void>;
  onSaveNotes: (notes: string) => Promise<void>;
  onSaveDraft: (channel: string, intent: string, body: string) => Promise<void>;
  onAddFollowup: (note: string, due_at?: string) => Promise<void>;
  onDoneFollowup: (id: string) => Promise<void>;
  onSnoozeFollowup: (id: string, days: number) => Promise<void>;
  onUpdateStatus: (status: string) => Promise<void>;
};

const tabItems = [
  { id: "talking", label: "Talking Points" },
  { id: "questions", label: "Questions" },
  { id: "drafts", label: "Draft Messages" },
  { id: "followups", label: "Follow-ups" },
  { id: "snapshot", label: "Snapshot" },
] as const;

const draftTabs: { id: MessageDraft["channel"]; label: string }[] = [
  { id: "comment", label: "Comment" },
  { id: "dm", label: "DM" },
  { id: "email", label: "Email" },
];

const statusOptions = ["new", "contacted", "active", "parked"];

export default function LeadDetailClient({
  leadId,
  leadName,
  leadWebsite,
  leadLocation,
  leadEmail,
  leadStatus,
  leadNotes,
  snapshot,
  snapshotMeta,
  followups,
  calLinks,
  helperHref,
  schedulerHref,
  canSendEmail,
  onRunStandard,
  onRunDeep,
  onSaveNotes,
  onSaveDraft,
  onAddFollowup,
  onDoneFollowup,
  onSnoozeFollowup,
  onUpdateStatus,
}: Props) {
  const { presentationMode } = useViewModes();
  const [activeTab, setActiveTab] = useState<(typeof tabItems)[number]["id"]>("talking");
  const [draftTab, setDraftTab] = useState<MessageDraft["channel"]>("comment");
  const [notesValue, setNotesValue] = useState(leadNotes || "");
  const [copying, setCopying] = useState(false);
  const [subject, setSubject] = useState("Quick hello");
  const [emailBody, setEmailBody] = useState(snapshot?.drafts?.email?.[0] || "");
  const [toEmail, setToEmail] = useState(leadEmail || "");
  const [followupNote, setFollowupNote] = useState("");
  const [followupDue, setFollowupDue] = useState("");
  const [statusValue, setStatusValue] = useState(leadStatus || "new");
  const [isRunning, startRunTransition] = useTransition();
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const showToast = useToast();

  const drafts: MessageDraft[] = useMemo(
    () => [
      { channel: "comment", options: snapshot?.drafts?.comment || [] },
      { channel: "dm", options: snapshot?.drafts?.dm || [] },
      { channel: "email", options: snapshot?.drafts?.email || [] },
    ],
    [snapshot],
  );

  const shorten = (text: string) => {
    const firstSentence = text.split(". ")[0] || text;
    const trimmed = firstSentence.trim();
    return trimmed.length > 200 ? `${trimmed.slice(0, 200)}...` : trimmed;
  };

  const handleCopy = async (text: string) => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(text);
      showToast("Copied", "success");
    } catch {
      showToast("Could not copy", "error");
    } finally {
      setCopying(false);
    }
  };

  const handleSaveDraft = async (channel: string, text: string) => {
    try {
      await onSaveDraft(channel, "followup", text);
      showToast("Saved to messages", "success");
    } catch {
      showToast("Could not save draft", "error");
    }
  };

  const handleRun = (deep?: boolean) => {
    if (!onRunStandard) return;
    startRunTransition(async () => {
      try {
        if (deep && onRunDeep) {
          await onRunDeep();
        } else {
          await onRunStandard();
        }
        showToast("Run started", "success");
      } catch {
        showToast("Could not start run", "error");
      }
    });
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onSaveNotes(notesValue);
      showToast("Notes saved", "success");
    } catch {
      showToast("Could not save notes", "error");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAddFollowup = async () => {
    if (!followupNote.trim()) {
      showToast("Add a note first", "error");
      return;
    }
    try {
      await onAddFollowup(followupNote, followupDue || undefined);
      setFollowupNote("");
      setFollowupDue("");
      showToast("Follow-up added", "success");
    } catch {
      showToast("Could not add follow-up", "error");
    }
  };

  const handleUpdateStatus = async () => {
    setUpdatingStatus(true);
    try {
      await onUpdateStatus(statusValue);
      showToast("Status updated", "success");
    } catch {
      showToast("Could not update status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const hasSnapshot = Boolean(snapshot && snapshotMeta);
  const lastRun = snapshotMeta?.created_at ? format(new Date(snapshotMeta.created_at), "MMM d, h:mma") : null;
  const modelPath = snapshotMeta?.models?.join(" · ");

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">Lead</p>
                <h2 className="text-xl font-semibold text-neutral-900">
                  <SensitiveText text={leadName} id={leadId} />
                </h2>
                {leadLocation ? (
                  <p className="text-xs text-neutral-600" data-sensitive="true">
                    {leadLocation}
                  </p>
                ) : null}
              </div>
              <Badge variant="muted">{statusValue || "new"}</Badge>
            </div>
            {leadWebsite ? (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                <span className="truncate" title={leadWebsite}>
                  {leadWebsite}
                </span>
                <Button asChild size="sm" variant="secondary">
                  <a href={leadWebsite} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </Button>
              </div>
            ) : null}
            {leadEmail ? (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                <span className="truncate" title={leadEmail}>
                  <SensitiveText text={leadEmail} mask="email" />
                </span>
                <Button asChild size="sm" variant="secondary">
                  <a href={`mailto:${leadEmail}`}>Email</a>
                </Button>
              </div>
            ) : null}
            <Select
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              aria-label="Lead status"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
            <Button size="sm" variant="secondary" onClick={handleUpdateStatus} disabled={updatingStatus}>
              {updatingStatus ? "Saving..." : "Update status"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-900">Quick actions</p>
              <ExplainHint target="schedule.button" />
            </div>
            <Button onClick={() => handleRun(false)} disabled={isRunning || !onRunStandard}>
              {isRunning ? "Running..." : "Run Intelligence"}
            </Button>
            <Button onClick={() => handleRun(true)} variant="secondary" disabled={isRunning || !onRunDeep}>
              Run Intelligence (deep)
            </Button>
            <Button asChild>
              <a href={schedulerHref}>Open scheduler</a>
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => handleCopy(calLinks["15"])} variant="ghost" size="sm" disabled={copying}>
                Copy 15m link
              </Button>
              <Button onClick={() => handleCopy(calLinks["30"])} variant="ghost" size="sm" disabled={copying}>
                Copy 30m link
              </Button>
            </div>
            <Button asChild variant="ghost" size="sm">
              <a href={helperHref}>Open helper with context</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-900">Notes</p>
              <Button size="sm" variant="secondary" onClick={handleSaveNotes} disabled={isSavingNotes}>
                {isSavingNotes ? "Saving..." : "Save"}
              </Button>
            </div>
            <Textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="What you heard, boundaries, preferences"
              className="min-h-35"
              data-sensitive="true"
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {isRunning ? (
          <Card>
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-medium text-neutral-900">Running intelligence</p>
              <p className="text-sm text-neutral-600">Collecting public signals · Drafting · Saving</p>
              <div className="grid gap-2">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-5/6" />
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex items-center justify-between">
          <Tabs tabs={tabItems as any} activeId={activeTab} onChange={(id) => setActiveTab(id as any)} />
          <ExplainHint target="agent.outputs" />
        </div>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
              <span>Last run: {lastRun || "Not yet"}</span>
              <span>{modelPath || ""}</span>
            </div>
            {!hasSnapshot ? (
              <div className="rounded-lg border border-dashed border-neutral-200 p-4 text-sm text-neutral-700">
                Run a standard pass to generate talking points and drafts.
              </div>
            ) : null}

            {activeTab === "talking" && (
              <div className="space-y-2">
                {snapshot?.talkingPoints?.length ? (
                  snapshot.talkingPoints.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                    >
                      <p className="text-sm text-neutral-800">
                        <SensitiveText text={item} mask="message" />
                      </p>
                      <Button size="sm" variant="ghost" onClick={() => handleCopy(item)} disabled={copying}>
                        Copy
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-600">No points yet.</p>
                )}
              </div>
            )}

            {activeTab === "questions" && (
              <div className="space-y-2">
                {snapshot?.questions?.length ? (
                  snapshot.questions.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                    >
                      <p className="text-sm text-neutral-800">
                        <SensitiveText text={item} mask="message" />
                      </p>
                      <Button size="sm" variant="ghost" onClick={() => handleCopy(item)} disabled={copying}>
                        Copy
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-600">No questions yet.</p>
                )}
              </div>
            )}

            {activeTab === "drafts" && (
              <div className="space-y-3">
                <Tabs tabs={draftTabs as any} activeId={draftTab} onChange={(id) => setDraftTab(id as any)} />
                {drafts.find((d) => d.channel === draftTab)?.options.length ? (
                  drafts
                    .find((d) => d.channel === draftTab)
                    ?.options.map((option, idx) => (
                      <div key={idx} className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                        <p className="text-sm text-neutral-800">
                          <SensitiveText text={option} mask="message" />
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleCopy(option)} disabled={copying}>
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleCopy(shorten(option))}
                            disabled={copying}
                          >
                            Shorten
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleSaveDraft(draftTab, option)}>
                            Save to Messages
                          </Button>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-neutral-600">No drafts yet.</p>
                )}

                {draftTab === "email" ? (
                  <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <Input
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      placeholder="Recipient email"
                      data-sensitive="true"
                    />
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject"
                      data-sensitive="true"
                    />
                    <Textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="min-h-30"
                      data-sensitive="true"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleCopy(emailBody)} disabled={copying}>
                        Copy email
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleSaveDraft("email", emailBody)}>
                        Save to Messages
                      </Button>
                      <Button
                        size="sm"
                        disabled={!canSendEmail || !toEmail}
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/send-email", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ toEmail, subject, body: emailBody, leadId: leadId }),
                            });
                            if (!res.ok) {
                              throw new Error("Send failed");
                            }
                            showToast("Email sent", "success");
                          } catch {
                            showToast(canSendEmail ? "Could not send email" : "Email not configured", "error");
                          }
                        }}
                      >
                        {canSendEmail ? "Send Email" : "Email not configured"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {activeTab === "followups" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      value={followupNote}
                      onChange={(e) => setFollowupNote(e.target.value)}
                      placeholder="Note"
                      data-sensitive="true"
                    />
                    <Input
                      type="datetime-local"
                      value={followupDue}
                      onChange={(e) => setFollowupDue(e.target.value)}
                    />
                  </div>
                  <Button className="mt-2" size="sm" onClick={handleAddFollowup}>
                    Add follow-up
                  </Button>
                </div>
                {followups.length ? (
                  followups.map((f) => (
                    <div key={f.id} className="flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-3">
                      <div className="flex items-center justify-between text-sm text-neutral-800">
                        <span>
                          <SensitiveText text={f.note} mask="note" />
                        </span>
                        <Badge variant={f.done ? "muted" : "warning"}>{f.done ? "Done" : "Due"}</Badge>
                      </div>
                      <p className="text-xs text-neutral-500">
                        {f.due_at ? format(new Date(f.due_at), "MMM d, h:mma") : "No due date"}
                      </p>
                      <div className="flex gap-2">
                        {!f.done ? (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => onDoneFollowup(f.id)}>
                              Mark done
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => onSnoozeFollowup(f.id, 2)}>
                              Snooze +2 days
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-600">No follow-ups yet.</p>
                )}
              </div>
            )}

            {activeTab === "snapshot" && (
              <div className="space-y-2">
                <p className="text-sm text-neutral-700">
                  <SensitiveText text={snapshotMeta?.summary || snapshotMeta?.runType || ""} mask="message" />
                </p>
                <div className="space-y-1 text-xs text-neutral-600">
                  <p>Sources:</p>
                  {snapshotMeta?.sources?.length ? (
                    snapshotMeta.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-neutral-800 underline"
                      >
                        {s.url}
                      </a>
                    ))
                  ) : (
                    <p>No sources</p>
                  )}
                </div>
                {snapshotMeta?.agentTrace ? (
                  <details className="text-xs text-neutral-600">
                    <summary className="cursor-pointer text-neutral-800">Run details</summary>
                    <p>Steps: {snapshotMeta.agentTrace.steps || 0}</p>
                    <p>Tools: {snapshotMeta.agentTrace.tools_called?.length || 0}</p>
                    <p>Sources: {snapshotMeta.sources?.length || 0}</p>
                  </details>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
