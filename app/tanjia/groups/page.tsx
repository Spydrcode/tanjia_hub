import { requireAuthOrRedirect } from '@/lib/auth/redirect';
import { PageShell } from '@/src/components/ui/page-shell';
import { ZoneHeader } from '@/src/components/ui/zone-header';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const DIRECTOR_WS = '11111111-1111-1111-1111-111111111111';

export default async function GroupsPage() {
  await requireAuthOrRedirect();
  const supabase = await createSupabaseServerClient();

  const { data: groups } = await supabase
    .from('networking_groups')
    .select('*')
    .eq('workspace_id', DIRECTOR_WS)
    .order('created_at', { ascending: false });

  return (
    <PageShell maxWidth="xl">
      <ZoneHeader customBadge="Networking" title="Groups" anchor="Networking" question="Manage recurring groups and attendance." />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Groups</h3>
          <Link href="/tanjia/groups?action=new" className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white">New Group</Link>
        </div>

        <div className="grid gap-3" data-testid="groups-list">
          {(groups || []).map((g: any) => (
            <div key={g.id} className="rounded-lg border p-3" data-testid="group-row" data-group-id={g.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{g.name}</div>
                  {g.location_name && <div className="text-sm text-neutral-500">{g.location_name}</div>}
                </div>
                <Link href={`/tanjia/groups/${g.id}`} className="text-sm text-emerald-600">Open →</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
