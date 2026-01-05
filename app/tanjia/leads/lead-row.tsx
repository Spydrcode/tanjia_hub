'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Badge } from "@/src/components/ui/badge";
import { SensitiveText } from "@/src/components/ui/sensitive-text";

type LeadRowProps = {
  lead: {
    id: string;
    name: string;
    website?: string | null;
    status?: string | null;
  };
  lastRun?: string;
  nextDue?: string;
};

export function LeadRow({ lead, lastRun, nextDue }: LeadRowProps) {
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/demo") ? "/demo" : "/tanjia";
  const host = lead.website ? lead.website.replace(/^https?:\/\//, "").split("/")[0] : "";

  return (
    <motion.div
      whileHover={{ backgroundColor: "rgba(250, 250, 250, 1)" }}
      transition={{ duration: 0.15 }}
    >
      <Link
        href={`${basePath}/leads/${lead.id}`}
        data-testid="lead-row"
        data-lead-id={lead.id}
        className="flex flex-col gap-2 py-3 px-1 -mx-1 rounded"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <p className="text-base font-semibold text-neutral-900">
              <SensitiveText text={lead.name} id={lead.id} />
            </p>
            {host ? <p className="text-xs text-neutral-500">{host}</p> : null}
          </div>
          <Badge variant="muted">{lead.status || "new"}</Badge>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
          <span>Last run: {lastRun ? format(new Date(lastRun), "MMM d, h:mma") : "Not yet"}</span>
          <span>
            Next follow-up: {nextDue ? format(new Date(nextDue), "MMM d, h:mma") : "None"}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
