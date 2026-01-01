import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const RequestSchema = z.object({
  leadId: z.string().nullable().optional(),
  newLeadName: z.string().optional(),
  newLeadWebsite: z.string().optional(),
  channel: z.string(),
  goal: z.string(),
  inputText: z.string(),
  reply: z.string(),
  followupQuestion: z.string().optional(),
  secondLookNote: z.string().optional(),
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

  let leadId = body.leadId;

  // Create new lead if needed
  if (!leadId && body.newLeadName?.trim()) {
    const { data: newLead, error: leadError } = await supabase
      .from("leads")
      .insert({
        owner_id: user.id,
        name: body.newLeadName.trim(),
        website: body.newLeadWebsite?.trim() || null,
        status: "new",
      })
      .select("id")
      .single();

    if (leadError) {
      console.error("[networking/save] lead creation failed", leadError);
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }

    leadId = newLead.id;
  }

  // Save the draft
  const { error: draftError } = await supabase.from("networking_drafts").insert({
    owner_id: user.id,
    lead_id: leadId || null,
    channel: body.channel,
    goal: body.goal,
    input_text: body.inputText,
    reply_text: body.reply,
    followup_question: body.followupQuestion || null,
    second_look_note: body.secondLookNote || null,
  });

  if (draftError) {
    console.error("[networking/save] draft save failed", draftError);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }

  // Also save as a message if we have a lead
  if (leadId) {
    await supabase.from("messages").insert({
      lead_id: leadId,
      channel: body.channel,
      intent: body.goal,
      body: body.reply,
      message_type: "draft",
      is_sent: false,
      metadata: {
        input_text: body.inputText.slice(0, 500),
        followup_question: body.followupQuestion,
      },
    });
  }

  return NextResponse.json({
    success: true,
    leadId,
  });
}
