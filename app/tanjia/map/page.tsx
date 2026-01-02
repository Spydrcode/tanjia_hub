import type { Metadata } from "next";
import { ZoneHeader } from "@/src/components/ui/zone-header";
import { PageShell } from "@/src/components/ui/page-shell";
import { MapClientV2 } from "./map-client-v2";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Map - Tanjia",
  description: "Where is pressure coming from in the system?",
};

export default async function MapPage() {
  await requireAuthOrRedirect();
  
  return (
    <PageShell maxWidth="xl">
      <ZoneHeader
        zone="map"
        title="Map"
        anchor="Pressure"
        question="Where is pressure coming from in the system?"
        useWhen="When you need to see where things are backing up or stalling."
      />

      <MapClientV2 />
    </PageShell>
  );
}
