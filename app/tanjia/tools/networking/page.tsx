import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { NetworkingClient } from "./networking-client";

export default async function NetworkingPage() {
  const { supabase } = await requireAuthOrRedirect();
  
  // Fetch leads for the save dropdown
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, website")
    .order("name");

  return <NetworkingClient leads={leads || []} />;
}
