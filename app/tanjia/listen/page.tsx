import type { Metadata } from "next";
import { ZoneHeader } from "@/src/components/ui/zone-header";
import { ListenClient } from "./listen-client";

export const metadata: Metadata = {
  title: "Listen - 2ndmynd",
  description: "Stay present, recall context fast, and act calmly.",
};

export default async function ListenPage() {
  return (
    <div className="flex flex-col gap-6">
      <ZoneHeader
        zone="listen"
        title="Listen"
        anchor="Conversations"
        question="What's the next conversation to open?"
        useWhen="When you need to see what's active and where to focus your attention."
      />
      
      <ListenClient />
    </div>
  );
}
