import type { Metadata } from "next";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { PageShell } from "@/src/components/ui/page-shell";
import { IntentHeader } from "@/src/components/ui/intent-header";
import { ToolCard } from "@/src/components/ui/tool-card";
import { SecondLookShare } from "@/src/components/ui/second-look-share";
import { Card, CardContent } from "@/src/components/ui/card";
import { UserPlus, Users, CalendarClock, MessageSquare, Presentation } from "lucide-react";

export const metadata: Metadata = {
  title: "Tools - Tanjia",
  description: "Operator tools for leads, follow-ups, and replies.",
  robots: { index: false, follow: false },
};

const secondLookNote = "This gives you a clearer way to see how growth has changed what you're carrying.";

export default async function ToolsPage() {
  await requireAuthOrRedirect();

  return (
    <PageShell maxWidth="lg">
      <IntentHeader
        badge="Operator only"
        badgeVariant="operator"
        title="Your"
        anchor="Tools"
        subtitle="Log leads, plan follow-ups, draft replies. Use between meetings."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <ToolCard
          icon={<UserPlus className="h-4 w-4" />}
          title="New Lead"
          useWhen="Use when you just met someone worth following up with."
          href="/tanjia/leads/new"
          ctaLabel="Add lead"
        />

        <ToolCard
          icon={<Users className="h-4 w-4" />}
          title="Leads"
          useWhen="Use when you need to check context before a conversation."
          href="/tanjia/leads"
          ctaLabel="View leads"
          secondaryHref="/tanjia/explore"
          secondaryLabel="Or open Listen"
        />

        <ToolCard
          icon={<CalendarClock className="h-4 w-4" />}
          title="Follow-ups"
          useWhen="Use when you want to see what's due soon."
          href="/tanjia/followups"
          ctaLabel="View follow-ups"
        />

        <ToolCard
          icon={<MessageSquare className="h-4 w-4" />}
          title="Draft Reply"
          useWhen="Use when you need help writing a calm message."
          href="/tanjia/helper"
          ctaLabel="Open helper"
        />

        <ToolCard
          icon={<Presentation className="h-4 w-4" />}
          title="Presentation"
          useWhen="Use when you want to preview what clients see."
          href="/tanjia/present"
          ctaLabel="Open preview"
          secondaryHref="/tanjia/introduce"
          secondaryLabel="Or edit scripts"
        />
      </div>

      <Card className="border-neutral-200 bg-neutral-50/50">
        <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-600">
            Second Look
          </p>
          <p className="text-sm text-neutral-600">
            Share only when they ask for a next step.
          </p>
          <SecondLookShare url={tanjiaConfig.secondLookUrl} note={secondLookNote} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
