import type { Metadata } from "next";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { GradientHeading } from "@/src/components/ui/gradient-heading";
import { HubCard } from "@/src/components/ui/hub-card";
import { loopLine } from "@/app/tanjia/lib/zones";
import Link from "next/link";
import { format } from "date-fns";
import { Composer } from "./components/composer";

export const metadata: Metadata = {
  title: "2ndmynd Hub",
  description: "Listen. Clarify. Map. Decide. Support.",
};

export default async function TanjiaHubPage() {
  const { user } = await requireAuthOrRedirect();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="space-y-3 text-center">
        <GradientHeading
          leading="What do you"
          anchor="need"
          trailing="right now?"
          size="xl"
        />
        <p className="text-sm text-neutral-500 mx-auto max-w-sm">
          {loopLine}
        </p>
      </div>

      {/* Composer - Quick Capture */}
      <div className="mx-auto max-w-2xl">
        <Composer />
      </div>

      {/* Main Action Cards */}
      <div className="mx-auto max-w-2xl">
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
      </div>

      {/* Quick Access Section */}
      <div className="border-t border-neutral-200 pt-8">
        <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-neutral-600">
          Quick Access
        </h2>
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
          <Link
            href="/tanjia/meetings"
            className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-neutral-900">Meetings</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Create, track, and capture meeting insights
            </p>
          </Link>

          <Link
            href="/tanjia/scheduler"
            className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-neutral-900">Scheduler</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Share your Cal.com availability
            </p>
          </Link>

          <Link
            href="/tanjia/leads"
            className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-neutral-900">Leads</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Manage contacts and followups
            </p>
          </Link>
        </div>
      </div>

      {/* Footer Links */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <Link
          href="/tanjia/today"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          View Today's Dashboard →
        </Link>
        <div className="flex gap-4">
          <Link
            href="/tanjia/present"
            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Show what 2ndmynd does
          </Link>
          <Link
            href="/tanjia/system"
            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            System Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
