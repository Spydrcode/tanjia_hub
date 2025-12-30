import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { formatISO } from "date-fns";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input, Textarea } from "@/src/components/ui/input";
import { createMeeting } from "../actions";
import { requireAuthOrRedirect } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "New meeting",
  description: "Create a meeting.",
  robots: { index: false, follow: false },
};

export default async function NewMeetingPage() {
  await requireAuthOrRedirect();

  async function action(formData: FormData) {
    "use server";
    const title = (formData.get("title") as string) || "";
    const groupName = (formData.get("group_name") as string) || "";
    const date = (formData.get("date") as string) || "";
    const time = (formData.get("time") as string) || "";
    const startAt = date && time ? new Date(`${date}T${time}:00`).toISOString() : formatISO(new Date());
    const endAt = (formData.get("end_time") as string) || "";
    const locationName = (formData.get("location_name") as string) || "";
    const address = (formData.get("address") as string) || "";
    const notes = (formData.get("notes") as string) || "";

    const meetingId = await createMeeting({
      title,
      groupName,
      startAt,
      endAt: endAt ? new Date(`${date}T${endAt}:00`).toISOString() : undefined,
      locationName,
      address,
      notes,
    });

    redirect(`/tanjia/meetings/${meetingId}`);
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <p className="text-sm uppercase tracking-[0.08em] text-neutral-500">Tanjia</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">New meeting</h1>
        <p className="text-sm text-neutral-600">Keep it simple. Add details you need on the day.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <form action={action} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-neutral-700">
                <span className="block text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Title</span>
                <Input name="title" required placeholder="Conversation with..." />
              </label>
              <label className="text-sm text-neutral-700">
                <span className="block text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Group / Context</span>
                <Input name="group_name" placeholder="Team, event, or context" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm text-neutral-700">
                <span className="block text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Date</span>
                <Input type="date" name="date" required />
              </label>
              <label className="text-sm text-neutral-700">
                <span className="block text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Time</span>
                <Input type="time" name="time" required />
              </label>
              <label className="text-sm text-neutral-700">
                <span className="block text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">End time (optional)</span>
                <Input type="time" name="end_time" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-neutral-700">
                <span className="block text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Location</span>
                <Input name="location_name" placeholder="Office, Zoom, coffee shop" />
              </label>
              <label className="text-sm text-neutral-700">
                <span className="block text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Address</span>
                <Input name="address" placeholder="Address or link" />
              </label>
            </div>

            <label className="text-sm text-neutral-700">
              <span className="block text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Notes</span>
              <Textarea name="notes" className="min-h-[120px]" placeholder="Goals, what to avoid" />
            </label>

            <Button type="submit">Create meeting</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
