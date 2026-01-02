import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { analysisV1Schema } from "@/src/lib/agents/analysis-v1";

const QuerySchema = z.object({
  leadId: z.string().optional(),
  url: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = QuerySchema.safeParse(params);

  if (!parsed.success || (!parsed.data.leadId && !parsed.data.url)) {
    return NextResponse.json({ error: "Provide leadId or url" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase
    .from("company_analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (parsed.data.leadId) {
    query = query.eq("lead_id", parsed.data.leadId);
  } else if (parsed.data.url) {
    query = query.eq("input_url", parsed.data.url);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.warn("[company_overview.latest] fetch failed", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const analysis = analysisV1Schema.parse(data.snapshot ? {
    version: data.version,
    input: {
      url: data.input_url,
      leadId: data.lead_id || undefined,
      deepScan: data.deep_scan,
      fetchedAt: data.created_at,
    },
    snapshot: data.snapshot,
    inference: data.inference,
    nextActions: data.next_actions,
    evidence: data.evidence || [],
    missingSignals: data.missing_signals || [],
  } : data);

  return NextResponse.json({
    id: data.id,
    createdAt: data.created_at,
    analysis,
  });
}
