'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, MessageSquare, Sparkles, Mail, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { SecondLookShare } from "@/src/components/ui/second-look-share";
import { tanjiaConfig } from "@/lib/tanjia-config";

type Lead = {
  id: string;
  name: string;
  context?: string;
};

type Channel = "comment" | "dm" | "followup";
type Intent = "reply" | "invite" | "support" | "nurture" | "clarify";

type Props = {
  leads: Lead[];
};

const channelConfig: Record<Channel, { label: string; icon: typeof MessageSquare; description: string }> = {
  comment: {
    label: "Public comment",
    icon: MessageSquare,
    description: "Reply to their post or comment (social)",
  },
  dm: {
    label: "Direct message",
    icon: Mail,
    description: "Private message or email",
  },
  followup: {
    label: "Follow-up plan",
    icon: Sparkles,
    description: "Generate a sequence of touch points",
  },
};

const intentLabels: Record<Intent, string> = {
  reply: "Reply to what they said",
  invite: "Invite next step",
  support: "Offer support",
  nurture: "Nurture relationship",
  clarify: "Clarify understanding",
};

export function SupportClient({ leads }: Props) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [channel, setChannel] = useState<Channel>("comment");
  const [intent, setIntent] = useState<Intent>("reply");
  const [inputText, setInputText] = useState("");
  const [notes, setNotes] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [followupPlan, setFollowupPlan] = useState<{ when: string; text: string }[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setError("Please enter what they said or posted");
      return;
    }
    
    setIsGenerating(true);
    setDraft(null);
    setFollowupPlan(null);
    setError(null);

    try {
      const endpoint = `/api/tanjia/${channel === "followup" ? "followup-plan" : channel === "dm" ? "dm-reply" : "comment-reply"}`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          intent,
          what_they_said: inputText.trim(),
          notes: notes.trim() || null,
          leadId: selectedLeadId || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate reply");
      }

      const data = await response.json();
      
      if (channel === "followup" && data.plan) {
        setFollowupPlan(data.plan.followups || []);
        setDraft(data.plan.next_action || null);
      } else {
        setDraft(data.reply || data.output || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate reply");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Lead Selection (optional) */}
      <Card className="border-neutral-200 bg-white/80 backdrop-blur">
        <CardContent className="p-4 space-y-3">
          <label className="text-sm font-medium text-neutral-700">
            Who are you supporting? (optional)
          </label>
          <select
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            <option value="">No specific lead</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name}
              </option>
            ))}
          </select>
          {selectedLead?.context && (
            <p className="text-xs text-neutral-500">Context: {selectedLead.context}</p>
          )}
        </CardContent>
      </Card>

      {/* Channel Selection */}
      <Card className="border-neutral-200 bg-white/80 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-neutral-700">What kind of reply?</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(channelConfig) as [Channel, typeof channelConfig[Channel]][]).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => { setChannel(key); setDraft(null); setFollowupPlan(null); }}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    channel === key
                      ? 'border-rose-300 bg-rose-50 text-rose-900'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mb-1.5" />
                  <p className="text-xs font-medium">{config.label}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Intent Selection */}
      <Card className="border-neutral-200 bg-white/80 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-neutral-700">What's your intent?</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(intentLabels) as [Intent, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setIntent(key)}
                className={`px-3 py-2 rounded-lg border text-left text-sm transition-colors ${
                  intent === key
                    ? 'border-rose-300 bg-rose-50 text-rose-900 font-medium'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Input */}
      <Card className="border-neutral-200 bg-white/80 backdrop-blur">
        <CardContent className="p-4 space-y-3">
          <label className="text-sm font-medium text-neutral-700">
            What did they say? (paste their post or message)
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste their post, comment, or message here..."
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm resize-none focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            rows={4}
          />
          
          <label className="text-sm font-medium text-neutral-700">
            Any notes or context? (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Background, what you want to convey, etc."
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm resize-none focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            rows={2}
          />

          {error && (
            <p className="text-sm text-rose-600">{error}</p>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !inputText.trim()}
            className="w-full bg-rose-600 text-white hover:bg-rose-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate reply"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Draft */}
      {draft && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-rose-200 bg-rose-50/50 backdrop-blur">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-rose-900">
                  {channel === "followup" ? "Next action" : "Your reply"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(draft, "draft")}
                  className="text-rose-700 hover:bg-rose-100"
                >
                  {copied === "draft" ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied === "draft" ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-white rounded-md border border-rose-100 p-4">
                <pre className="text-sm text-neutral-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {draft}
                </pre>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Follow-up Plan */}
      {followupPlan && followupPlan.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-rose-200 bg-rose-50/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-rose-900">Follow-up sequence</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {followupPlan.map((step, i) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded-md border border-rose-100 p-3">
                  <span className="text-xs font-medium text-rose-600 bg-rose-100 px-2 py-1 rounded shrink-0">
                    {step.when}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-neutral-800">{step.text}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(step.text, `step-${i}`)}
                    className="shrink-0 text-rose-700 hover:bg-rose-100"
                  >
                    {copied === `step-${i}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Share with Second Look */}
      <Card className="border-rose-100 bg-rose-50/30 backdrop-blur">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-rose-800 mb-3">
            Share Second Look
          </h4>
          <SecondLookShare
            url={tanjiaConfig.secondLookUrl}
            note="This gives you a clearer way to see how growth has changed what you're carrying."
          />
        </CardContent>
      </Card>
    </div>
  );
}