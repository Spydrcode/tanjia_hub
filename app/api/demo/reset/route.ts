import { NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';
import { requireAuthOrRedirect } from '@/lib/auth/redirect';
import { DEMO_WORKSPACE_ID } from '@/src/lib/workspaces/constants';
import { DEMO_FIXTURES, DEMO_OWNER_PLACEHOLDER } from '@/src/lib/demo/fixtures';
import { serverEnv } from '@/src/lib/env';

const DEMO_WS = DEMO_WORKSPACE_ID;

export async function POST(req: Request) {
  // Allow a development-only bypass when header `x-dev-bypass: 1` is present.
  // This lets scripts call the reset endpoint without a browser-authenticated session.
  let user: any = null;
  const devBypass = req.headers.get('x-dev-bypass');
  if (devBypass === '1' && process.env.NODE_ENV === 'development') {
    const devOwner = req.headers.get('x-dev-owner') || process.env.DEV_DEMO_OWNER_ID || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    user = { id: devOwner };
  } else {
    const auth = await requireAuthOrRedirect();
    user = auth.user;
  }
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

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

    const demoOwner = user.id;

    // Ensure demo workspace exists
    await admin.from('workspaces').upsert({ id: DEMO_WS, name: 'Demo Workspace', mode: 'demo' }, { onConflict: 'id' });

    // Upsert demo workspace membership for calling user
    await admin.from('workspace_members').upsert({ workspace_id: DEMO_WS, owner_id: demoOwner, role: 'owner' }, { onConflict: 'workspace_id,owner_id' });

    // Insert fixtures deterministically. Overwrite owner_id fields to the calling user.
    const counts: Record<string, number> = {};

    // 1) networking_groups
    const groups = DEMO_FIXTURES.networking_groups.map((r) => ({ ...r }));
    if (groups.length) {
      await admin.from('networking_groups').insert(groups).select();
      counts.networking_groups = groups.length;
    }

    // 2) leads
    const leads = DEMO_FIXTURES.leads.map((r) => ({ ...r, owner_id: demoOwner }));
    if (leads.length) {
      await admin.from('leads').insert(leads).select();
      counts.leads = leads.length;
    }

    // 3) lead_snapshots
    const snapshots = DEMO_FIXTURES.lead_snapshots.map((r) => ({ ...r }));
    if (snapshots.length) {
      await admin.from('lead_snapshots').insert(snapshots).select();
      counts.lead_snapshots = snapshots.length;
    }

    // 4) lead_analyses
    const analyses = DEMO_FIXTURES.lead_analyses.map((r) => ({ ...r, owner_id: demoOwner }));
    if (analyses.length) {
      await admin.from('lead_analyses').insert(analyses).select();
      counts.lead_analyses = analyses.length;
    }

    // 5) meetings
    const meetings = DEMO_FIXTURES.meetings.map((r) => ({ ...r, owner_id: demoOwner }));
    if (meetings.length) {
      await admin.from('meetings').insert(meetings).select();
      counts.meetings = meetings.length;
    }

    // 6) meeting_interactions
    const interactions = DEMO_FIXTURES.meeting_interactions.map((r) => ({ ...r, owner_id: demoOwner }));
    if (interactions.length) {
      await admin.from('meeting_interactions').insert(interactions).select();
      counts.meeting_interactions = interactions.length;
    }

    // 7) followups
    const followups = DEMO_FIXTURES.followups.map((r) => ({ ...r }));
    if (followups.length) {
      await admin.from('followups').insert(followups).select();
      counts.followups = followups.length;
    }

    // 8) lead_bookings
    const bookings = DEMO_FIXTURES.lead_bookings.map((r) => ({ ...r, owner_id: demoOwner }));
    if (bookings.length) {
      await admin.from('lead_bookings').insert(bookings).select();
      counts.lead_bookings = bookings.length;
    }

    // 9) messages
    const messages = DEMO_FIXTURES.messages.map((r) => ({ ...r, owner_id: demoOwner }));
    if (messages.length) {
      await admin.from('messages').insert(messages).select();
      counts.messages = messages.length;
    }

    // 10) networking_drafts
    const drafts = DEMO_FIXTURES.networking_drafts.map((r) => ({ ...r, owner_id: demoOwner }));
    if (drafts.length) {
      await admin.from('networking_drafts').insert(drafts).select();
      counts.networking_drafts = drafts.length;
    }

    // 11) referrals
    const referrals = DEMO_FIXTURES.referrals.map((r) => ({ ...r }));
    if (referrals.length) {
      await admin.from('referrals').insert(referrals).select();
      counts.referrals = referrals.length;
    }

    // Ensure calling user is a workspace member (again)
    await admin.from('workspace_members').upsert({ workspace_id: DEMO_WS, owner_id: demoOwner, role: 'owner' }, { onConflict: 'workspace_id,owner_id' });

    return NextResponse.json({ ok: true, inserted: counts });
  } catch (err) {
    console.error('Demo reset error', err);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}
