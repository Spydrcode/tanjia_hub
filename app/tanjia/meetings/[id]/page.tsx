import Link from "next/link";
import { format } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { startMeeting, endMeetingAndGenerateResults } from "../actions";
import { RecordingSection } from "../components/recording-section";
import { PinButton } from "../../components/pin-button";

export default async function MeetingDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const meetingId = resolvedParams.id;
  const { supabase, user } = await requireAuthOrRedirect();
  const { data } = await supabase
    .from("meetings")
    .select("id, title, group_name, start_at, end_at, status, location_name, address, notes, completed_at, recording_url, transcript_text, transcript_source")
    .eq("id", meetingId)
    .eq("owner_id", user.id)
    .single();

  if (!data) return notFound();

  async function startAction() {
    "use server";
    await startMeeting(meetingId);
    redirect(`/tanjia/meetings/${meetingId}/start`);
  }

  async function endAction() {
    "use server";
    await endMeetingAndGenerateResults(meetingId);
    redirect(`/tanjia/meetings/${meetingId}/results`);
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.08em] text-neutral-500">Meeting</p>
          <h1 className="text-3xl font-semibold text-neutral-900">{data.title}</h1>
          {data.group_name ? <p className="text-sm text-neutral-600">{data.group_name}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <PinButton
            item={{
              id: meetingId,
              type: "meeting",
              title: data.title,
              href: `/tanjia/meetings/${meetingId}`,
              subtitle: `Meeting • ${format(new Date(data.start_at), "MMM d, h:mma")}`,
            }}
          />
          <Badge variant="muted">{data.status}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-2 p-4 text-sm text-neutral-700">
          <p>
            Start: {format(new Date(data.start_at), "MMM d, h:mma")} {data.end_at ? `- ${format(new Date(data.end_at), "h:mma")}` : ""}
          </p>
          {data.location_name ? <p>Location: {data.location_name}</p> : null}
          {data.address ? <p>Address: {data.address}</p> : null}
          {data.notes ? <p>Notes: {data.notes}</p> : null}

          <div className="flex flex-wrap gap-2 pt-3">
            <form action={startAction}>
              <Button type="submit" variant="secondary">
                Start meeting
              </Button>
            </form>
            <Button asChild variant="ghost">
              <Link href={`/tanjia/meetings/${meetingId}/start`}>Capture</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/tanjia/meetings/${meetingId}/results`}>Results</Link>
            </Button>
            {data.status !== "completed" ? (
              <form action={endAction}>
                <Button type="submit" variant="ghost">
                  End meeting
                </Button>
              </form>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Recording & Transcript Section */}
      <RecordingSection
        meetingId={meetingId}
        recordingUrl={data.recording_url}
        transcriptText={data.transcript_text}
        transcriptSource={data.transcript_source}
      />
    </div>
  );
}
