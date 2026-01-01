import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { AnalyzeClient } from "./analyze-client";

export default async function AnalyzePage() {
  const { supabase } = await requireAuthOrRedirect();
  
  // Fetch leads for the dropdown
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, website")
    .order("name");

  // Fetch recent analyses for history
  const { data: history } = await supabase
    .from("lead_analyses")
    .select("id, created_at, url, lead_id, growth_changes, friction_points, calm_next_steps")
    .order("created_at", { ascending: false })
    .limit(5);

  // Enrich history with lead names
  const leadIds = [...new Set(history?.map(h => h.lead_id).filter(Boolean) || [])];
  let leadMap: Record<string, { id: string; name: string }> = {};
  
  if (leadIds.length > 0) {
    const { data: historyLeads } = await supabase
      .from("leads")
      .select("id, name")
      .in("id", leadIds);
    
    leadMap = (historyLeads || []).reduce((acc, l) => {
      acc[l.id] = { id: l.id, name: l.name };
      return acc;
    }, {} as Record<string, { id: string; name: string }>);
  }

  const enrichedHistory = (history || []).map(h => ({
    ...h,
    lead: h.lead_id ? leadMap[h.lead_id] : null,
  }));

  return <AnalyzeClient leads={leads || []} history={enrichedHistory} />;
}
