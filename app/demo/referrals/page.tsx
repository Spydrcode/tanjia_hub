import { requireAuthOrRedirect } from '@/lib/auth/redirect';
import { PageShell } from '@/src/components/ui/page-shell';
import { ZoneHeader } from '@/src/components/ui/zone-header';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DEMO_WORKSPACE_ID } from '@/src/lib/workspaces/constants';

export default async function DemoReferralsPage() {
  await requireAuthOrRedirect();
  const supabase = await createSupabaseServerClient();

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('workspace_id', DEMO_WORKSPACE_ID)
    .order('created_at', { ascending: false });

  return (
    <PageShell maxWidth="xl">
      <ZoneHeader customBadge="Demo" title="Demo Referrals" anchor="Demo" question="Demo referrals." />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Demo Referrals</h3>
          <Link href="/demo/referrals?action=new" className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white">New Referral</Link>
        </div>

        <div className="grid gap-3" data-testid="referrals-list">
          {(referrals || []).map((r: any) => (
            <div key={r.id} className="rounded-lg border p-3" data-testid="referral-row" data-referral-id={r.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.to_name || r.from_person}</div>
                  <div className="text-sm text-neutral-500">{r.status}</div>
                </div>
                <Link href={`/demo/referrals/${r.id}`} className="text-sm text-emerald-600">Open →</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
