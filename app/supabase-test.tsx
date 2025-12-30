import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default async function SupabaseTest() {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("leads").select("id").limit(1);

  if (error) {
    return <div>Supabase connection error: {error.message}</div>;
  }
  return <div>Supabase connection successful! Lead IDs: {data?.map((l: any) => l.id).join(", ") || "none"}</div>;
}
