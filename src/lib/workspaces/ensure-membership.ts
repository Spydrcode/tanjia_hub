import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';
import { DIRECTOR_WORKSPACE_ID } from './constants';

export async function ensureDirectorMembership(userId: string) {
  try {
    const admin = createSupabaseServiceRoleClient();
    await admin
      .from('workspace_members')
      .upsert({ workspace_id: DIRECTOR_WORKSPACE_ID, owner_id: userId, role: 'owner' }, { onConflict: 'workspace_id,owner_id' });
  } catch (err) {
    // Do not block auth if service key is not configured; just warn
    console.warn('[ensureDirectorMembership] failed to upsert workspace_members', err);
  }
}
