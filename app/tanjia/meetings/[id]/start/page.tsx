import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input, Textarea } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { SensitiveText } from "@/src/components/ui/sensitive-text";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";
import { addInteraction, updateInteraction, createLeadFromInteraction, endMeetingAndGenerateResults } from "../../actions";

export default async function MeetingStartPage({ params }: { params: { id: string } }) {
  const { supabase, user } = await requireAuthOrRedirect();
  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, title, group_name, start_at, location_name, address, status")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .single();

  if (!meeting) return notFound();

  const interactions =
    (await supabase
      .from("meeting_interactions")
      .select("id, person_name, company_name, role, notes, followup_priority, lead_id")
      .eq("meeting_id", meeting.id)
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })).data || [];

  async function addAction(formData: FormData) {
    "use server";
    await addInteraction({
      meetingId: params.id,
      personName: (formData.get("person_name") as string) || "",
      companyName: (formData.get("company_name") as string) || "",
      role: (formData.get("role") as string) || "",
      phone: (formData.get("phone") as string) || "",
      email: (formData.get("email") as string) || "",
      website: (formData.get("website") as string) || "",
      notes: (formData.get("notes") as string) || "",
      priority: ((formData.get("priority") as string) as any) || "warm",
    });
  }

  async function endAction() {
    "use server";
    await endMeetingAndGenerateResults(params.id);
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.08em] text-neutral-500">In progress</p>
          <h1 className="text-3xl font-semibold text-neutral-900">{meeting.title}</h1>
          {meeting.group_name ? <p className="text-sm text-neutral-600">{meeting.group_name}</p> : null}
          <p className="text-xs text-neutral-500">
            {format(new Date(meeting.start_at), "MMM d, h:mma")} {meeting.location_name ? `- ${meeting.location_name}` : ""}
          </p>
        </div>
        <Badge variant="warning">In progress</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardContent className="space-y-4 p-4">
            <h2 className="text-sm font-semibold text-neutral-900">Add interaction</h2>
            <form action={addAction} className="space-y-3" data-testid="meeting-add-interaction">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="person_name" placeholder="Person" />
                <Input name="company_name" placeholder="Company" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input name="role" placeholder="Role" />
                <Input name="phone" placeholder="Phone" />
                <Input name="email" placeholder="Email" />
              </div>
              <Input name="website" placeholder="Website" />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-neutral-700">
                  <span className="block text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Priority</span>
                  <select
                    name="priority"
                    defaultValue="warm"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  >
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                  </select>
                </label>
              </div>
              <Textarea name="notes" className="min-h-[120px]" placeholder="What was said, commitments, constraints" data-testid="meeting-interaction-input" />
              <Button type="submit" data-testid="meeting-interaction-save">Save interaction</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-4 text-sm text-neutral-700">
            <p className="text-sm font-semibold text-neutral-900">End meeting</p>
            <p className="text-xs text-neutral-600">Save everything, then generate follow-ups.</p>
            <form action={endAction}>
              <Button type="submit" variant="secondary">
                End and generate results
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900">Captured interactions</p>
            <p className="text-xs text-neutral-500">Most recent first</p>
          </div>
          {interactions.length === 0 ? (
            <p className="text-sm text-neutral-600">No interactions logged yet.</p>
          ) : (
            <div className="space-y-3" data-testid="meeting-interactions-list">
              {interactions.map((i) => (
                <InteractionRow key={i.id} interaction={i} meetingId={meeting.id} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InteractionRow({ interaction, meetingId }: { interaction: any; meetingId: string }) {
  async function updateAction(formData: FormData) {
    "use server";
    const notes = (formData.get("notes") as string) || "";
    const priority = (formData.get("priority") as string) || interaction.followup_priority;
    await updateInteraction(interaction.id, meetingId, notes, priority);
  }

  async function createLeadAction() {
    "use server";
    await createLeadFromInteraction(interaction.id);
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-3 text-sm text-neutral-800">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-neutral-900">
            <SensitiveText text={interaction.person_name || "Guest"} id={interaction.lead_id} />
          </p>
          {interaction.company_name ? (
            <p className="text-xs text-neutral-600">
              <SensitiveText text={interaction.company_name} id={interaction.lead_id} />
            </p>
          ) : null}
        </div>
        <Badge variant="muted">{interaction.followup_priority}</Badge>
      </div>
      <div className="mt-2 space-y-2">
        <form action={updateAction} className="space-y-2">
          <select
            name="priority"
            defaultValue={interaction.followup_priority}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>
          <Textarea name="notes" defaultValue={interaction.notes || ""} className="min-h-[80px]" placeholder="Notes" />
          <Button type="submit" size="sm" variant="secondary">
            Update
          </Button>
        </form>
        <form action={createLeadAction}>
          <Button type="submit" size="sm" variant="ghost">
            {interaction.lead_id ? "Lead linked" : "Create lead"}
          </Button>
        </form>
      </div>
    </div>
  );
}
