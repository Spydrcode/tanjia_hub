'use client';

import { useMemo, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { useViewModes } from "@/src/components/ui/view-modes";
import { ExplainHint } from "@/src/components/ui/explain-hint";
import { SensitiveText } from "@/src/components/ui/sensitive-text";
import { brandGradients } from "@/src/components/ui/brand";

type Duration = 15 | 30;

type Props = {
  calLinks: { "15": string; "30": string };
  defaultDuration: Duration;
  leadContext?: { id?: string; name?: string; email?: string };
  userId?: string;
  bookingRedirectUrl?: string;
};

export default function SchedulerClient({ calLinks, defaultDuration, leadContext, userId, bookingRedirectUrl }: Props) {
  const [selected, setSelected] = useState<Duration>(defaultDuration);
  const { presentationMode } = useViewModes();

  const embedUrl = useMemo(() => {
    const key = (selected.toString() as "15" | "30") || "15";
    const base = calLinks[key];
    try {
      const url = new URL(base);
      url.searchParams.set("embed", "inline");
      url.searchParams.set("layout", "month_view");
      url.searchParams.set("hideEventTypeDetails", "true");
      url.searchParams.set("primaryColor", "111827");
      if (bookingRedirectUrl) url.searchParams.set("redirectTo", bookingRedirectUrl);
      if (userId) url.searchParams.set("metadata[supabaseUserId]", userId);
      if (!presentationMode) {
        if (leadContext?.id) url.searchParams.set("metadata[leadId]", leadContext.id);
        if (leadContext?.email) {
          url.searchParams.set("metadata[leadEmail]", leadContext.email);
          url.searchParams.set("prefill[email]", leadContext.email);
        }
        if (leadContext?.name) {
          url.searchParams.set("metadata[leadName]", leadContext.name);
          url.searchParams.set("prefill[name]", leadContext.name);
        }
      }
      return url.toString();
    } catch {
      return base;
    }
  }, [
    bookingRedirectUrl,
    calLinks,
    leadContext?.email,
    leadContext?.id,
    leadContext?.name,
    presentationMode,
    selected,
    userId,
  ]);

  const handleSelect = (duration: Duration) => {
    setSelected(duration);
    fetch("/api/scheduling/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "duration_selected",
        leadId: leadContext?.id,
        duration,
        metadata: { source: "scheduler_page" },
      }),
    }).catch(() => null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
      <div className="space-y-4">
        <Card className="border-neutral-200 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">Duration</p>
                <h2 className="text-xl font-semibold text-neutral-900">Pick the smallest slot that fits.</h2>
              </div>
              <ExplainHint target="scheduler.cards" />
              <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white">
                Cal.com
              </span>
            </div>
            <p className="text-sm text-neutral-600">No pitch. Just a simple next step.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                { duration: 15 as Duration, title: "15 minutes", subtitle: "Quick alignment" },
                { duration: 30 as Duration, title: "30 minutes", subtitle: "Working session" },
              ] as const).map((item) => (
                <button
                  key={item.duration}
                  type="button"
                  onClick={() => handleSelect(item.duration)}
                  className={`group relative overflow-hidden rounded-xl border ${
                    selected === item.duration ? "border-neutral-900 shadow-lg" : "border-neutral-200 shadow-sm"
                  } bg-white px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400`}
                >
                  <div
                    className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${
                      item.duration === 15 ? brandGradients.accentA : brandGradients.accentB
                    }`}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                      <p className="text-xs text-neutral-600">{item.subtitle}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                        selected === item.duration ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {selected === item.duration ? "Selected" : "Choose"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {leadContext?.name || leadContext?.email ? (
              <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
                <p className="font-medium text-neutral-800">Lead context</p>
                {leadContext?.name ? (
                  <p>
                    Name: <SensitiveText text={leadContext.name} id={leadContext.id} mask="lead" />
                  </p>
                ) : null}
                {leadContext?.email ? (
                  <p>
                    Email: <SensitiveText text={leadContext.email} mask="email" />
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="rounded-lg bg-neutral-900 px-4 py-3 text-sm text-white shadow-md">
              <p className="font-medium">Quiet Founder</p>
              <p className="text-neutral-200">Keep it simple. We can always extend if needed.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">Selected</p>
            <h3 className="text-lg font-semibold text-neutral-900">{selected} minutes</h3>
          </div>
          <Button variant="secondary" size="sm" onClick={() => handleSelect(selected === 15 ? 30 : 15)}>
            Switch to {selected === 15 ? "30" : "15"}
          </Button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg transition">
          <div className="flex items-center justify-between border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">Scheduling</p>
              <p className="text-xs text-neutral-600">Booking stays inside the workspace.</p>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-700">
              {selected} min
            </span>
            <ExplainHint target="scheduler.embed" />
          </div>
          <div className="h-[760px] w-full bg-neutral-50">
            <iframe
              title="Scheduling"
              src={embedUrl}
              className="h-full w-full"
              allow="fullscreen"
              loading="lazy"
            />
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          Booking created, rescheduled, or canceled events are logged and followed up automatically.
        </p>
      </div>
    </div>
  );
}
