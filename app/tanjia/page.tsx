import type { Metadata } from "next";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { GradientHeading } from "@/src/components/ui/gradient-heading";
import { HubCard } from "@/src/components/ui/hub-card";
import { PageShell } from "@/src/components/ui/page-shell";
import { loopLine } from "@/app/tanjia/lib/zones";
import Link from "next/link";

export const metadata: Metadata = {
  title: "2ndmynd Hub",
  description: "Listen. Clarify. Map. Decide. Support.",
};

export default async function TanjiaHubPage() {
  await requireAuthOrRedirect();

  return (
    <PageShell maxWidth="md" className="min-h-[70vh] justify-center px-5 py-10 sm:px-6 sm:py-16">
      <div className="space-y-3 text-neutral-900">
        <GradientHeading
          leading="What do you"
          anchor="need"
          trailing="right now?"
          size="xl"
        />
        <p className="text-sm text-neutral-500 max-w-sm mx-auto text-center">
          {loopLine}
        </p>
      </div>

      <div className="grid gap-4">
        <HubCard
          title="I'm in a conversation"
          subtitle="See what they've said and your calm next step."
          href="/tanjia/listen"
          delay={0.05}
        />
        
        <HubCard
          title="I need to decide what's next"
          subtitle="View your queue and pick one move."
          href="/tanjia/decide"
          delay={0.1}
        />
        
        <HubCard
          title="I want to research someone"
          subtitle="Map their world before reaching out."
          href="/tanjia/map"
          delay={0.15}
        />
        
        <HubCard
          title="I need words for this"
          subtitle="Draft a reply, intro script, or check-in."
          href="/tanjia/support"
          delay={0.2}
        />
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <Link
          href="/tanjia/present"
          className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          Show someone what 2ndmynd does →
        </Link>
        <Link
          href="/tanjia/system"
          className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          System Overview
        </Link>
      </div>
    </PageShell>
  );
}
