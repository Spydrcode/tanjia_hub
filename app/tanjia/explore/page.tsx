import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { PageShell } from "@/src/components/ui/page-shell";
import { IntentHeader } from "@/src/components/ui/intent-header";
import { ListenActionZone } from "@/app/tanjia/explore/listen-action-zone";
import { ContextCard } from "@/app/tanjia/explore/context-card";
import { InRoomRail } from "@/app/tanjia/explore/in-room-rail";

export const metadata: Metadata = {
  title: "Listen - Tanjia",
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
};

const fallbackConversation: ActiveConversation = {
  leadId: null,
  nextLeadId: null,
  name: "Avery Chen",
  handle: "@averychen - LinkedIn DM",
  lastInteractionLabel: "Last touched 3 days ago",
  lastTouchpoint: "Posted about struggling to turn warm replies into calm next steps.",
  openThread: "Waiting on your take for their cold DM draft before they send it.",
  suggestedQuestion: "What's been taking the most energy lately?",
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
  return t.length > max ? `${t.slice(0, max - 1)}...` : t;
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

  return parts.length ? parts.join(" - ") : input.fallback;
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
        lastInteractionLabel: lastInteractionDate ? `Last touched ${cleanedRelative}` : fallback.lastInteractionLabel,
        lastTouchpoint,
        openThread,
        suggestedQuestion: defaultQuestion,
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
          .order("updated_at", { ascending: false })
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (fetchedCurrent) {
          current = fetchedCurrent;
          leads = [...leads, fetchedCurrent].sort(sortLeadsDesc);
        }
      }
    }

    if (!current) {
      current = leads[0];
    }

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
      <IntentHeader
        badge="Listen"
        badgeVariant="listen"
        title="Read one line. Ask one question."
        subtitle="Stay present."
      />

      <div className="flex items-center gap-3">
        <Link
          href="/tanjia/prepare"
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-200"
        >
          Tools
        </Link>
        <Link
          href="/tanjia/leads"
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-200"
        >
          Leads
        </Link>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold leading-tight text-neutral-900 sm:text-3xl">{conversation.name}</h2>
            <p className="text-sm text-neutral-600">{conversation.handle}</p>
            <p className="text-xs text-neutral-500">{conversation.lastInteractionLabel}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {conversation.nextLeadId ? (
              <Link 
                href={`/tanjia/explore?lead=${conversation.nextLeadId}`} 
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800"
              >
                Next lead
              </Link>
            ) : (
              <Link 
                href="/tanjia/leads" 
                className="text-xs text-neutral-500 hover:text-neutral-700"
              >
                No next - open Leads
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <ContextCard
          icon="message"
          title="Last thing they mentioned"
          content={conversation.lastTouchpoint}
        />
        <ContextCard
          icon="clock"
          title="Waiting on"
          content={conversation.openThread || "Nothing pending - listen."}
        />
      </div>

      <ListenActionZone 
        question={conversation.suggestedQuestion} 
        secondLookUrl={tanjiaConfig.secondLookUrl} 
      />

      <InRoomRail />
    </PageShell>
  );
}
