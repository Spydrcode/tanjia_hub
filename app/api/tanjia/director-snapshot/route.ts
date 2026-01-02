import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeDirectorSnapshot } from "@/src/lib/tanjia/director-metrics";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Compute the director snapshot
    const snapshot = await computeDirectorSnapshot(supabase, user.id);

    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error("Error computing director snapshot:", error);
    return NextResponse.json(
      { error: "Failed to compute snapshot" },
      { status: 500 }
    );
  }
}
