'use client';

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input, Textarea } from "@/src/components/ui/input";
import { brandGradients } from "@/src/components/ui/brand";
import { ExplainHint } from "@/src/components/ui/explain-hint";
import { maskEmail, maskPhone, useViewModes } from "@/src/components/ui/view-modes";

type EnrichResponse = {
  signals: {
    website: string;
    title?: string;
    services?: string[];
    locations?: string[];
    contact?: { email?: string; phone?: string };
    socials?: { platform: string; url: string }[];
    credibility?: string[];
    snippetSources?: { url: string; via: string }[];
  };
  overview: {
    bio: string;
    likelyNeeds: string[];
    suggestedNextStep: string;
  };
};

type Props = {
  onCreate: (formData: FormData) => Promise<void>;
};

export default function NewLeadClient({ onCreate }: Props) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("new");
  const [enrichment, setEnrichment] = useState<EnrichResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { presentationMode } = useViewModes();

  const handleEnrich = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tanjia/lead-enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website, name, location, notes }),
      });
      const data = (await res.json().catch(() => null)) as EnrichResponse | { error?: string } | null;
      if (!res.ok || !data) {
        throw new Error((data as { error?: string })?.error || "Could not fetch signals.");
      }
      setEnrichment(data as EnrichResponse);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to enrich right now.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const enrichmentValue = enrichment ? JSON.stringify(enrichment) : "";

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16 sm:py-20">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.08em] text-neutral-500">Tanjia</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">New lead</h1>
            <p className="text-sm text-neutral-600">Add what you know now. Enrich gently before saving.</p>
          </div>
          <Link href="/tanjia/leads" className="text-sm text-neutral-600 underline hover:text-neutral-800">
            Back
          </Link>
        </header>

        <form action={onCreate} className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <input type="hidden" name="enrichment" value={enrichmentValue} />
          <label className="flex flex-col gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Name</span>
            <Input name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Lead name" />
          </label>

          <label className="flex flex-col gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Website</span>
            <Input
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Location</span>
            <Input name="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, region" />
          </label>

          <label className="flex flex-col gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Email (optional)</span>
            <Input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Status</span>
            <Input name="status" value={status} onChange={(e) => setStatus(e.target.value)} />
          </label>

          <label className="flex flex-col gap-2 text-sm text-neutral-700">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Notes</span>
            <Textarea
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px]"
              placeholder="Context, constraints, or shared interests"
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleEnrich} disabled={(!website && !name) || loading}>
              {loading ? "Working..." : "Fetch website signals"}
            </Button>
            <Button type="button" variant="ghost" onClick={handleEnrich} disabled={loading}>
              Generate quick overview
            </Button>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <ExplainHint target="lead.enrich" />
              <span>Agents stay light-touch. Nothing is saved until you submit.</span>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {enrichment ? (
            <div className="grid gap-3 rounded-xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
              <Card className={`overflow-hidden shadow-sm bg-gradient-to-br ${brandGradients.surface}`}>
                <CardContent className="space-y-2 p-4">
                  <p className="text-sm font-semibold text-neutral-900">Website signals</p>
                  <div className="space-y-1 text-sm text-neutral-700">
                    <p>Website: {enrichment.signals.website || ""}</p>
                    {enrichment.signals.title ? <p>Title: {enrichment.signals.title}</p> : null}
                    {enrichment.signals.services?.length ? (
                      <p>Services: {enrichment.signals.services.join(", ")}</p>
                    ) : null}
                    {enrichment.signals.locations?.length ? (
                      <p>Locations: {enrichment.signals.locations.join(", ")}</p>
                    ) : null}
                    {enrichment.signals.contact?.email ? (
                      <p>Email: {presentationMode ? maskEmail(enrichment.signals.contact.email) : enrichment.signals.contact.email}</p>
                    ) : null}
                    {enrichment.signals.contact?.phone ? (
                      <p>Phone: {presentationMode ? maskPhone(enrichment.signals.contact.phone) : enrichment.signals.contact.phone}</p>
                    ) : null}
                    {enrichment.signals.credibility?.length ? (
                      <p>Signals: {enrichment.signals.credibility.join("; ")}</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="space-y-2 p-4">
                  <p className="text-sm font-semibold text-neutral-900">Quick overview</p>
                  <p className="text-sm text-neutral-700">{enrichment.overview.bio}</p>
                  <div className="space-y-1 text-sm text-neutral-700">
                    <p className="font-medium text-neutral-900">Likely needs</p>
                    <ul className="list-disc space-y-1 pl-4">
                      {enrichment.overview.likelyNeeds.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-sm text-neutral-700">
                    Suggested next step: {enrichment.overview.suggestedNextStep}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={!name || loading}
            >
              Create lead
            </Button>
            {enrichment ? <span className="text-xs text-neutral-500">Enrichment will be saved to lead snapshots.</span> : null}
          </div>
        </form>
      </div>
    </div>
  );
}
