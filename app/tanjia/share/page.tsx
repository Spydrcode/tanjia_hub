import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/src/components/ui/card";
import { tanjiaConfig } from "@/lib/tanjia-config";

export const metadata: Metadata = {
  title: "Share View - 2ndmynd",
  description: "Share what 2ndmynd does calmly and clearly.",
  robots: { index: false, follow: false },
};

type LeadAnalysis = {
  leadName: string;
  url: string | null;
  whatTheyDo: string;
  whoTheyServe: string;
  likelyOwnerLed: boolean;
  calmNextSteps: string[];
  analyzedAt: string;
};

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string; t?: string }>;
}) {
  const params = await searchParams;
  const leadId = params.lead;
  const token = params.t;
  
  let leadAnalysis: LeadAnalysis | null = null;
  
  // TODO: Implement share token validation if token is provided
  // For now, requires auth to view
  
  if (leadId) {
    const supabase = await createSupabaseServerClient();
    
    // Fetch the lead and most recent analysis
    const { data: lead } = await supabase
      .from("leads")
      .select("name")
      .eq("id", leadId)
      .single();
    
    const { data: analysis } = await supabase
      .from("lead_analyses")
      .select("url, raw_summary, calm_next_steps, metadata, created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (lead && analysis) {
      const metadata = analysis.metadata as any || {};
      leadAnalysis = {
        leadName: lead.name,
        url: analysis.url,
        whatTheyDo: analysis.raw_summary || "Understanding in progress...",
        whoTheyServe: metadata.whoTheyServe || "Service-based business owners",
        likelyOwnerLed: metadata.likelyOwnerLed !== false,
        calmNextSteps: analysis.calm_next_steps || [],
        analyzedAt: analysis.created_at,
      };
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-3xl flex-col gap-8 px-5 py-10 sm:px-6 sm:py-16">
      <div className="flex items-center justify-between">
        <Link
          href="/tanjia"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700"
        >
          <span>←</span>
          <span>Back</span>
        </Link>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-800">
          Share View
        </span>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Second Look
          </h1>
          <p className="mt-3 text-lg text-neutral-600">
            A calmer way to see what's changed and what's next.
          </p>
        </div>

        {/* What Second Look Is */}
        <Card className="border-neutral-200 bg-white/90">
          <CardContent className="p-6">
            <h2 className="mb-3 text-xl font-semibold text-neutral-900">
              What is a Second Look?
            </h2>
            <div className="space-y-3 text-neutral-700">
              <p>
                Growth changes what you're carrying. The same operations that worked before 
                start to feel harder. You question if something's wrong with you.
              </p>
              <p>
                A Second Look helps you see what's shifted. It's not about fixing everything—it's 
                about understanding what's actually happening and where the smallest improvements 
                will make the biggest difference.
              </p>
              <p className="font-medium text-neutral-900">
                You're not broken. You're just carrying more than before.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Three Beliefs */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-violet-200 bg-violet-50">
            <CardContent className="p-4">
              <h3 className="mb-2 font-semibold text-violet-900">You're not alone</h3>
              <p className="text-sm text-violet-700">
                Other founders carry the same weight. What you're feeling is normal.
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <h3 className="mb-2 font-semibold text-amber-900">There's a path forward</h3>
              <p className="text-sm text-amber-700">
                The quickest improvement is usually smaller than you think.
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <h3 className="mb-2 font-semibold text-emerald-900">We're here to help, not sell</h3>
              <p className="text-sm text-emerald-700">
                No pitch. No pressure. Just clarity when you're ready.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lead-Specific Analysis (if provided) */}
        {leadAnalysis && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <h2 className="mb-3 text-xl font-semibold text-blue-900">
                About {leadAnalysis.leadName}
              </h2>
              <div className="space-y-4 text-blue-800">
                <div>
                  <p className="text-sm font-medium text-blue-700">What they do</p>
                  <p className="mt-1">{leadAnalysis.whatTheyDo}</p>
                </div>

                {leadAnalysis.calmNextSteps.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-blue-700">What might help</p>
                    <ul className="mt-2 space-y-2">
                      {leadAnalysis.calmNextSteps.slice(0, 3).map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-blue-400">—</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card className="border-neutral-200 bg-white/90">
          <CardContent className="p-6">
            <h2 className="mb-3 text-xl font-semibold text-neutral-900">
              How does it work?
            </h2>
            <div className="space-y-4 text-neutral-700">
              <div>
                <h3 className="mb-1 font-medium text-neutral-900">1. We listen</h3>
                <p className="text-sm">
                  No forms. No pitch. Just space to talk about what's actually happening.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-neutral-900">2. We map</h3>
                <p className="text-sm">
                  We'll look at your operations and show you what's shifted—where friction 
                  is building and what's driving it.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-neutral-900">3. You decide</h3>
                <p className="text-sm">
                  We'll share what we see. You decide what makes sense. No pressure, no timeline.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-6 text-center">
            <p className="mb-4 text-lg font-medium text-emerald-900">
              Ready for a Second Look?
            </p>
            <Link
              href={tanjiaConfig.secondLookUrl || "#"}
              className="inline-block rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              Schedule a conversation
            </Link>
            <p className="mt-3 text-sm text-emerald-700">
              30 minutes. No commitment. Just clarity.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
