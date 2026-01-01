import type { Metadata } from "next";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { PageShell } from "@/src/components/ui/page-shell";
import { IntentHeader } from "@/src/components/ui/intent-header";
import { IntroduceContent } from "@/app/tanjia/introduce/introduce-content";

export const metadata: Metadata = {
  title: "Scripts - Tanjia",
  description: "Choose the right intro for the conversation.",
  robots: { index: false, follow: false },
};

type IntentKey = "meeting" | "one_to_one" | "followup" | "bni";

const intentCopy: Record<IntentKey, { headline: string; body: string; closing: string }> = {
  meeting: {
    headline: "30-second intro",
    body: "Most owner-led businesses don't struggle because they're doing something wrong. They struggle because growth quietly changes responsibility — without changing the systems around it. 2ndmynd helps owners see what shifted so they can decide what to simplify next.",
    closing: "If it sounds relevant, I can share a link that explains it better than I just did.",
  },
  one_to_one: {
    headline: "For one-to-ones",
    body: "You know how growth changes what you're carrying — more decisions, more coordination, more follow-ups? 2ndmynd gives owners a Second Look at where that pressure is building so they can choose what to simplify, support, or let go.",
    closing: "Curious? I can send you a link that walks through it calmly.",
  },
  followup: {
    headline: "After a conversation",
    body: "Thanks for the conversation. I mentioned 2ndmynd — we help owners see how growth has quietly changed what they're carrying. No new tools, just clarity on what to simplify next.",
    closing: "Here's that link if you want to take a look.",
  },
  bni: {
    headline: "BNI style",
    body: "I help owner-led businesses see what growth has quietly changed. Most owners don't struggle because they're doing something wrong — they struggle because responsibility shifted faster than their systems. I give them a Second Look so they can decide what to simplify.",
    closing: "The best referral is someone who feels heavier than they should. I'll handle the rest calmly.",
  },
};

export default async function IntroducePage({ searchParams }: { searchParams?: Promise<{ intent?: string }> }) {
  const params = await searchParams;
  const intent = (params?.intent as IntentKey) || "meeting";
  const copy = intentCopy[intent] || intentCopy.meeting;

  return (
    <PageShell maxWidth="md">
      <IntentHeader
        badge="Operator only"
        badgeVariant="operator"
        title="Choose your"
        anchor="script"
        subtitle="Pick the intro that fits the conversation. Copy and go."
      />

      <IntroduceContent
        intent={intent}
        copy={copy}
        secondLookUrl={tanjiaConfig.secondLookUrl}
      />
    </PageShell>
  );
}
