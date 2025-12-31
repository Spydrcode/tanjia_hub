'use client';

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input, Textarea } from "@/src/components/ui/input";
import { useToast } from "@/src/components/ui/toast";
import { useViewModes } from "@/src/components/ui/view-modes";

export default function EMythClient() {
  const [aim, setAim] = useState({ statement: "", non_negotiables: ["", "", ""], avoidances: ["", "", ""] });
  const [taskOutput, setTaskOutput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [plays, setPlays] = useState<{ label: string; output: string; ts: number }[]>([]);
  const toast = useToast();
  const { presentationMode } = useViewModes();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("emythPlays");
    if (stored) {
      try {
        setPlays(JSON.parse(stored));
      } catch {
        setPlays([]);
      }
    }
  }, []);

  const saveAim = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tanjia/emyth/primary-aim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aim),
      });
      if (!res.ok) throw new Error("Save failed");
      toast("Saved", "success");
    } catch {
      toast("Could not save", "error");
    } finally {
      setLoading(false);
    }
  };

  const savePlay = () => {
    if (!taskOutput) return;
    const label = window.prompt("Label this play?") || "Saved play";
    const next = [...plays, { label, output: taskOutput, ts: Date.now() }];
    setPlays(next);
    if (typeof window !== "undefined") window.localStorage.setItem("emythPlays", JSON.stringify(next));
    toast("Play saved", "success");
  };

  const loadPlay = (label: string) => {
    const found = plays.find((p) => p.label === label);
    if (found) setTaskOutput(found.output);
  };

  const runTask = async (task: "role_map" | "on_vs_in" | "follow_through") => {
    setLoading(true);
    try {
      const res = await fetch("/api/tanjia/emyth/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, leadId: null, pastedText: aim.statement, notes: aim.statement, mode: "prospecting" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Run failed");
      setTaskOutput(JSON.stringify(data.result, null, 2));
      toast("Done", "success");
    } catch {
      toast("Run failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold text-neutral-900">Primary Aim</p>
          <Textarea
            placeholder="Statement"
            value={aim.statement}
            onChange={(e) => setAim((prev) => ({ ...prev, statement: e.target.value }))}
          />
          <div className="grid gap-2 md:grid-cols-2">
            {aim.non_negotiables.map((item, idx) => (
              <Input
                key={`n-${idx}`}
                placeholder={`Non-negotiable ${idx + 1}`}
                value={item}
                onChange={(e) =>
                  setAim((prev) => ({
                    ...prev,
                    non_negotiables: prev.non_negotiables.map((v, i) => (i === idx ? e.target.value : v)),
                  }))
                }
              />
            ))}
            {aim.avoidances.map((item, idx) => (
              <Input
                key={`a-${idx}`}
                placeholder={`Avoidance ${idx + 1}`}
                value={item}
                onChange={(e) =>
                  setAim((prev) => ({
                    ...prev,
                    avoidances: prev.avoidances.map((v, i) => (i === idx ? e.target.value : v)),
                  }))
                }
              />
            ))}
          </div>
          <Button onClick={saveAim} disabled={loading}>
            {loading ? "Saving..." : "Save Primary Aim"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold text-neutral-900">Run E-Myth task</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => runTask("role_map")} disabled={loading}>
              Role Map
            </Button>
            <Button size="sm" onClick={() => runTask("on_vs_in")} disabled={loading}>
              On vs In
            </Button>
            <Button size="sm" onClick={() => runTask("follow_through")} disabled={loading}>
              Follow-Through
            </Button>
          </div>
          {taskOutput ? (
            <pre className="rounded-md bg-neutral-900 p-3 text-xs text-white">{taskOutput}</pre>
          ) : (
            <p className="text-sm text-neutral-600">Outputs appear here.</p>
          )}
          {!presentationMode ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={savePlay} disabled={!taskOutput}>
                Save as Play
              </Button>
              {plays.length ? (
                <select
                  className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
                  onChange={(e) => loadPlay(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Load Play
                  </option>
                  {plays.map((p) => (
                    <option key={p.ts} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
