import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { tanjiaConfig } from "@/lib/tanjia-config";
import { createLead } from "../actions";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import NewLeadClient from "./new-lead-client";

export const metadata: Metadata = {
  title: "New Lead",
  description: "Add a lead to Tanjia.",
  robots: { index: false, follow: false },
};

export default async function NewLeadPage() {
  await requireAuthOrRedirect();

  async function action(formData: FormData) {
    "use server";
    const { supabase } = await requireAuthOrRedirect();
    const name = ((formData.get("name") as string) || "").trim();
    const website = (formData.get("website") as string) || "";
    const location = (formData.get("location") as string) || "";
    const email = (formData.get("email") as string) || "";
    const notes = (formData.get("notes") as string) || "";
    const status = (formData.get("status") as string) || "new";
    const enrichmentRaw = (formData.get("enrichment") as string) || "";

    const leadId = await createLead({ name, website, location, email, notes, status });

    if (enrichmentRaw) {
      try {
        const parsed = JSON.parse(enrichmentRaw) as {
          signals?: { snippetSources?: { url?: string }[]; website?: string };
          overview?: { bio?: string; likelyNeeds?: string[]; suggestedNextStep?: string };
        };
        const sourceUrls = Array.from(
          new Set(
            [
              ...(parsed.signals?.snippetSources?.map((s) => s.url).filter(Boolean) as string[]),
              parsed.signals?.website,
            ].filter(Boolean),
          ),
        );
        await supabase
          .from("lead_snapshots")
          .insert({
            lead_id: leadId,
            summary: parsed.overview?.bio || null,
            source_urls: sourceUrls,
            extracted_json: { ...parsed, runType: "enrich" },
          })
          .select("id")
          .single();
      } catch (err) {
        console.warn("[tanjia][lead-enrich] snapshot save failed", err);
      }
    }

    redirect(`/tanjia/leads/${leadId}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <NewLeadClient onCreate={action} />
      <footer className="border-t border-neutral-200 pt-6 text-sm text-neutral-600 px-6 pb-8">
        <a href={tanjiaConfig.siteUrl} className="hover:text-neutral-800" target="_blank" rel="noreferrer">
          2ndmynd
        </a>
      </footer>
    </div>
  );
}
