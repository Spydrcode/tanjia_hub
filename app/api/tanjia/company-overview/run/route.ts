import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runCompanyAnalysis } from "@/src/lib/scraping/company-overview";
import { analysisV1Schema } from "@/src/lib/agents/analysis-v1";

const RequestSchema = z.object({
  url: z.string().min(1),
  leadId: z.string().nullable().optional(),
  deepScan: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { analysis, raw } = await runCompanyAnalysis({
    url: body.url,
    leadId: body.leadId || undefined,
    deepScan: body.deepScan,
  });

  const safe = analysisV1Schema.parse(analysis);

  const { data, error } = await supabase
    .from("company_analyses")
    .insert({
      user_id: user.id,
      lead_id: body.leadId || null,
      input_url: safe.input.url,
      deep_scan: Boolean(safe.input.deepScan),
      version: safe.version,
      confidence: safe.snapshot.confidence,
      snapshot: safe.snapshot,
      inference: safe.inference,
      next_actions: safe.nextActions,
      evidence: safe.evidence,
      missing_signals: safe.missingSignals,
    })
    .select("id, created_at")
    .single();

  if (error) {
    console.warn("[company_overview.run] save failed", error);
  }

  // Legacy insert into lead_analyses for downstream consumers
  try {
    await supabase.from("lead_analyses").insert({
      owner_id: user.id,
      lead_id: body.leadId || null,
      url: safe.input.url,
      growth_changes: safe.inference.growthShape.signals.map((s) => s.label),
      friction_points: safe.inference.frictionZones.map((f) => f.rationale),
      calm_next_steps: safe.nextActions.map((a) => a.title),
      raw_summary: safe.snapshot.whatTheyDo,
      metadata: { raw },
    });
  } catch (legacyErr) {
    console.warn("[company_overview.run] legacy lead_analyses save failed", legacyErr);
  }

  return NextResponse.json({
    id: data?.id,
    createdAt: data?.created_at,
    analysis: safe,
    raw,
  });
}
