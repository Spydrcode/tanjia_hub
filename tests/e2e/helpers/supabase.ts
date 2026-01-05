import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

let cachedAdmin: SupabaseClient | null = null;
let cachedE2EOwnerId: string | null = null;

export function getAdminClient() {
  if (cachedAdmin) return cachedAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }

  cachedAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cachedAdmin;
}

export async function resolveE2EOwnerId(): Promise<string> {
  if (cachedE2EOwnerId) return cachedE2EOwnerId;

  const admin = getAdminClient();

  // Prefer an explicitly configured UUID if it actually exists.
  const preferred = process.env.E2E_OWNER_ID;
  if (preferred) {
    try {
      const { data, error } = await admin.auth.admin.getUserById(preferred);
      if (!error && data?.user?.id) {
        cachedE2EOwnerId = data.user.id;
        return cachedE2EOwnerId;
      }
    } catch {
      // fall through
    }
  }

  // Otherwise, reuse any existing auth user.
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (!error && data?.users?.length) {
      cachedE2EOwnerId = data.users[0].id;
      return cachedE2EOwnerId;
    }
  } catch {
    // fall through
  }

  // As a last resort, create a user (bypass mode does not require logging in).
  const email = `e2e-bypass+${randomUUID()}@local.test`;
  const password = randomUUID();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created?.user?.id) {
    throw new Error(createErr?.message || "Failed to create E2E bypass user");
  }

  cachedE2EOwnerId = created.user.id;
  return cachedE2EOwnerId;
}

export async function countMessagesForLead(admin: SupabaseClient, leadId: string) {
  const { count, error } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", leadId);

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
}
