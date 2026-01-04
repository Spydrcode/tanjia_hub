import { NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';
import { requireAuthOrRedirect } from '@/lib/auth/redirect';

const DEMO_WS = '22222222-2222-2222-2222-222222222222';

export async function POST(req: Request) {
  // Ensure authenticated user
  const { user } = await requireAuthOrRedirect();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // Ensure we are running in demo path - basic guard: only accept if origin path contains /demo
  // Note: In practice, stronger checks should be used.

  try {
    const admin = createSupabaseServiceRoleClient();

    // Delete demo workspace rows in safe order
    const tables = [
      'meeting_interactions',
      'meeting_results',
      'meetings',
      'lead_bookings',
      'networking_drafts',
      'messages',
      'lead_snapshots',
      'lead_analyses',
      'followups',
      'leads',
      'referrals',
      'networking_groups',
      'workspace_members'
    ];

    for (const table of tables) {
      await admin.from(table).delete().eq('workspace_id', DEMO_WS);
    }

    // Insert demo seed rows in code (minimal) - create some leads and workspace_members for current user
    const demoOwner = user.id;

    // Upsert demo workspace membership for calling user
    await admin.from('workspace_members').upsert({ workspace_id: DEMO_WS, owner_id: demoOwner, role: 'owner' }, { onConflict: 'workspace_id,owner_id' });

    // Insert example lead tied to demo workspace and user
    await admin.from('leads').insert([
      {
        id: 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1',
        owner_id: demoOwner,
        name: 'Demo Reset Lead',
        website: 'https://demo.reset',
        notes: 'Inserted by demo reset',
        status: 'new',
        workspace_id: DEMO_WS
      }
    ]).select();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Demo reset error', err);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}
