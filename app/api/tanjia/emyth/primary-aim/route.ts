import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PrimaryAimSchema, getPrimaryAim, savePrimaryAim } from "@/lib/agents/emyth";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await getPrimaryAim(supabase, user.id);
  return NextResponse.json({ primary_aim: data || null });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = PrimaryAimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid primary aim" }, { status: 400 });
  }
  await savePrimaryAim(supabase, user.id, parsed.data);
  return NextResponse.json({ primary_aim: parsed.data });
}
