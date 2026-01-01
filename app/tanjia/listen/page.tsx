import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { PageShell } from "@/src/components/ui/page-shell";
import { ZoneHeader } from "@/src/components/ui/zone-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { SecondLookShare } from "@/src/components/ui/second-look-share";
import { CopyButton } from "@/src/components/ui/copy-button";
import { MessageSquare, Clock, HelpCircle, ArrowRight, Globe, Tag, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Listen - 2ndmynd",
  description: "Stay present, recall context fast, and act calmly.",
};

type ActiveConversation = {
  leadId: string | null;
  nextLeadId: string | null;
  name: string;
  handle: string;
  lastInteractionLabel: string;
  lastTouchpoint: string;
  openThread: string | null;
  suggestedQuestion: string;
  // Signals
  status: string | null;
  website: string | null;
  lastChannel: string | null;
  nextFollowupDue: string | null;
  hasFollowup: boolean;
};

const fallbackConversation: ActiveConversation = {
  leadId: null,
  nextLeadId: null,
  name: "No active lead",
  handle: "Add a lead to get started",
  lastInteractionLabel: "",
  lastTouchpoint: "Once you add leads, their context will appear here.",
  openThread: null,
  suggestedQuestion: "What's been taking the most energy lately?",
  status: null,
  website: null,
  lastChannel: null,
  nextFollowupDue: null,
  hasFollowup: false,
};

const defaultQuestion = "What's been taking the most energy lately?";

