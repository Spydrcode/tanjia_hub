'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import type { LucideIcon } from "lucide-react";
import {
  MessageCircle,
  Users,
  CalendarClock,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  Presentation,
  LineChart,
} from "lucide-react";
import clsx from "clsx";

type ToolCardProps = {
  title: string;
  description: string;
  href: string;
  icon?: keyof typeof iconMap;
  primary?: boolean;
  statusChip?: string | null;
};

const iconMap: Record<string, LucideIcon> = {
  helper: MessageCircle,
  leads: Users,
  followups: ClipboardList,
  meetings: CalendarClock,
  scheduler: LineChart,
  system: ShieldCheck,
  presentation: Presentation,
  emyth: Sparkles,
};

export function ToolCard({ title, description, href, icon, primary, statusChip }: ToolCardProps) {
  const Icon = icon ? iconMap[icon] || Sparkles : Sparkles;
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
    >
      <Link href={href} className="block focus-visible:outline-none">
        <Card
          className={clsx(
            "relative h-full overflow-hidden border border-neutral-200/70 bg-white/90 p-4 shadow-sm backdrop-blur transition-colors hover:border-neutral-300",
            primary ? "ring-1 ring-inset ring-neutral-800/10" : "",
          )}
        >
          <div className="absolute inset-0 opacity-50" aria-hidden>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-neutral-50 via-white to-transparent" />
          </div>
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900/90 text-white">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{title}</p>
                <p className="text-xs text-neutral-600">{description}</p>
              </div>
            </div>
            {primary ? <Badge variant="muted">Primary</Badge> : null}
          </div>
          {statusChip ? <div className="mt-3 text-xs text-neutral-500">{statusChip}</div> : null}
        </Card>
      </Link>
    </motion.div>
  );
}
