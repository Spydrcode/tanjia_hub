import type { Metadata } from "next";
import Link from "next/link";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { DEMO_WORKSPACE_ID } from "@/src/lib/workspaces/constants";
import { Card, CardContent } from "@/src/components/ui/card";
import { PageShell } from "@/src/components/ui/page-shell";
import { IntentHeader } from "@/src/components/ui/intent-header";

export const metadata: Metadata = {
  title: "Demo Group Details",
  description: "Group details scoped to demo workspace.",
  robots: { index: false, follow: false },
};

type GroupDetail = {
  id: string;
  name: string;
  location_name?: string | null;
  address?: string | null;
  cadence?: string | null;
  notes?: string | null;
};

export default async function DemoGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAuthOrRedirect();

  const { data: group } = await supabase
    .from("networking_groups")
    .select("id, name, location_name, address, cadence, notes")
    .eq("id", id)
    .eq("workspace_id", DEMO_WORKSPACE_ID)
    .single();

  if (!group) {
    return (
      <PageShell maxWidth="lg">
        <IntentHeader title="Group not found" subtitle="This group is unavailable." backHref="/demo/groups" backLabel="Back to Groups" />
      </PageShell>
    );
  }

  const details: GroupDetail = group;

  return (
    <PageShell maxWidth="lg">
      <IntentHeader title="Group Details" subtitle="Demo group overview." backHref="/demo/groups" backLabel="Back to Groups" />

      <Card className="border-neutral-200 bg-white shadow-sm" data-testid="group-detail">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">{details.name}</h2>
            <Link href="/demo/groups" className="text-sm text-emerald-600">
              Back to Groups
            </Link>
          </div>
          <div className="grid gap-2 text-sm text-neutral-700">
            <div>
              <span className="text-xs uppercase tracking-wide text-neutral-500">Location</span>
              <div>{details.location_name || "n/a"}</div>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-neutral-500">Address</span>
              <div>{details.address || "n/a"}</div>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-neutral-500">Cadence</span>
              <div>{details.cadence || "n/a"}</div>
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
