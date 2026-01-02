import type { Metadata } from "next";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { analysisV1Schema, type AnalysisV1 } from "@/src/lib/agents/analysis-v1";
import { CompanyOverviewDashboard } from "@/src/components/tanjia/company-overview/dashboard";
import { tanjiaConfig } from "@/lib/tanjia-config";

export const metadata: Metadata = {
  title: "Company Overview - Tanjia",
  description: "Calm snapshot of a company before you reach out.",
  robots: { index: false, follow: false },
};

export default async function CompanyOverviewPage() {
  await requireAuthOrRedirect();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ownerId = user?.id || "";

  const { data: leadsData } = await supabase
    .from("leads")
    .select("id, name, website")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false })
    .limit(100);

  const leads = (leadsData || []).map((lead) => ({
    id: lead.id as string,
    name: lead.name as string,
    website: lead.website as string | null | undefined,
  }));

  const { data: historyData } = await supabase
    .from("company_analyses")
    .select("*")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(5);

  const history =
    historyData?.map((row) => {
      const analysis: AnalysisV1 = analysisV1Schema.parse({
        version: row.version || "analysis_v1",
        input: {
          url: row.input_url,
          leadId: row.lead_id || undefined,
          deepScan: row.deep_scan,
          fetchedAt: row.created_at,
        },
        snapshot: row.snapshot,
        inference: row.inference,
        nextActions: row.next_actions,
        evidence: row.evidence || [],
        missingSignals: row.missing_signals || [],
      });
      return { id: row.id as string, createdAt: row.created_at as string, analysis };
    }) || [];

  const initialAnalysis = history[0]?.analysis || null;

  return (
    <CompanyOverviewDashboard
      leads={leads}
      history={history}
      initialAnalysis={initialAnalysis}
      siteUrl={tanjiaConfig.siteUrl}
    />
  );
}
