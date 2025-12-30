'use client';

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { Tabs } from "@/src/components/ui/tabs";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { useToast } from "@/src/components/ui/toast";
import { SensitiveText } from "@/src/components/ui/sensitive-text";
import { ExplainHint } from "@/src/components/ui/explain-hint";

type FollowupItem = {
  id: string;
  lead_id: string;
  lead_name?: string | null;
  note: string;
  due_at?: string | null;
  done?: boolean | null;
};

type Props = {
  followups: FollowupItem[];
  onMarkDone: (id: string) => Promise<void>;
  onSnooze: (id: string, days: number) => Promise<void>;
};

const tabs = [
  { id: "due", label: "Due" },
  { id: "done", label: "Done" },
];

export default function FollowupsClient({ followups, onMarkDone, onSnooze }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("due");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const showToast = useToast();

  const dueList = useMemo(
    () =>
      followups
        .filter((f) => !f.done)
        .sort((a, b) => (a.due_at && b.due_at ? +new Date(a.due_at) - +new Date(b.due_at) : 0)),
    [followups],
  );
  const doneList = useMemo(() => followups.filter((f) => f.done), [followups]);

  const visible = activeTab === "due" ? dueList : doneList;

  const handleAction = (id: string, action: "done" | "snooze") => {
    startTransition(async () => {
      try {
        setPendingId(id);
        if (action === "done") {
          await onMarkDone(id);
          showToast("Marked done", "success");
        } else {
          await onSnooze(id, 2);
          showToast("Snoozed +2 days", "success");
        }
      } catch {
        showToast("Could not update follow-up", "error");
      } finally {
        setPendingId(null);
      }
    });
  };

  return (
    <Card className="border-white/70 bg-white/90 shadow-md ring-1 ring-neutral-100 backdrop-blur">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-neutral-900">
            {activeTab === "due" ? "Due follow-ups" : "Done follow-ups"}
          </p>
          <ExplainHint target="followups.autoCreate" />
          <Tabs tabs={tabs as any} activeId={activeTab} onChange={(id) => setActiveTab(id as any)} />
        </div>

        {visible.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-200 p-4 text-sm text-neutral-700">
            {activeTab === "due" ? "Nothing due. Keep going." : "No completed follow-ups yet."}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((item) => (
              <div key={item.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-neutral-900">
                      <SensitiveText text={item.lead_name || "Lead"} id={item.lead_id} />
                    </p>
                    <p className="text-sm text-neutral-800">
                      <SensitiveText text={item.note} mask="note" />
                    </p>
                    <p className="text-xs text-neutral-500">
                      {item.due_at ? `Due ${format(new Date(item.due_at), "MMM d, h:mma")}` : "No due date"}
                    </p>
                  </div>
                  <Badge variant={item.done ? "muted" : "warning"}>{item.done ? "Done" : "Due"}</Badge>
                </div>
                {activeTab === "due" ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isPending && pendingId === item.id}
                      onClick={() => handleAction(item.id, "done")}
                    >
                      Mark done
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending && pendingId === item.id}
                      onClick={() => handleAction(item.id, "snooze")}
                    >
                      Snooze +2 days
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <a href={`/tanjia/leads/${item.lead_id}`}>Open lead</a>
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
