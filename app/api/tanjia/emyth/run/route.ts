import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runEmythTask } from "@/lib/agents/emyth";

const RequestSchema = z.object({
  task: z.enum(["role_map", "on_vs_in", "follow_through"]),
  leadId: z.string().nullable().optional(),
  pastedText: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  mode: z.enum(["prospecting", "meeting", "client", "onsite"]),
  deep: z.boolean().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const { result, traceId, toolsUsed, durationMs } = await runEmythTask(supabase, {
      task: body.task,
      leadId: body.leadId,
      pastedText: body.pastedText || "",
      notes: body.notes || "",
      mode: body.mode,
      deep: body.deep,
      ownerId: user.id,
    });

    const clientReason = "Highlights owner workload and next calm steps without exposing internal details.";
    const internalReason = `Task ${body.task} grounded in provided text${body.leadId ? " and lead context" : ""}; keeps outputs succinct for coaching.`;

    return NextResponse.json({
      result,
      traceId,
      toolsUsed,
      durationMs,
      reasoning: { internal: internalReason, client: clientReason },
    });
  } catch (err) {
    console.error("[emyth/run] failed", err);
    return NextResponse.json({ error: "Unable to run E-Myth task" }, { status: 500 });
  }
}
