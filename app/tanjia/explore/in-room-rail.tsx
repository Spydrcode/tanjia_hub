'use client';

import { motion } from "framer-motion";

export function InRoomRail() {
  const tips = [
    "Listen for what they're carrying.",
    "Name the pressure, not the tools.",
    "Offer Second Look only if asked.",
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="rounded-lg border border-neutral-200 bg-neutral-50/50 px-4 py-3"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
        In the room
      </p>
      <ul className="space-y-1">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-neutral-600">
            <span className="mt-0.5 text-neutral-400">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
