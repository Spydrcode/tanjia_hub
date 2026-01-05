import { NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';
import { requireAuthOrRedirect } from '@/lib/auth/redirect';
import { DEMO_WORKSPACE_ID } from '@/src/lib/workspaces/constants';
import { DEMO_FIXTURES, DEMO_OWNER_PLACEHOLDER } from '@/src/lib/demo/fixtures';
import { serverEnv } from '@/src/lib/env';

const DEMO_WS = DEMO_WORKSPACE_ID;

export async function POST(req: Request) {
  // Allow a development-only bypass when header `x-dev-bypass: 1` is present
  // OR when a reset secret header matches the configured env var.
  // This lets scripts call the reset endpoint without a browser-authenticated session.
  let user: any = null;
  const devBypass = req.headers.get('x-dev-bypass');
  const resetSecret = req.headers.get('x-demo-reset-secret');
  const devOwnerHeader = req.headers.get('x-dev-owner');
  const devOwnerEmail = req.headers.get('x-dev-owner-email');
  const isDev = process.env.NODE_ENV === 'development';
  const secretMatches = Boolean(
    isDev &&
      resetSecret &&
      process.env.DEMO_RESET_SECRET &&
      resetSecret === process.env.DEMO_RESET_SECRET
  );
  if ((devBypass === '1' && isDev) || secretMatches) {
    const fallbackOwner = process.env.DEV_DEMO_OWNER_ID || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    user = { id: devOwnerHeader || fallbackOwner, email: devOwnerEmail || undefined };
  } else {
    const auth = await requireAuthOrRedirect();
    user = auth.user;
  }
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const admin = createSupabaseServiceRoleClient();

    const isMissingTableError = (message: string) =>
      message.includes("Could not find the table") || message.includes("schema cache");

    const isMissingColumnError = (message: string, column: string) =>
      message.includes(`Could not find the '${column}' column`) || message.includes(`column '${column}'`);

    // Detect whether the connected Supabase schema supports workspaces.
    const workspaceProbe = await admin.from('leads').select('workspace_id').limit(1);
    const hasWorkspaceId = !workspaceProbe.error;

    const stripWorkspace = <T extends Record<string, any>>(row: T): T => {
      if (hasWorkspaceId) return row;
      const { workspace_id, ...rest } = row;
      return rest as T;
    };

    // In secret/bypass mode, allow resolving the owner UUID from an email header.
    // This makes automated tests robust without needing to hardcode the user UUID.
    let demoOwner: string = user.id;
    if (!devOwnerHeader && user?.email && typeof user.email === 'string') {
      try {
        let page = 1;
        const perPage = 200;
        for (let i = 0; i < 10; i++) {
          const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
          if (error) throw error;
          const users = data?.users || [];
          const match = users.find((u) => (u.email || '').toLowerCase() === user.email.toLowerCase());
          if (match?.id) {
            demoOwner = match.id;
            break;
          }
          if (users.length < perPage) break;
          page += 1;
        }
      } catch (e) {
        // Fall back to provided id; worst case RLS may hide demo data.
        console.warn('Demo reset: could not resolve owner by email', e);
      }
    }

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

    if (hasWorkspaceId) {
      // Ensure demo workspace exists
      const { error: wsErr } = await admin
        .from('workspaces')
        .upsert({ id: DEMO_WS, name: 'Demo Workspace', mode: 'demo' }, { onConflict: 'id' });
      if (wsErr && !isMissingTableError(wsErr.message)) {
        throw new Error(`Demo reset: upsert workspaces failed: ${wsErr.message}`);
      }

      // Upsert demo workspace membership for calling user
      const { error: wmErr } = await admin
        .from('workspace_members')
        .upsert({ workspace_id: DEMO_WS, owner_id: demoOwner, role: 'owner' }, { onConflict: 'workspace_id,owner_id' });
      if (wmErr && !isMissingTableError(wmErr.message)) {
        throw new Error(`Demo reset: upsert workspace_members failed: ${wmErr.message}`);
      }
    }

    // Insert fixtures deterministically. Overwrite owner_id fields to the calling user.
    const counts: Record<string, number> = {};

    // 1) networking_groups
    const groups = DEMO_FIXTURES.networking_groups.map((r) => stripWorkspace({ ...r, owner_id: demoOwner }));
    if (groups.length) {
      const { error } = await admin.from('networking_groups').upsert(groups, { onConflict: 'id' });
      if (error) {
        if (isMissingTableError(error.message) || isMissingColumnError(error.message, 'workspace_id')) {
          counts.networking_groups = 0;
        } else {
          throw new Error(`Demo reset: upsert networking_groups failed: ${error.message}`);
        }
      } else {
        counts.networking_groups = groups.length;
      }
    }

    // 2) leads
    const leads = DEMO_FIXTURES.leads.map((r) => stripWorkspace({ ...r, owner_id: demoOwner }));
    if (leads.length) {
      const { error } = await admin.from('leads').upsert(leads, { onConflict: 'id' });
      if (error) {
        if (isMissingColumnError(error.message, 'workspace_id')) {
          // If the schema cache is stale or the column doesn't exist, retry once without workspace_id.
          const legacyLeads = DEMO_FIXTURES.leads.map((r) => {
            const { workspace_id, ...rest } = { ...r, owner_id: demoOwner } as any;
            return rest;
          });
          const { error: err2 } = await admin.from('leads').upsert(legacyLeads as any, { onConflict: 'id' });
          if (err2) throw new Error(`Demo reset: upsert leads failed: ${err2.message}`);
        } else {
          throw new Error(`Demo reset: upsert leads failed: ${error.message}`);
        }
      }
      counts.leads = leads.length;
    }

    // 3) lead_snapshots
    const snapshots = DEMO_FIXTURES.lead_snapshots.map((r) => stripWorkspace({ ...r }));
    if (snapshots.length) {
      const { error } = await admin.from('lead_snapshots').upsert(snapshots, { onConflict: 'id' });
      if (error) {
        if (isMissingColumnError(error.message, 'workspace_id')) {
          const legacy = DEMO_FIXTURES.lead_snapshots.map((r) => {
            const { workspace_id, ...rest } = r as any;
            return rest;
          });
          const { error: err2 } = await admin.from('lead_snapshots').upsert(legacy as any, { onConflict: 'id' });
          if (err2) throw new Error(`Demo reset: upsert lead_snapshots failed: ${err2.message}`);
        } else {
          throw new Error(`Demo reset: upsert lead_snapshots failed: ${error.message}`);
        }
      }
      counts.lead_snapshots = snapshots.length;
    }

    // 4) lead_analyses
    const analyses = DEMO_FIXTURES.lead_analyses.map((r) => stripWorkspace({ ...r, owner_id: demoOwner }));
    if (analyses.length) {
      let analysesSeeded = true;
      const { error } = await admin.from('lead_analyses').upsert(analyses, { onConflict: 'id' });
      if (error) {
        if (isMissingTableError(error.message) || isMissingColumnError(error.message, 'workspace_id') || isMissingColumnError(error.message, 'analysis')) {
          const legacy = DEMO_FIXTURES.lead_analyses.map((r) => {
            const { workspace_id, ...rest } = { ...r, owner_id: demoOwner } as any;
            return rest;
          });
          const { error: err2 } = await admin.from('lead_analyses').upsert(legacy as any, { onConflict: 'id' });
          if (err2) {
            // If the schema is incompatible, treat lead analyses as optional.
            if (isMissingColumnError(err2.message, 'analysis') || isMissingColumnError(err2.message, 'workspace_id') || isMissingTableError(err2.message)) {
              analysesSeeded = false;
              // continue
            } else {
              throw new Error(`Demo reset: upsert lead_analyses failed: ${err2.message}`);
            }
          }
        } else {
          throw new Error(`Demo reset: upsert lead_analyses failed: ${error.message}`);
        }
      }
      counts.lead_analyses = analysesSeeded ? analyses.length : 0;
    }

    // 5) meetings
    const meetings = DEMO_FIXTURES.meetings.map((r) => stripWorkspace({ ...r, owner_id: demoOwner }));
    if (meetings.length) {
      const { error } = await admin.from('meetings').upsert(meetings, { onConflict: 'id' });
      if (error) {
        if (isMissingColumnError(error.message, 'workspace_id')) {
          const legacy = DEMO_FIXTURES.meetings.map((r) => {
            const { workspace_id, ...rest } = { ...r, owner_id: demoOwner } as any;
            return rest;
          });
          const { error: err2 } = await admin.from('meetings').upsert(legacy as any, { onConflict: 'id' });
          if (err2) throw new Error(`Demo reset: upsert meetings failed: ${err2.message}`);
        } else {
          throw new Error(`Demo reset: upsert meetings failed: ${error.message}`);
        }
      }
      counts.meetings = meetings.length;
    }

    // 6) meeting_interactions
    const interactions = DEMO_FIXTURES.meeting_interactions.map((r) => stripWorkspace({ ...r, owner_id: demoOwner }));
    if (interactions.length) {
      const { error } = await admin.from('meeting_interactions').upsert(interactions, { onConflict: 'id' });
      if (error) {
        if (isMissingTableError(error.message) || isMissingColumnError(error.message, 'workspace_id')) {
          counts.meeting_interactions = 0;
        } else {
          throw new Error(`Demo reset: upsert meeting_interactions failed: ${error.message}`);
        }
      } else {
        counts.meeting_interactions = interactions.length;
      }
    }

    // 7) followups
    const followups = DEMO_FIXTURES.followups.map((r) => stripWorkspace({ ...r }));
    if (followups.length) {
      const { error } = await admin.from('followups').upsert(followups, { onConflict: 'id' });
      if (error) {
        if (isMissingColumnError(error.message, 'workspace_id')) {
          const legacy = DEMO_FIXTURES.followups.map((r) => {
            const { workspace_id, ...rest } = r as any;
            return rest;
          });
          const { error: err2 } = await admin.from('followups').upsert(legacy as any, { onConflict: 'id' });
          if (err2) throw new Error(`Demo reset: upsert followups failed: ${err2.message}`);
        } else {
          throw new Error(`Demo reset: upsert followups failed: ${error.message}`);
        }
      }
      counts.followups = followups.length;
    }

    // 8) lead_bookings
    const bookings = DEMO_FIXTURES.lead_bookings.map((r) => stripWorkspace({ ...r, owner_id: demoOwner }));
    if (bookings.length) {
      const { error } = await admin.from('lead_bookings').upsert(bookings, { onConflict: 'id' });
      if (error) {
        if (isMissingTableError(error.message) || isMissingColumnError(error.message, 'workspace_id')) {
          counts.lead_bookings = 0;
        } else {
          throw new Error(`Demo reset: upsert lead_bookings failed: ${error.message}`);
        }
      } else {
        counts.lead_bookings = bookings.length;
      }
    }

    // 9) messages
    const messages = DEMO_FIXTURES.messages.map((r) => stripWorkspace({ ...r, owner_id: demoOwner }));
    if (messages.length) {
      const { error } = await admin.from('messages').upsert(messages, { onConflict: 'id' });
      if (error) {
        if (isMissingColumnError(error.message, 'workspace_id')) {
          const legacy = DEMO_FIXTURES.messages.map((r) => {
            const { workspace_id, ...rest } = { ...r, owner_id: demoOwner } as any;
            return rest;
          });
          const { error: err2 } = await admin.from('messages').upsert(legacy as any, { onConflict: 'id' });
          if (err2) throw new Error(`Demo reset: upsert messages failed: ${err2.message}`);
        } else {
          throw new Error(`Demo reset: upsert messages failed: ${error.message}`);
        }
      }
      counts.messages = messages.length;
    }

    // 10) networking_drafts
    const drafts = DEMO_FIXTURES.networking_drafts.map((r) => stripWorkspace({ ...r, owner_id: demoOwner }));
    if (drafts.length) {
      const { error } = await admin.from('networking_drafts').upsert(drafts, { onConflict: 'id' });
      if (error) {
        if (isMissingTableError(error.message) || isMissingColumnError(error.message, 'workspace_id')) {
          counts.networking_drafts = 0;
        } else {
          throw new Error(`Demo reset: upsert networking_drafts failed: ${error.message}`);
        }
      } else {
        counts.networking_drafts = drafts.length;
      }
    }

    // 11) referrals
    const referrals = DEMO_FIXTURES.referrals.map((r) => ({ ...r, owner_id: demoOwner }));
    if (referrals.length) {
      const { error } = await admin.from('referrals').upsert(referrals, { onConflict: 'id' });
      if (error) {
        if (isMissingTableError(error.message)) {
          counts.referrals = 0;
        } else {
          throw new Error(`Demo reset: upsert referrals failed: ${error.message}`);
        }
      } else {
        counts.referrals = referrals.length;
      }
    }

    if (hasWorkspaceId) {
      // Ensure calling user is a workspace member (again)
      const { error: wmErr2 } = await admin
        .from('workspace_members')
        .upsert({ workspace_id: DEMO_WS, owner_id: demoOwner, role: 'owner' }, { onConflict: 'workspace_id,owner_id' });
      if (wmErr2 && !isMissingTableError(wmErr2.message)) {
        throw new Error(`Demo reset: upsert workspace_members failed: ${wmErr2.message}`);
      }
    }

    return NextResponse.json({ ok: true, inserted: counts });
  } catch (err) {
    console.error('Demo reset error', err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: 'Reset failed',
        ...(process.env.NODE_ENV !== 'production' ? { detail } : {}),
      },
      { status: 500 }
    );
  }
}
