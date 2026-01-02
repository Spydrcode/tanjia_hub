import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runCompanyAnalysis } from "@/src/lib/scraping/company-overview";
import { analysisV1Schema } from "@/src/lib/agents/analysis-v1";

const RequestSchema = z.object({
  leadId: z.string().nullable().optional(),
  url: z.string().min(1, "URL is required"),
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

  // Persist to company_analyses
  try {
    await supabase.from("company_analyses").insert({
      user_id: user.id,
      lead_id: body.leadId || null,
      input_url: analysis.input.url,
      deep_scan: Boolean(analysis.input.deepScan),
      version: analysis.version,
      confidence: analysis.snapshot.confidence,
      snapshot: analysis.snapshot,
      inference: analysis.inference,
      next_actions: analysis.nextActions,
      evidence: analysis.evidence,
      missing_signals: analysis.missingSignals,
    });
  } catch (err) {
    console.warn("[analyze] save company_analyses failed", err);
  }

  // Legacy insert into lead_analyses for back-compat
  try {
    await supabase.from("lead_analyses").insert({
      owner_id: user.id,
      lead_id: body.leadId || null,
      url: analysis.input.url,
      growth_changes: analysis.inference.growthShape.signals.map((s) => s.label),
      friction_points: analysis.inference.frictionZones.map((f) => f.rationale),
      calm_next_steps: analysis.nextActions.map((a) => a.title),
      raw_summary: analysis.snapshot.whatTheyDo,
      metadata: { raw },
    });
  } catch (err) {
    console.warn("[analyze] legacy lead_analyses save failed", err);
  }

  // Write to director state: create system message + followup
  if (body.leadId) {
    try {
      // Create system message summarizing what we learned
      const systemNote = [
        `What they do: ${analysis.snapshot.whatTheyDo}`,
        `Who they serve: ${analysis.snapshot.whoTheyServe.join(", ")}`,
        analysis.snapshot.ownerLedLikelihood === "high" ? "Likely owner-led" : "",
      ].filter(Boolean).join("\n\n");

      await supabase.from("messages").insert({
        lead_id: body.leadId,
        channel: "system",
        intent: "research",
        body: systemNote,
        message_type: "note",
        is_sent: false,
        metadata: { analysis_url: analysis.input.url },
      });

      // Create followup task for 2 days out
      const followupDate = new Date();
      followupDate.setDate(followupDate.getDate() + 2);

      await supabase.from("followups").insert({
        lead_id: body.leadId,
        action: "Review analysis and decide next step",
        due_date: followupDate.toISOString().split('T')[0],
        completed: false,
      });
    } catch (err) {
      console.warn("[analyze] director state update failed", err);
    }
  }

  const safe = analysisV1Schema.parse(analysis);
  return NextResponse.json(safe);
}
