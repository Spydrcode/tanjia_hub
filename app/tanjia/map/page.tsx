import type { Metadata } from "next";
import { ZoneHeader } from "@/src/components/ui/zone-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { MapClient } from "./map-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Map - 2ndmynd",
  description: "Where is pressure coming from in the business?",
};

type AnalysisRow = {
  id: string;
  lead_id: string | null;
  url: string | null;
  growth_changes: string[];
  friction_points: string[];
  calm_next_steps: string[];
  raw_summary: string | null;
  created_at: string;
};

export default async function MapPage() {
  await requireAuthOrRedirect();
  const supabase = await createSupabaseServerClient();
  
  // Get leads that have websites
  let leads: { id: string; name: string; website?: string | null }[] = [];
  try {
    const { data } = await supabase
      .from("leads")
      .select("id, name, website")
      .order("updated_at", { ascending: false });
    
    leads = (data || []).map((l: { id: string; name: string; website?: string | null }) => ({
      id: l.id,
      name: l.name,
      website: l.website,
    }));
  } catch {
    leads = [];
  }

  // Get recent analyses from DB
  let recentAnalyses: {
    id: string;
    leadId: string | null;
    url?: string;
    growthChanges: string[];
    frictionPoints: string[];
    calmNextSteps: string[];
    rawSummary?: string;
    createdAt: string;
  }[] = [];

  try {
    const { data } = await supabase
      .from("lead_analyses")
      .select("id, lead_id, url, growth_changes, friction_points, calm_next_steps, raw_summary, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      recentAnalyses = (data as AnalysisRow[]).map((row) => ({
        id: row.id,
        leadId: row.lead_id,
        url: row.url || undefined,
        growthChanges: row.growth_changes || [],
        frictionPoints: row.friction_points || [],
        calmNextSteps: row.calm_next_steps || [],
        rawSummary: row.raw_summary || undefined,
        createdAt: row.created_at,
      }));
    }
  } catch (err) {
    console.warn("[map] failed to load recent analyses", err);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 py-8">
      <ZoneHeader zone="map" />

      <Card className="border-amber-100 bg-amber-50/30 backdrop-blur">
        <CardContent className="p-4">
          <p className="text-sm text-amber-900 font-medium">
            Map their world with quiet curiosity.
          </p>
          <p className="text-xs text-amber-700 mt-1.5">
            Scan their website to understand what they're carrying — without interrupting them.
            Results are saved to the database and can be shared in a client-safe view.
          </p>
        </CardContent>
      </Card>

      <MapClient leads={leads} recentAnalyses={recentAnalyses} />

      {/* Zone context */}
      <Card className="border-neutral-200 bg-neutral-50/50 backdrop-blur">
        <CardContent className="p-4 text-sm text-neutral-600">
          <p className="font-medium text-neutral-700 mb-2">What MAP answers:</p>
          <p>
            Where are they now — in their own words, from their own presence?
            This scan reads publicly shared content and surfaces patterns that 
            reveal what they're working through. No intrusion, just context.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
