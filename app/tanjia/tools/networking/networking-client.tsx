'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, UserPlus } from "lucide-react";
import { PageShell } from "@/src/components/ui/page-shell";
import { IntentHeader } from "@/src/components/ui/intent-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ProgressStepper, Step } from "@/src/components/ui/progress-stepper";
import { OutputCard } from "@/src/components/ui/output-card";
import { SecondLookShare } from "@/src/components/ui/second-look-share";
import { tanjiaConfig } from "@/lib/tanjia-config";

type Lead = {
  id: string;
  name: string;
  website?: string | null;
};

type NetworkingResult = {
  reply: string;
  followupQuestion: string;
  secondLookNote: string;
};

type Props = {
  leads: Lead[];
};

const channels = [
  { value: "comment", label: "Comment reply" },
  { value: "dm", label: "Direct message" },
  { value: "email", label: "Email" },
];

const goals = [
  { value: "reflect", label: "Reflect what they said" },
  { value: "invite", label: "Invite them to share more" },
  { value: "schedule", label: "Suggest a time to talk" },
  { value: "encourage", label: "Offer encouragement" },
];

export function NetworkingClient({ leads }: Props) {
  const [inputText, setInputText] = useState("");
  const [channel, setChannel] = useState("dm");
  const [goal, setGoal] = useState("reflect");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<NetworkingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Save to lead state
  const [showSave, setShowSave] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadWebsite, setNewLeadWebsite] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const steps: Step[] = [
    { label: "Reading", status: isProcessing && !result ? (inputText ? "complete" : "active") : (result ? "complete" : "pending") },
    { label: "Choosing", status: isProcessing && !result ? "active" : (result ? "complete" : "pending") },
    { label: "Drafting", status: isProcessing && !result ? "pending" : (result ? "complete" : "pending") },
  ];

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/tanjia/networking/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          intent: goal,
          what_they_said: inputText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate reply");
      }

      const data = await response.json();
      setResult({
        reply: data.reply || "",
        followupQuestion: data.followupQuestion || "",
        secondLookNote: data.secondLookNote || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    
    setIsSaving(true);
    try {
      const response = await fetch("/api/tanjia/networking/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLeadId,
          newLeadName: !selectedLeadId ? newLeadName : undefined,
          newLeadWebsite: !selectedLeadId ? newLeadWebsite : undefined,
          channel,
          goal,
          inputText,
          reply: result.reply,
          followupQuestion: result.followupQuestion,
          secondLookNote: result.secondLookNote,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setSaveSuccess(true);
      setShowSave(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageShell maxWidth="lg">
      <IntentHeader
        badge="Operator"
        badgeVariant="operator"
        title="Networking"
        anchor="Replies"
        subtitle="Paste a post or DM you want to respond to. Get a calm, thoughtful reply."
        backHref="/tanjia/tools"
        backLabel="Back to Tools"
      />

      {/* Input Section */}
      <Card className="border-neutral-200 bg-white/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-neutral-900">
            What did they say?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste the post, DM, or comment here..."
            className="h-32 w-full resize-none rounded-md border border-neutral-200 bg-white p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {channels.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {goals.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!inputText.trim() || isProcessing}
            className="w-full bg-neutral-900 text-white hover:bg-neutral-800"
          >
            {isProcessing ? "Generating..." : "Generate calm reply"}
          </Button>
        </CardContent>
      </Card>

      {/* Progress Section */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-neutral-200 bg-white/80 backdrop-blur">
            <CardContent className="py-4">
              <ProgressStepper steps={steps} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4">
              <p className="text-sm text-red-700">{error}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results Section */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <OutputCard
            title="Your reply"
            fields={[
              { label: "Reply", value: result.reply },
              { label: "Follow-up question", value: result.followupQuestion },
            ]}
          />

          <Card className="border-neutral-200 bg-white/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-neutral-900">
                Share Second Look
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SecondLookShare
                url={tanjiaConfig.secondLookUrl}
                note={result.secondLookNote || tanjiaConfig.whatIsSecondLookOneSentence}
              />
            </CardContent>
          </Card>

          {/* Save Action */}
          <Card className="border-neutral-200 bg-white/80 backdrop-blur">
            <CardContent className="py-4">
              {saveSuccess ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <span>✓</span>
                  <span>Saved successfully</span>
                </div>
              ) : !showSave ? (
                <Button
                  variant="secondary"
                  onClick={() => setShowSave(true)}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save to lead
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700">
                      Select existing lead
                    </label>
                    <select
                      value={selectedLeadId || ""}
                      onChange={(e) => setSelectedLeadId(e.target.value || null)}
                      className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">Create new lead instead</option>
                      {leads.map((lead) => (
                        <option key={lead.id} value={lead.id}>{lead.name}</option>
                      ))}
                    </select>
                  </div>

                  {!selectedLeadId && (
                    <div className="space-y-3 rounded-md border border-neutral-100 bg-neutral-50 p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                        <UserPlus className="h-4 w-4" />
                        Quick create lead
                      </div>
                      <input
                        type="text"
                        placeholder="Name"
                        value={newLeadName}
                        onChange={(e) => setNewLeadName(e.target.value)}
                        className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <input
                        type="text"
                        placeholder="Website (optional)"
                        value={newLeadWebsite}
                        onChange={(e) => setNewLeadWebsite(e.target.value)}
                        className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || (!selectedLeadId && !newLeadName.trim())}
                      className="bg-neutral-900 text-white hover:bg-neutral-800"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowSave(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </PageShell>
  );
}
