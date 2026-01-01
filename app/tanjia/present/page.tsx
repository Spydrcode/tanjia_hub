import type { Metadata } from "next";
import Link from "next/link";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PresentContent } from "./present-content";

export const metadata: Metadata = {
  title: "Second Look - 2ndmynd",
  description: "Share what 2ndmynd does calmly and clearly.",
};

type LeadAnalysis = {
  leadName: string;
  url: string | null;
  growthChanges: string[];
  frictionPoints: string[];
  calmNextSteps: string[];
  rawSummary: string | null;
  analyzedAt: string;
};

export default async function PresentPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string }>;
}) {
  const params = await searchParams;
  const leadId = params.lead;
  
  let leadAnalysis: LeadAnalysis | null = null;
  
  if (leadId) {
    const supabase = await createSupabaseServerClient();
    
    // Fetch the lead and most recent analysis
    const { data: lead } = await supabase
      .from("leads")
      .select("name")
      .eq("id", leadId)
      .single();
    
    const { data: analysis } = await supabase
      .from("lead_analyses")
      .select("url, growth_changes, friction_points, calm_next_steps, raw_summary, created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (lead && analysis) {
      leadAnalysis = {
        leadName: lead.name,
        url: analysis.url,
        growthChanges: analysis.growth_changes || [],
        frictionPoints: analysis.friction_points || [],
        calmNextSteps: analysis.calm_next_steps || [],
        rawSummary: analysis.raw_summary,
        analyzedAt: analysis.created_at,
      };
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-3xl flex-col gap-8 px-5 py-10 sm:px-6 sm:py-16">
      <div className="flex items-center justify-between">
        <Link
          href="/tanjia"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700"
        >
          <span>←</span>
          <span>Back</span>
        </Link>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-800">
          Client-safe
        </span>
      </div>

      <PresentContent 
        secondLookUrl={tanjiaConfig.secondLookUrl} 
        leadAnalysis={leadAnalysis}
      />
    </div>
  );
}
