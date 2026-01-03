"use client";

import { useState, useEffect } from "react";
import { Pin } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { isPinned, togglePin, type PinnedItem } from "../lib/pins";

type PinButtonProps = {
  item: PinnedItem;
  className?: string;
};

export function PinButton({ item, className }: PinButtonProps) {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    setPinned(isPinned(item.href));
  }, [item.href]);

  const handleToggle = () => {
    togglePin(item);
    setPinned(!pinned);
    
    // Trigger storage event for cross-component sync
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition",
        pinned
          ? "border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
        className
      )}
      title={pinned ? "Unpin" : "Pin to sidebar"}
    >
      <Pin className={cn("h-4 w-4", pinned && "fill-current")} />
      {pinned ? "Pinned" : "Pin"}
    </button>
  );
}
