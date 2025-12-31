import type { Metadata } from "next";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { PageHeader } from "@/src/components/ui/page-header";
import PresentationClient from "./presentation-client";

export const metadata: Metadata = {
  title: "Presentation - 2ndmynd",
  description: "Client-safe view of what 2ndmynd and a 2nd Look offer.",
  robots: { index: false, follow: false },
};

export default function PresentationPage() {
  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Presentation"
        anchor="Client-safe"
        eyebrow="Tanjia"
        description="Share what 2ndmynd and a 2nd Look are without exposing lead data."
        size="lg"
      />
      <PresentationClient secondLookUrl={tanjiaConfig.secondLookUrl} />
    </div>
  );
}
