'use client';

import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/input";
import { useState } from "react";

type Props = { onClose: () => void; preset: "prospecting" | "meeting" | "client" | "onsite" };

export function CaptureFocus({ onClose, preset }: Props) {
  const [note, setNote] = useState("");
  const placeholder =
    preset === "onsite" ? "Quick onsite note..." : "Paste a post or quick detail; full lead capture opens in Leads.";

  return (
    <div className="space-y-3">
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={placeholder} className="min-h-[120px]" />
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/tanjia/leads/new" onClick={onClose}>
            Open lead capture
          </Link>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link href="/tanjia/meetings/new" onClick={onClose}>
            Create meeting
          </Link>
        </Button>
      </div>
    </div>
  );
}
