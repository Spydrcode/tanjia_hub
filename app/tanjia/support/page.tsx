import type { Metadata } from "next";
import Link from "next/link";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { PageShell } from "@/src/components/ui/page-shell";
import { ZoneHeader } from "@/src/components/ui/zone-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { SupportClient } from "./support-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Support - 2ndmynd",
  description: "How do I communicate this without pressure?",
};

export default async function SupportPage() {
  await requireAuthOrRedirect();
  
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch leads for the selector
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, notes")
    .eq("owner_id", user?.id || "")
    .order("updated_at", { ascending: false })
    .limit(50);

  const formattedLeads = (leads || []).map((l: { id: string; name: string; notes?: string | null }) => ({
    id: l.id,
    name: l.name,
    context: l.notes || undefined,
  }));

  return (
    <PageShell maxWidth="md">
      <ZoneHeader
        zone="support"
        title="Support"
        anchor="Support"
        question="How do I communicate this without pressure?"
        useWhen="You need to reply, follow up, or reach out — and want help finding the right words."
        actions={
          <Link href="/tanjia/decide">
            <Button variant="ghost" size="sm">← Back to Decide</Button>
          </Link>
        }
      />

      <Card className="border-rose-100 bg-rose-50/30 backdrop-blur">
        <CardContent className="p-4">
          <p className="text-sm text-rose-900 font-medium">
            Speak in their language. Stay in yours.
          </p>
          <p className="text-xs text-rose-700 mt-1.5">
            Generate drafts adapted for the channel and intent.
            Copy what helps, edit freely, discard what doesn't.
          </p>
        </CardContent>
      </Card>

      <SupportClient leads={formattedLeads} />

      {/* Navigation */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Link href="/tanjia/decide">
          <Button variant="ghost" size="sm">← Decide</Button>
        </Link>
        <Link href="/tanjia/present">
          <Button variant="ghost" size="sm">Present →</Button>
        </Link>
      </div>
    </PageShell>
  );
}
