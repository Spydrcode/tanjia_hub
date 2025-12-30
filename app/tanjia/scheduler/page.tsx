import type { Metadata } from "next";
import SchedulerClient from "./scheduler-client";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { PageHeader } from "@/src/components/ui/page-header";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { featureFlags } from "@/src/lib/env";
import { logMessageEvent } from "@/src/lib/scheduling/logging";

export const metadata: Metadata = {
  title: "Scheduler",
  description: "Schedule time with Cal.com inside Tanjia.",
  robots: { index: false, follow: false },
};

type SearchParams = {
  leadId?: string;
  leadName?: string;
  leadEmail?: string;
  duration?: string;
  source?: string;
};

export default async function SchedulerPage({ searchParams }: { searchParams?: SearchParams }) {
  const { supabase, user } = await requireAuthOrRedirect();
  const params = await searchParams;
  const leadId = params?.leadId;
  let leadName = params?.leadName;
  let leadEmail = params?.leadEmail;
  const source = params?.source || "scheduler_page";

  if (!featureFlags.showcaseMode && leadId && (!leadName || !leadEmail)) {
    const { data } = await supabase.from("leads").select("name, email").eq("id", leadId).single();
    leadName = leadName || data?.name || undefined;
    leadEmail = leadEmail || data?.email || undefined;
  }

  await logMessageEvent({
    supabase,
    ownerId: user?.id,
    leadId: leadId || null,
    messageType: "schedule_opened",
    metadata: { source },
    channel: "system",
    intent: "schedule",
  });

  const defaultDuration = params?.duration === "30" ? 30 : 15;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Schedule time"
        anchor="Calm link"
        eyebrow="Tanjia"
        description="Pick the smallest slot that fits. We'll keep it simple."
        actionHref="/tanjia"
        actionLabel="Back to hub"
        actionVariant="ghost"
      />

      <SchedulerClient
        calLinks={{ "15": tanjiaConfig.calEvent15Url, "30": tanjiaConfig.calEvent30Url }}
        defaultDuration={defaultDuration as 15 | 30}
        leadContext={{ id: leadId, name: leadName, email: leadEmail }}
        userId={user?.id}
        bookingRedirectUrl={tanjiaConfig.calBookingRedirectUrl}
      />
    </div>
  );
}
