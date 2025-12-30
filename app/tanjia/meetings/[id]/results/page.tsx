import { notFound } from "next/navigation";
import { Card, CardContent } from "@/src/components/ui/card";
import { SensitiveText } from "@/src/components/ui/sensitive-text";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";

export default async function MeetingResultsPage({ params }: { params: { id: string } }) {
  const { supabase, user } = await requireAuthOrRedirect();
  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, title")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .single();

  if (!meeting) return notFound();

  const { data: result } = await supabase
    .from("meeting_results")
    .select("summary_md, followup_plan_json, intro_tests_json, improvements_json")
    .eq("meeting_id", meeting.id)
    .eq("owner_id", user.id)
    .single();

  if (!result) {
    return (
      <div className="flex flex-col gap-4 pb-12">
        <h1 className="text-2xl font-semibold text-neutral-900">{meeting.title}</h1>
        <p className="text-sm text-neutral-600">Results will appear here after the meeting is completed.</p>
      </div>
    );
  }

  const followups = Array.isArray(result.followup_plan_json) ? result.followup_plan_json : [];
  const improvements = Array.isArray(result.improvements_json) ? result.improvements_json : [];
  const introTests = (result.intro_tests_json as any) || {};

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <p className="text-sm uppercase tracking-[0.08em] text-neutral-500">Results</p>
        <h1 className="text-3xl font-semibold text-neutral-900">{meeting.title}</h1>
      </div>

      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold text-neutral-900">Summary</p>
          <p className="whitespace-pre-wrap text-sm text-neutral-700">
            <SensitiveText text={result.summary_md} mask="note" />
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold text-neutral-900">Follow-up plan</p>
          {followups.length === 0 ? (
            <p className="text-sm text-neutral-600">No follow-ups generated.</p>
          ) : (
            <div className="space-y-3">
              {followups.map((item: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-neutral-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-neutral-900">{item.priority || "warm"}</p>
                    <p className="text-xs text-neutral-500"><SensitiveText text={item.next_step || ""} mask="note" /></p>
                  </div>
                  <p className="text-sm text-neutral-800">
                    <SensitiveText text={item.person || "Person"} />
                    {item.company ? (
                      <span>
                        {" "}- <SensitiveText text={item.company} />
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-neutral-600">
                    <SensitiveText text={item.reason} mask="note" />
                  </p>
                  <p className="text-sm text-neutral-700">
                    <SensitiveText text={item.next_message} mask="message" />
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold text-neutral-900">Intro A/B tests</p>
          <div className="space-y-2 text-sm text-neutral-700">
            <div>
              <p className="font-semibold">Intro A</p>
              <p>{introTests.intro_a?.text}</p>
              <p className="text-xs text-neutral-500">When: {introTests.intro_a?.when_to_use}</p>
            </div>
            <div>
              <p className="font-semibold">Intro B</p>
              <p>{introTests.intro_b?.text}</p>
              <p className="text-xs text-neutral-500">When: {introTests.intro_b?.when_to_use}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold text-neutral-900">Improvements</p>
          {improvements.length === 0 ? (
            <p className="text-sm text-neutral-600">No suggestions captured.</p>
          ) : (
            <ul className="space-y-2 text-sm text-neutral-700">
              {improvements.map((item: any, idx: number) => (
                <li key={idx} className="rounded-lg border border-neutral-200 p-2">
                  <p className="font-semibold text-neutral-900">{item.title}</p>
                  <p className="text-xs text-neutral-600">Why: {item.why}</p>
                  <p className="text-xs text-neutral-600">Try next: {item.try_next_time}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



