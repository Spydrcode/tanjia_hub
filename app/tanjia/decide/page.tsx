import type { Metadata } from "next";
import Link from "next/link";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { PageShell } from "@/src/components/ui/page-shell";
import { ZoneHeader } from "@/src/components/ui/zone-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { DecideClient } from "./decide-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Decide - 2ndmynd",
  description: "What's the smallest calm next move?",
};

export default async function DecidePage() {
  await requireAuthOrRedirect();
  
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch leads for the add form
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name")
    .eq("owner_id", user?.id || "")
    .order("updated_at", { ascending: false })
    .limit(50);

  // Fetch follow-ups with lead names - sorted by due date (nulls last)
  const { data: followupsData } = await supabase
    .from("followups")
    .select(`
      id,
      lead_id,
      note,
      due_at,
      done,
      leads!inner(name, owner_id)
    `)
    .eq("leads.owner_id", user?.id || "")
    .order("done", { ascending: true })
    .order("due_at", { ascending: true, nullsFirst: false });

  const followUps = (followupsData || []).map((f: Record<string, unknown>) => ({
    id: f.id as string,
    leadId: f.lead_id as string,
    leadName: (f.leads as { name: string })?.name || "Unknown",
    note: (f.note as string) || "",
    dueAt: f.due_at as string | null,
    done: f.done as boolean,
  }));

  return (
    <PageShell maxWidth="md">
      <ZoneHeader
        zone="decide"
        title="Decide"
        anchor="Decide"
        question="What's the smallest calm next move?"
        useWhen="You have multiple options and need to pick one action."
        actions={
          <Link href="/tanjia/clarify">
            <Button variant="ghost" size="sm">← Back to Clarify</Button>
          </Link>
        }
      />

      <Card className="border-emerald-100 bg-emerald-50/30 backdrop-blur">
        <CardContent className="p-4">
          <p className="text-sm text-emerald-900 font-medium">
            One calm move at a time.
          </p>
          <p className="text-xs text-emerald-700 mt-1.5">
            This is your queue of follow-ups — ranked so you can focus on 
            just the next thing. Complete it, skip it, or add something new.
          </p>
        </CardContent>
      </Card>

      <DecideClient followUps={followUps} leads={leads || []} />

      {/* Navigation */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Link href="/tanjia/clarify">
          <Button variant="ghost" size="sm">← Clarify</Button>
        </Link>
        <Link href="/tanjia/support">
          <Button variant="ghost" size="sm">Support →</Button>
        </Link>
      </div>
    </PageShell>
  );
}
