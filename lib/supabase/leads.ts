import { SupabaseClient } from "@supabase/supabase-js";

export type EnrichedLead = {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
  website?: string | null;
  notes?: string | null;
  status?: string | null;
  created_at?: string | null;
};

/**
 * Fetches leads with enriched data from the database
 */
export async function getEnrichedLeads(
  supabase: SupabaseClient,
  options?: {
    limit?: number;
    status?: string;
  }
): Promise<EnrichedLead[]> {
  let query = supabase
    .from("leads")
    .select("id, name, email, company, website, notes, status, created_at")
    .order("created_at", { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as EnrichedLead[];
}

/**
 * Get a single lead by ID with full enrichment data
 */
export async function getLeadById(
  supabase: SupabaseClient,
  id: string
): Promise<EnrichedLead | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, email, company, website, notes, status, created_at")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  return data as EnrichedLead;
}
