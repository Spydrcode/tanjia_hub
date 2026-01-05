import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { DEMO_WORKSPACE_ID } from "@/src/lib/workspaces/constants";
import { Card, CardContent } from "@/src/components/ui/card";
import { PageShell } from "@/src/components/ui/page-shell";
import { IntentHeader } from "@/src/components/ui/intent-header";

export const metadata: Metadata = {
  title: "Demo Referral Details",
  description: "Referral details scoped to demo workspace.",
  robots: { index: false, follow: false },
};

type ReferralDetail = {
  id: string;
  to_name?: string | null;
  from_person?: string | null;
  from_company?: string | null;
  status?: string | null;
  notes?: string | null;
  next_followup_at?: string | null;
};

export default async function DemoReferralDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAuthOrRedirect();

  const { data: referral } = await supabase
    .from("referrals")
    .select("id, to_name, from_person, from_company, status, notes, next_followup_at")
    .eq("id", id)
    .eq("workspace_id", DEMO_WORKSPACE_ID)
    .single();

  if (!referral) {
    return (
      <PageShell maxWidth="lg">
        <IntentHeader title="Referral not found" subtitle="This referral is unavailable." backHref="/demo/referrals" backLabel="Back to Referrals" />
      </PageShell>
    );
  }

  const details: ReferralDetail = referral;
  const nextFollowup = details.next_followup_at
    ? format(new Date(details.next_followup_at), "MMM d, yyyy")
    : "n/a";

  return (
    <PageShell maxWidth="lg">
      <IntentHeader title="Referral Details" subtitle="Demo referral overview." backHref="/demo/referrals" backLabel="Back to Referrals" />

      <Card className="border-neutral-200 bg-white shadow-sm" data-testid="referral-detail">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">{details.to_name || "Referral"}</h2>
            <Link href="/demo/referrals" className="text-sm text-emerald-600">
              Back to Referrals
            </Link>
          </div>
          <div className="grid gap-2 text-sm text-neutral-700">
            <div>
              <span className="text-xs uppercase tracking-wide text-neutral-500">From</span>
              <div>
                {details.from_person || details.from_company || "n/a"}
                {details.from_person && details.from_company ? ` - ${details.from_company}` : ""}
              </div>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-neutral-500">Status</span>
              <div>{details.status || "n/a"}</div>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-neutral-500">Next Follow-up</span>
              <div>{nextFollowup}</div>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-neutral-500">Notes</span>
              <div>{details.notes || "n/a"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
