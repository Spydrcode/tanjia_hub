import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tanjiaConfig, tanjiaServerConfig } from "@/lib/tanjia-config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateReply } from "@/src/lib/tanjia/reply-helper";

const RequestSchema = z.object({
  channel: z.literal("comment"),
  intent: z.enum(["reply", "invite", "support", "nurture", "clarify"]).optional(),
  what_they_said: z.string().min(1),
  notes: z.string().nullable().optional(),
  leadId: z.string().nullable().optional(),
});

async function saveTrace({
  body,
  leadId,
  ownerId,
  trace,
  metadata,
}: {
  body: string;
  leadId?: string | null;
  ownerId?: string | null;
  trace?: unknown;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("messages")
      .insert({
        owner_id: ownerId ?? null,
        lead_id: leadId ?? null,
        channel: "comment",
        intent: "reflect",
        body,
        message_type: "reply_helper",
        metadata: { ...(metadata || {}), trace },
        is_sent: false,
      })
      .select("id")
      .single();
    return data?.id as string | null;
  } catch (err) {
    console.warn("[tanjia][comment-reply] trace save failed", err);
    return null;
  }
}

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

  try {
    // Use new two-step reply helper
    const result = await generateReply({
      channel: "comment",
      intent: body.intent || "reply",
      whatTheySaid: body.what_they_said,
      notes: body.notes,
      leadId: body.leadId,
    });

    // Save trace
    const traceId = await saveTrace({
      body: result.reply_text,
      leadId: body.leadId,
      ownerId: user?.id ?? null,
      trace: result.meta,
      metadata: {
        analysis: result.analysis,
        checks: result.checks,
        failures: result.meta.failures,
      },
    });

    // Build reasoning for client
    const clientReason = `Tailored reply addressing specific details they shared, reflecting their likely pressures, and introducing 2nd Look support.`;
    const internalReason = `Analysis: ${result.analysis.recommended_angle}. Values: ${result.analysis.values.join(", ")}. Pressures: ${result.analysis.pressures.join(", ")}.`;

    return NextResponse.json({
      text: result.reply_text,
      traceId: traceId || null,
      reasoning: {
        internal: internalReason,
        client: clientReason,
      },
      analysis: result.analysis,
      checks: result.checks,
    });
  } catch (error) {
    console.error("[tanjia][comment-reply] error", error);
    return NextResponse.json({ error: "Unable to draft right now." }, { status: 500 });
  }
}
