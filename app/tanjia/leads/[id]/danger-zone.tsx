"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

type DangerZoneProps = {
  leadId: string;
  onDeleteAction: (leadId: string) => Promise<{ success: boolean; error?: string }>;
};

export function DangerZone({ leadId, onDeleteAction }: DangerZoneProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isConfirmed = confirmText === "DELETE";

  const handleDelete = () => {
    if (!isConfirmed) return;
    setError(null);

    startTransition(async () => {
      const result = await onDeleteAction(leadId);
      if (result.success) {
        router.push("/tanjia/leads");
      } else {
        setError(result.error || "Could not delete.");
      }
    });
  };

  const handleCancel = () => {
    setConfirming(false);
    setConfirmText("");
    setError(null);
  };

  return (
    <Card className="border-red-200/50 shadow-sm">
      <CardHeader className="pb-2">
        <p className="text-sm font-semibold text-neutral-900">Danger zone</p>
        <p className="text-xs text-neutral-500">
          Deleting a lead removes all related notes, follow-ups, and messages.
        </p>
      </CardHeader>
      <CardContent>
        {!confirming ? (
          <Button
            variant="secondary"
            size="sm"
            className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            onClick={() => setConfirming(true)}
          >
            Delete lead
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-neutral-600">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm.
            </p>
            <Input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="max-w-44 text-sm"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={!isConfirmed || isPending}
                onClick={handleDelete}
              >
                {isPending ? "Deleting..." : "Confirm delete"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
