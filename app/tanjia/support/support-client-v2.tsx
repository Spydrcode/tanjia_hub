'use client';

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Loader2, MessageSquare, User, Lightbulb, Copy, Check } from "lucide-react";
import { DirectorHeaderStrip } from "@/src/components/tanjia/director/director-header-strip";
import { useDirectorSnapshot } from "@/src/hooks/use-director-snapshot";
import { formatDistanceToNow } from "date-fns";

type Props = {
  leads: Array<{ id: string; name: string; website?: string; notes?: string }>;
  selectedLeadId?: string;
};

const INTENTS = [
  { key: 'first_reach', label: 'First reach-out', tone: 'Calm introduction' },
  { key: 'followup', label: 'Follow-up', tone: 'Gentle check-in' },
  { key: 'reschedule', label: 'Reschedule', tone: 'Understanding + next step' },
  { key: 'gentle_nudge', label: 'Gentle nudge', tone: 'Soft reminder' },
] as const;

export function SupportClientV2({ leads, selectedLeadId }: Props) {
  const { snapshot, loading } = useDirectorSnapshot();
  const [leadId, setLeadId] = useState(selectedLeadId || '');
  const [intent, setIntent] = useState<string>('followup');
  const [generating, setGenerating] = useState(false);
  const [drafts, setDrafts] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const selectedLead = leads.find(l => l.id === leadId);

  // Get lead context from snapshot
  const leadContext = snapshot?.recentActivity.latestMessages.find(m => m.leadId === leadId);

  const handleGenerate = async () => {
    if (!leadId) return;
    
    setGenerating(true);
    try {
      const response = await fetch('/api/tanjia/networking/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          intent,
          context: leadContext?.body,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const data = await response.json();
      setDrafts(data.drafts || []);
    } catch (error) {
      console.error('Generate error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = async (draftText: string) => {
    if (!leadId) return;

    try {
      const response = await fetch('/api/tanjia/networking/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          intent,
          draft: draftText,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      // Refresh snapshot to show draft in recent activity
      window.location.reload();
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {snapshot && <DirectorHeaderStrip metrics={{
        ...snapshot.today.dueNow,
        leadsNeedingResearch: snapshot.pipeline.leadsNeedingResearch
      }} />}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Context + Intent */}
        <div className="space-y-6">
          {/* Lead Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5" />
                Who Are You Writing To?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Select a lead...</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>{lead.name}</option>
                ))}
              </select>

              {selectedLead && (
                <Link
                  href={`/tanjia/leads/${selectedLead.id}`}
                  className="mt-2 inline-block text-xs text-neutral-500 hover:text-neutral-700"
                >
                  View lead profile →
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Lead Context Snapshot */}
          {selectedLead && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What We Know</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedLead.website && (
                  <div>
                    <p className="text-xs font-medium text-neutral-600">Website</p>
                    <p className="text-sm text-neutral-900">{selectedLead.website}</p>
                  </div>
                )}

                {selectedLead.notes && (
                  <div>
                    <p className="text-xs font-medium text-neutral-600">Notes</p>
                    <p className="text-sm text-neutral-700">{selectedLead.notes.slice(0, 200)}</p>
                  </div>
                )}

                {leadContext && (
                  <div>
                    <p className="text-xs font-medium text-neutral-600">Last interaction</p>
                    <p className="text-sm text-neutral-700">{leadContext.body.slice(0, 150)}...</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {formatDistanceToNow(new Date(leadContext.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                )}

                {!selectedLead.website && !selectedLead.notes && !leadContext && (
                  <p className="text-sm text-neutral-500">No context yet — add notes or run research</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Intent Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-5 w-5" />
                What's the Intent?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {INTENTS.map(i => (
                  <button
                    key={i.key}
                    onClick={() => setIntent(i.key)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      intent === i.key
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-neutral-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <p className="text-sm font-medium text-neutral-900">{i.label}</p>
                    <p className="text-xs text-neutral-600">{i.tone}</p>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!leadId || generating}
                className="mt-4 w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Drafting...
                  </>
                ) : (
                  'Generate Drafts'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Drafts */}
        <div className="space-y-6">
          {drafts.length === 0 && (
            <Card>
              <CardContent className="flex min-h-[400px] items-center justify-center p-6">
                <div className="text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
                  <p className="text-sm text-neutral-600">Select a lead and intent to generate drafts</p>
                </div>
              </CardContent>
            </Card>
          )}

          {drafts.map((draft, idx) => (
            <Card key={idx} className={idx === 0 ? 'border-2 border-emerald-500' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{idx === 0 ? 'Primary Draft' : `Alternate ${idx}`}</span>
                  <button
                    onClick={() => handleCopy(idx, draft)}
                    className="text-neutral-500 hover:text-neutral-700"
                  >
                    {copied === idx ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-neutral-700 leading-relaxed">
                  {draft}
                </p>

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSave(draft)}
                    className="flex-1"
                  >
                    Save Draft
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleCopy(idx, draft)}
                    className="flex-1"
                  >
                    {copied === idx ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
