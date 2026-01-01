"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";

import { CopyButton } from "@/src/components/ui/copy-button";
import { SecondLookShare } from "@/src/components/ui/second-look-share";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { Users, Lightbulb, Heart, HelpCircle, Check, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Lead {
  id: string;
  name: string;
}

interface Beliefs {
  notAlone: boolean;
  pathForward: boolean;
  hereToHelp: boolean;
}

interface ClarifyClientProps {
  leads: Lead[];
  initialLeadId?: string;
  initialBeliefs?: Beliefs;
}

const triadItems = [
  {
    key: "notAlone" as const,
    icon: Users,
    title: "You're not alone",
    description: "Other founders carry the same weight. What you're feeling is normal.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    borderChecked: "border-violet-300",
  },
  {
    key: "pathForward" as const,
    icon: Lightbulb,
    title: "There's a path forward",
    description: "The quickest improvement is usually smaller than you think.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    borderChecked: "border-amber-300",
  },
  {
    key: "hereToHelp" as const,
    icon: Heart,
    title: "We're here to help, not sell",
    description: "No pitch. No pressure. Just clarity when you're ready.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    borderChecked: "border-emerald-300",
  },
];

const clarifyingQuestions = [
  "What would make the biggest difference in the next 30 days?",
  "Where does the most friction come from right now?",
  "What's the one thing you wish someone else could just handle?",
  "If you had an extra 10 hours a week, where would you spend them?",
];

export function ClarifyClient({ leads, initialLeadId, initialBeliefs }: ClarifyClientProps) {
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId || "");
  const [beliefs, setBeliefs] = useState<Beliefs>(
    initialBeliefs || { notAlone: false, pathForward: false, hereToHelp: false }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const suggestedQuestion = clarifyingQuestions[0];
  const nextQuestion = clarifyingQuestions[1];

  const allBelieved = beliefs.notAlone && beliefs.pathForward && beliefs.hereToHelp;
  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  const handleBeliefChange = (key: keyof Beliefs, checked: boolean) => {
    setBeliefs((prev) => ({ ...prev, [key]: checked }));
    setSaved(false);
  };

  const saveBeliefs = async () => {
    if (!selectedLeadId) return;
    
    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Get the most recent analysis for this lead
      const { data: analysis } = await supabase
        .from("lead_analyses")
        .select("id, metadata")
        .eq("lead_id", selectedLeadId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (analysis) {
        // Update existing analysis metadata
        await supabase
          .from("lead_analyses")
          .update({
            metadata: {
              ...(analysis.metadata || {}),
              beliefs,
              beliefs_updated_at: new Date().toISOString(),
            },
          })
          .eq("id", analysis.id);
      } else {
        // Create a new analysis record just for beliefs
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("lead_analyses").insert({
            owner_id: user.id,
            lead_id: selectedLeadId,
            metadata: {
              beliefs,
              beliefs_updated_at: new Date().toISOString(),
            },
          });
        }
      }
      
      setSaved(true);
    } catch (err) {
      console.error("Failed to save beliefs:", err);
    } finally {
      setSaving(false);
    }
  };

  const loadBeliefs = async (leadId: string) => {
    if (!leadId) {
      setBeliefs({ notAlone: false, pathForward: false, hereToHelp: false });
      return;
    }
    
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: analysis } = await supabase
        .from("lead_analyses")
        .select("metadata")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (analysis?.metadata?.beliefs) {
        setBeliefs(analysis.metadata.beliefs);
      } else {
        setBeliefs({ notAlone: false, pathForward: false, hereToHelp: false });
      }
    } catch {
      setBeliefs({ notAlone: false, pathForward: false, hereToHelp: false });
    }
  };

  const handleLeadChange = (leadId: string) => {
    setSelectedLeadId(leadId);
    setSaved(false);
    startTransition(() => {
      loadBeliefs(leadId);
    });
  };

  return (
    <div className="space-y-6">
      {/* Lead Selector */}
      {leads.length > 0 && (
        <Card className="border-neutral-200 bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide block mb-2">
              Tracking beliefs for
            </label>
            <select
              value={selectedLeadId}
              onChange={(e) => handleLeadChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
            >
              <option value="">Select a lead...</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {/* Clarifying Question */}
      <Card className="border-violet-100 bg-violet-50/50 backdrop-blur">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="h-5 w-5 text-violet-600" />
                <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
                  Clarifying Question
                </span>
              </div>
              <p className="text-lg font-medium text-violet-900 mb-4">
                &quot;{suggestedQuestion}&quot;
              </p>
              <p className="text-sm text-violet-700">
                Ask this to surface their real priority. Don&apos;t solve yet—just listen.
              </p>
            </div>
            <CopyButton text={suggestedQuestion} label="Copy" variant="secondary" />
          </div>
        </CardContent>
      </Card>

      {/* The Triad - now with checkboxes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            What they need to believe
          </h3>
          {selectedLeadId && (
            <span className="text-xs text-neutral-500">
              {Object.values(beliefs).filter(Boolean).length}/3 confirmed
            </span>
          )}
        </div>
        <div className="grid gap-3">
          {triadItems.map((item) => {
            const Icon = item.icon;
            const isChecked = beliefs[item.key];
            return (
              <Card 
                key={item.key} 
                className={`border-neutral-200 ${item.bg}/30 backdrop-blur transition-all ${
                  isChecked ? item.borderChecked + " ring-1 ring-offset-1" : ""
                }`}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  {selectedLeadId && (
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleBeliefChange(item.key, e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-neutral-300"
                    />
                  )}
                  <div className={`rounded-lg p-2 ${item.bg}`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-neutral-900">{item.title}</h4>
                    <p className="text-sm text-neutral-600 mt-0.5">{item.description}</p>
                  </div>
                  <CopyButton text={item.description} size="sm" />
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Save button */}
        {selectedLeadId && (
          <div className="flex items-center gap-3 pt-2">
            <Button 
              onClick={saveBeliefs} 
              disabled={saving}
              size="sm"
              variant={saved ? "secondary" : "primary"}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved
                </>
              ) : (
                "Save Progress"
              )}
            </Button>
            {allBelieved && (
              <span className="text-sm text-emerald-600 font-medium">
                ✓ Ready to proceed
              </span>
            )}
          </div>
        )}
      </div>

      {/* Next Best Question */}
      <Card className="border-neutral-200 bg-white/80 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">
                If they&apos;re ready to go deeper
              </h4>
              <p className="text-base text-neutral-800 font-medium">
                &quot;{nextQuestion}&quot;
              </p>
            </div>
            <CopyButton text={nextQuestion} size="sm" />
          </div>
        </CardContent>
      </Card>

      {/* Second Look Offer */}
      <Card className="border-emerald-100 bg-emerald-50/30 backdrop-blur">
        <CardContent className="p-5">
          <h4 className="text-sm font-semibold text-emerald-800 mb-2">
            Permission-based next step
          </h4>
          <p className="text-sm text-emerald-700 mb-4">
            &quot;If you&apos;d find it helpful, I can take a quiet look at what you&apos;re carrying and share a few thoughts. No pitch—just a clearer picture.&quot;
          </p>
          <SecondLookShare
            url={tanjiaConfig.secondLookUrl}
            note="This gives you a clearer way to see how growth has changed what you're carrying."
          />
        </CardContent>
      </Card>
    </div>
  );
}
