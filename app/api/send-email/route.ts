import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tanjiaServerConfig } from "@/lib/tanjia-config";
import { serverEnv, featureFlags } from "@/src/lib/env";

const BodySchema = z.object({
  toEmail: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
  leadId: z.string().optional(),
});

type Body = z.infer<typeof BodySchema>;

export async function POST(request: Request) {
  if (!featureFlags.resendEnabled || !serverEnv.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND not configured." }, { status: 500 });
  }

  const resend = new Resend(serverEnv.RESEND_API_KEY);

  let parsed: Body;
  try {
    parsed = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await resend.emails.send({
      from: tanjiaServerConfig.resendFromEmail,
      to: [parsed.toEmail],
      subject: parsed.subject,
      html: `<p>${parsed.body.replace(/\n/g, "<br/>")}</p>`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Send failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (parsed.leadId) {
    await supabase.from("messages").insert({
      owner_id: user.id,
      lead_id: parsed.leadId,
      channel: "email",
      intent: "followup",
      body: parsed.body,
      is_sent: true,
    });
  }

  return NextResponse.json({ ok: true });
}
