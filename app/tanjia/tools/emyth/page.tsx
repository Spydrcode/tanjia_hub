import type { Metadata } from "next";
import EMythClient from "./emyth-client";
import { PageHeader } from "@/src/components/ui/page-header";

export const metadata: Metadata = {
  title: "E-Myth Tools",
  description: "Primary Aim, Role Map, and follow-through.",
  robots: { index: false, follow: false },
};

export default function EMythPage() {
  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="E-Myth tools"
        anchor="System"
        eyebrow="Tanjia"
        description="Primary Aim, Role Map, and follow-through. Client View hides internal outputs."
        size="lg"
      />
      <EMythClient />
    </div>
  );
}
