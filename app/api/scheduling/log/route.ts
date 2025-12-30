import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logMessageEvent } from "@/src/lib/scheduling/logging";

const BodySchema = z.object({
  event: z.enum([
    "schedule_opened",
    "duration_selected",
    "booking_created",
    "booking_rescheduled",
    "booking_canceled",
    "followups_created",
  ]),
  leadId: z.string().optional(),
  duration: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
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

  await logMessageEvent({
    supabase,
    ownerId: user.id,
    leadId: body.leadId ?? null,
    messageType: body.event,
    metadata: { ...(body.metadata || {}), duration: body.duration, source: "scheduler" },
    channel: "system",
    intent: "schedule",
  });

  return NextResponse.json({ ok: true });
}
