import type { Metadata } from "next";
import Link from "next/link";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { Button } from "@/src/components/ui/button";
import { GradientHeading } from "@/src/components/ui/gradient-heading";

export const metadata: Metadata = {
  title: "Tanjia",
  description: "Start with listening or a simple explanation.",
};

export default async function TanjiaEntryPage() {
  await requireAuthOrRedirect();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center gap-6 px-5 py-10 sm:px-6 sm:py-16">
      <div className="space-y-3 text-neutral-900">
        <GradientHeading
          leading="What kind of"
          anchor="conversation"
          trailing="are you in?"
          size="xl"
        />
        <p className="text-base text-neutral-700 sm:text-lg">Choose one calm path.</p>
        <p className="text-xs text-neutral-500">The 2ndmynd Loop: Listen → Clarify → Map → Decide → Support</p>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Button
            asChild
            variant="secondary"
            className="w-full justify-start text-left text-lg leading-tight py-7 sm:text-xl sm:leading-tight sm:py-8 border-neutral-300 transition-transform hover:-translate-y-0.5"
          >
            <Link href="/tanjia/explore">Listen and capture context</Link>
          </Button>
          <p className="text-sm text-neutral-600">Use this during a meeting so you stay present and don't miss the room.</p>
        </div>

        <div className="space-y-2">
          <Button
            asChild
            variant="secondary"
            className="w-full justify-start text-left text-lg leading-tight py-7 sm:text-xl sm:leading-tight sm:py-8 border-neutral-300 transition-transform hover:-translate-y-0.5"
          >
            <Link href="/tanjia/introduce">Explain 2ndmynd (Client View)</Link>
          </Button>
          <p className="text-sm text-neutral-600">Use this when someone asks what we do. Calm, clear, shareable.</p>
        </div>

        <div className="pt-2 text-center">
          <Link href="/tanjia/prepare" className="text-sm text-neutral-600 hover:text-neutral-900 underline underline-offset-4">
            Need to log someone quickly? Go to Prepare →
          </Link>
        </div>
      </div>
    </div>
  );
}
