'use client';

import { motion } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import clsx from "clsx";

type CommandBarProps = {
  preset: "prospecting" | "meeting" | "client" | "onsite";
  onSelect: (action: CommandAction) => void;
};

export type CommandAction = "capture" | "reply" | "followup" | "mentor" | "present";

const orderByPreset: Record<CommandBarProps["preset"], CommandAction[]> = {
  prospecting: ["capture", "reply", "mentor", "followup", "present"],
  meeting: ["capture", "followup", "mentor", "reply", "present"],
  client: ["present", "mentor", "capture", "followup", "reply"],
  onsite: ["capture", "reply", "followup", "mentor", "present"],
};

const labels: Record<CommandAction, string> = {
  capture: "Capture",
  reply: "Reply",
  followup: "Follow-up",
  mentor: "Mentor",
  present: "Present",
};

export function CommandBar({ preset, onSelect }: CommandBarProps) {
  const actions = orderByPreset[preset];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-gradient-to-r from-white via-neutral-50 to-white p-3 shadow-sm backdrop-blur"
    >
      {actions.map((action) => (
        <Button
          key={action}
          size="md"
          variant="secondary"
          className={clsx(
            "flex-1 min-w-[130px] justify-center text-sm border-neutral-300 bg-white text-neutral-900 shadow-sm hover:bg-neutral-50",
            action === "present" && "border-neutral-400",
          )}
          onClick={() => onSelect(action)}
        >
          {labels[action]}
        </Button>
      ))}
    </motion.div>
  );
}