function normalizeUrl(input: string) {
  const trimmed = (input || "").trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function safeSnippet(text: string | null | undefined, max = 180) {
  const t = (text || "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function buildHandle(input: { channel?: string | null; website?: string | null; status?: string | null; fallback: string }) {
  const parts: string[] = [];
  if (input.channel) parts.push(input.channel);

  if (!parts.length && input.website) {
    try {
      const url = normalizeUrl(input.website);
      const host = new URL(url).hostname.replace(/^www\./, "");
      if (host) parts.push(host);
    } catch {
      const cleaned = input.website.trim();
      if (cleaned) parts.push(cleaned);
    }
  }

  if (!parts.length && input.status) parts.push(input.status);
  return parts.length ? parts.join(" · ") : input.fallback;
}

function sortLeadsDesc(a: any, b: any) {
  const au = a?.updated_at || "";
  const bu = b?.updated_at || "";
  if (au !== bu) return au > bu ? -1 : 1;
  const ac = a?.created_at || "";
  const bc = b?.created_at || "";
  if (ac !== bc) return ac > bc ? -1 : 1;
  return (a?.id || "") > (b?.id || "") ? -1 : 1;
}

async function loadActiveConversation(supabase: SupabaseClient, ownerId: string, leadParam?: string | null): Promise<ActiveConversation> {
  const fallback = fallbackConversation;

  try {
    const hydrate = async (lead: any, nextLeadId: string | null): Promise<ActiveConversation> => {
      const leadId = lead?.id as string | undefined;
      if (!leadId) return { ...fallback, nextLeadId };

      const { data: lastMessage } = await supabase
        .from("messages")
        .select("body, created_at, channel")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: openFollowup } = await supabase
        .from("followups")
        .select("note, due_at, created_at, done")
        .eq("lead_id", leadId)
        .eq("done", false)
        .order("due_at", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastInteractionDate = lastMessage?.created_at || openFollowup?.created_at || lead.updated_at || lead.created_at;
      const relative = lastInteractionDate ? formatDistanceToNow(new Date(lastInteractionDate), { addSuffix: true }) : "";
      const cleanedRelative = relative.replace(/^about\s+/i, "");

      const lastTouchpoint = safeSnippet(lastMessage?.body) || fallback.lastTouchpoint;
      const openThread = safeSnippet(openFollowup?.note, 140) || null;

      const handle = buildHandle({
        channel: lastMessage?.channel,
        website: lead.website,
        status: lead.status,
        fallback: fallback.handle,
      });

      return {
        leadId,
        nextLeadId,
        name: lead.name || fallback.name,
        handle,
        lastInteractionLabel: lastInteractionDate ? `Last touched ${cleanedRelative}` : "",
        lastTouchpoint,
        openThread,
        suggestedQuestion: defaultQuestion,
        // Signals
        status: lead.status || null,
        website: lead.website || null,
        lastChannel: lastMessage?.channel || null,
        nextFollowupDue: openFollowup?.due_at || null,
        hasFollowup: !!openFollowup,
      };
    };

    const { data: orderedLeads } = await supabase
      .from("leads")
      .select("id, name, website, status, updated_at, created_at")
      .eq("owner_id", ownerId)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(20);

    let leads = (orderedLeads || []).slice().sort(sortLeadsDesc);
    let current: any | null = null;

    if (leadParam) {
      current = leads.find((l) => l.id === leadParam) || null;
      if (!current) {
        const { data: fetchedCurrent } = await supabase
          .from("leads")
          .select("id, name, website, status, updated_at, created_at")
          .eq("owner_id", ownerId)
          .eq("id", leadParam)
          .maybeSingle();
        if (fetchedCurrent) {
          current = fetchedCurrent;
          leads = [...leads, fetchedCurrent].sort(sortLeadsDesc);
        }
      }
    }

    if (!current) current = leads[0];

    if (current) {
      const idx = leads.findIndex((l) => l.id === current.id);
      const nextLeadId = idx >= 0 && idx + 1 < leads.length ? leads[idx + 1].id : null;
      return hydrate(current, nextLeadId);
    }

    return fallback;
  } catch {
    return fallback;
  }
}

export default async function ListenPage({ searchParams }: { searchParams?: Promise<{ lead?: string }> }) {
  const { supabase, user } = await requireAuthOrRedirect();
  const params = await searchParams;
  const leadIdParam = params?.lead?.slice(0, 64);
  const conversation = await loadActiveConversation(supabase, user.id, leadIdParam);

  return (
    <PageShell maxWidth="md">
      <ZoneHeader
        zone="listen"
        title="Listen"
        anchor="Listen"
        question="What did they say, and what's the next open thread?"
        useWhen="You are in a live meeting or conversation."
        actions={
          <Link href="/tanjia/present">
            <Button variant="secondary" size="sm">Client-safe view</Button>
          </Link>
        }
      />

      {/* Current Lead Card */}
      <Card className="border-neutral-200 bg-white/90 backdrop-blur shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold text-neutral-900">{conversation.name}</h2>
                {conversation.leadId && (
                  <Link 
                    href={`/tanjia/leads/${conversation.leadId}`}
                    className="text-xs text-neutral-500 hover:text-neutral-700"
                  >
                    View lead →
                  </Link>
                )}
              </div>
              <p className="text-sm text-neutral-600">{conversation.handle}</p>
              {conversation.lastInteractionLabel && (
                <p className="text-xs text-neutral-400 mt-1">{conversation.lastInteractionLabel}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {conversation.nextLeadId ? (
                <Link href={`/tanjia/listen?lead=${conversation.nextLeadId}`}>
                  <Button variant="secondary" size="sm" className="gap-1">
                    Next lead <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              ) : (
                <div className="text-right">
                  <p className="text-xs text-neutral-400 mb-1">No next lead</p>
                  <Link href="/tanjia/leads">
                    <Button variant="ghost" size="sm">Open Leads</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signals Strip */}
      {conversation.leadId && (
        <div className="flex flex-wrap gap-2 text-xs">
          {conversation.status && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">
              <Tag className="h-3 w-3" />
              {conversation.status}
            </span>
          )}
          {conversation.website && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
              <Globe className="h-3 w-3" />
              {(() => {
                try {
                  return new URL(normalizeUrl(conversation.website)).hostname.replace(/^www\./, "");
                } catch {
                  return conversation.website;
                }
              })()}
            </span>
          )}
          {conversation.lastChannel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">
              <MessageSquare className="h-3 w-3" />
              {conversation.lastChannel}
            </span>
          )}
          {conversation.nextFollowupDue && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
              <Calendar className="h-3 w-3" />
              Follow-up {formatDistanceToNow(new Date(conversation.nextFollowupDue), { addSuffix: true })}
            </span>
          )}
        </div>
      )}

      {/* Context Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-neutral-200 bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-neutral-500" />
              <span className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Last mentioned</span>
            </div>
            <p className="text-sm text-neutral-700 leading-relaxed">{conversation.lastTouchpoint}</p>
          </CardContent>
        </Card>
        
        <Card className="border-neutral-200 bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-neutral-500" />
              <span className="text-xs font-medium text-neutral-600 uppercase tracking-wide">Waiting on</span>
            </div>
            <p className="text-sm text-neutral-700 leading-relaxed">
              {conversation.openThread || "Nothing pending — listen."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Suggested Question */}
      <Card className="border-blue-100 bg-blue-50/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">One question to ask</span>
              </div>
              <p className="text-base font-medium text-blue-900">{conversation.suggestedQuestion}</p>
            </div>
            <CopyButton text={conversation.suggestedQuestion} label="Copy" variant="secondary" />
          </div>
        </CardContent>
      </Card>

      {/* Second Look Share — only show when follow-up exists */}
      {conversation.hasFollowup && (
        <Card className="border-neutral-200 bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <p className="text-sm text-neutral-600 mb-3">
              If helpful, share a clearer way to see how growth has changed what they're carrying.
            </p>
            <SecondLookShare
              url={tanjiaConfig.secondLookUrl}
              note="This gives you a clearer way to see how growth has changed what you're carrying."
            />
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Link href="/tanjia/clarify">
          <Button variant="ghost" size="sm">→ Clarify</Button>
        </Link>
        <Link href="/tanjia/map">
          <Button variant="ghost" size="sm">→ Map</Button>
        </Link>
        <Link href="/tanjia/leads">
          <Button variant="ghost" size="sm">All Leads</Button>
        </Link>
      </div>
    </PageShell>
  );
}
