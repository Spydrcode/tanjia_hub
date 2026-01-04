"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  { key: 'reflect', label: 'Reflect', tone: 'Summarize what they said' },
  { key: 'invite', label: 'Invite', tone: 'Open an invitation' },
  { key: 'schedule', label: 'Schedule', tone: 'Propose a time' },
  { key: 'encourage', label: 'Encourage', tone: 'Friendly nudge' },
];

const CHANNELS = [
  { key: 'comment', label: 'Comment' },
  { key: 'dm', label: 'DM' },
  { key: 'email', label: 'Email' },
];

export function SupportClientV2({ leads, selectedLeadId }: Props) {
  const { snapshot, loading } = useDirectorSnapshot();
  const searchParams = useSearchParams();

  const [leadId, setLeadId] = useState(selectedLeadId || '');
  const [intent, setIntent] = useState<string>('reflect');
  const [channel, setChannel] = useState<string>('comment');
  const [whatTheySaid, setWhatTheySaid] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [followupQuestion, setFollowupQuestion] = useState<string | null>(null);
  const [secondLookNote, setSecondLookNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedLead = leads.find(l => l.id === leadId);
  const leadContext = snapshot?.recentActivity.latestMessages.find(m => m.leadId === leadId);

  // Prefill from composer/sessionStorage or query param
  useEffect(() => {
    try {
      const from = searchParams?.get('from');
      const action = searchParams?.get('composer_action') || sessionStorage.getItem('tanjia_composer_action');
      const stored = sessionStorage.getItem('tanjia_composer_text');
      if (from === 'composer' && stored) {
        setWhatTheySaid(stored);
        // map composer_action to defaults
        if (action === 'reply') {
          setChannel('comment');
          setIntent('reflect');
        }
        // clear keys
        sessionStorage.removeItem('tanjia_composer_text');
        sessionStorage.removeItem('tanjia_composer_action');
      }
    } catch (e) {
      // ignore
    }
  }, [searchParams]);

  const handleGenerate = async () => {
    setGenerating(true);
    setReply(null);
    setFollowupQuestion(null);
    setSecondLookNote(null);

    try {
      const payload: any = {
        channel: channel as 'comment' | 'dm' | 'email',
        intent: intent as 'reflect' | 'invite' | 'schedule' | 'encourage',
        what_they_said: whatTheySaid,
        notes: null,
      };

      if (leadId) payload.leadId = leadId;

      const res = await fetch('/api/tanjia/networking/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Generation failed');

      const data = await res.json();
      setReply(data.reply || data.reply_text || null);
      setFollowupQuestion(data.followupQuestion || data.followup_question || null);
      setSecondLookNote(data.secondLookNote || data.second_look_note || null);
    } catch (err) {
      console.error('Support generate error', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text?: string) => {
    try {
      await navigator.clipboard.writeText(text || reply || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed', e);
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
        <div className="space-y-6">
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
                <option value="">(No lead) — use pasted text only</option>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5" />
                What did they say?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={whatTheySaid}
                onChange={(e) => setWhatTheySaid(e.target.value)}
                placeholder="Paste a message, comment, or call notes…"
                className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                rows={6}
              />

              <div className="mt-3 grid grid-cols-2 gap-2">
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                >
                  {CHANNELS.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>

                <select
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                >
                  {INTENTS.map(i => (
                    <option key={i.key} value={i.key}>{i.label}</option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating || !whatTheySaid.trim()}
                className="mt-4 w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Reply'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {!reply && (
            <Card>
              <CardContent className="flex min-h-[300px] items-center justify-center p-6">
                <div className="text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
                  <p className="text-sm text-neutral-600">Paste text and click "Generate Reply" to draft a response</p>
                </div>
              </CardContent>
            </Card>
          )}

          {reply && (
            <Card className="border-2 border-emerald-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Draft Reply</span>
                  <button
                    onClick={() => handleCopy(reply)}
                    className="text-neutral-500 hover:text-neutral-700"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-neutral-700 leading-relaxed">
                  {reply}
                </p>

                {followupQuestion && (
                  <div className="mt-4 rounded-md border border-neutral-100 bg-neutral-50 p-3">
                    <p className="text-xs font-semibold text-neutral-600">Follow-up question</p>
                    <p className="mt-1 text-sm text-neutral-700">{followupQuestion}</p>
                  </div>
                )}

                {secondLookNote && (
                  <div className="mt-3 rounded-md border border-neutral-100 bg-neutral-50 p-3">
                    <p className="text-xs font-semibold text-neutral-600">Second look note</p>
                    <p className="mt-1 text-sm text-neutral-700">{secondLookNote}</p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleCopy(reply)} className="flex-1">
                    {copied ? 'Copied!' : 'Copy Reply'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
