import type { Metadata } from "next";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { PageShell } from "@/src/components/ui/page-shell";
import { ZoneHeader } from "@/src/components/ui/zone-header";
import { DecideClientV2 } from "./decide-client-v2";

export const metadata: Metadata = {
  title: "Decide - Tanjia",
  description: "What is the single best move right now?",
};

export default async function DecidePage() {
  await requireAuthOrRedirect();
  
  return (
    <PageShell maxWidth="xl">
      <ZoneHeader
        zone="decide"
        title="Decide"
        anchor="Next Move"
        question="What is the single best move right now?"
        useWhen="When you need clarity on the ONE thing to do next."
      />

      <DecideClientV2 />
    </PageShell>
  );
}
