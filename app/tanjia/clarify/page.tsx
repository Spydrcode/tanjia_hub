import type { Metadata } from "next";
import Link from "next/link";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { PageShell } from "@/src/components/ui/page-shell";
import { ZoneHeader } from "@/src/components/ui/zone-header";
import { Button } from "@/src/components/ui/button";
import { ClarifyClient } from "./clarify-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Clarify - 2ndmynd",
  description: "Help them see what matters most right now.",
};

export default async function ClarifyPage() {
  await requireAuthOrRedirect();
  
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch leads for selector
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name")
    .eq("owner_id", user?.id || "")
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <PageShell maxWidth="md">
      <ZoneHeader
        zone="clarify"
        title="Clarify"
        anchor="Clarify"
        question="What matters most right now?"
        useWhen="You need to understand their real priority before offering anything."
        actions={
          <Link href="/tanjia/listen">
            <Button variant="ghost" size="sm">← Back to Listen</Button>
          </Link>
        }
      />

      <ClarifyClient leads={leads || []} />

      {/* Navigation */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Link href="/tanjia/listen">
          <Button variant="ghost" size="sm">← Listen</Button>
        </Link>
        <Link href="/tanjia/map">
          <Button variant="ghost" size="sm">Map →</Button>
        </Link>
        <Link href="/tanjia/decide">
          <Button variant="ghost" size="sm">Decide →</Button>
        </Link>
      </div>
    </PageShell>
  );
}