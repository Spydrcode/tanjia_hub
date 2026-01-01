'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import clsx from "clsx";
import { ArrowLeft, Home } from "lucide-react";
import { GradientHeading } from "@/src/components/ui/gradient-heading";
import { zoneBadgeVariants, loopLine, zones, type ZoneId } from "@/app/tanjia/lib/zones";

type ZoneHeaderProps = {
  zone?: ZoneId;
  customBadge?: string;
  customBadgeClass?: string;
  title?: string;
  anchor?: string;
  question?: string;
  useWhen?: string;
  showLoopLine?: boolean;
  showBackToHub?: boolean;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
};

const zoneLabels: Record<ZoneId, string> = {
  listen: 'LISTEN',
  clarify: 'CLARIFY',
  map: 'MAP',
  decide: 'DECIDE',
  support: 'SUPPORT',
};

const zoneTitles: Record<ZoneId, string> = {
  listen: 'Listen',
  clarify: 'Clarify',
  map: 'Map',
  decide: 'Decide',
  support: 'Support',
};

export function ZoneHeader({
  zone,
  customBadge,
  customBadgeClass,
  title,
  anchor,
  question,
  useWhen,
  showLoopLine = true,
  showBackToHub = true,
  backHref = '/tanjia',
  backLabel = 'Back to Hub',
  actions,
  className,
}: ZoneHeaderProps) {
  // Derive from zones config when zone is provided
  const zoneConfig = zone ? zones.find(z => z.id === zone) : undefined;
  const derivedTitle = title || (zone ? zoneTitles[zone] : '');
  const derivedQuestion = question || zoneConfig?.question;
  const derivedUseWhen = useWhen || zoneConfig?.useWhen;
  
  const badgeText = customBadge || (zone ? zoneLabels[zone] : undefined);
  const badgeClass = customBadgeClass || (zone ? zoneBadgeVariants[zone] : 'bg-neutral-100 text-neutral-700');

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={clsx('flex flex-col gap-3', className)}
    >
      {/* Loop line */}
      {showLoopLine && (
        <p className="text-xs text-neutral-400 tracking-wide">
          {loopLine}
        </p>
      )}

      {/* Navigation row */}
      <div className="flex items-center justify-between gap-3">
        {showBackToHub && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            {backHref === '/tanjia' ? (
              <Home className="h-3.5 w-3.5" />
            ) : (
              <ArrowLeft className="h-3.5 w-3.5" />
            )}
            <span>{backLabel}</span>
          </Link>
        )}
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Zone badge */}
      {badgeText && (
        <span
          className={clsx(
            'self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]',
            badgeClass
          )}
        >
          {badgeText}
        </span>
      )}

      {/* Title with gradient anchor */}
      <GradientHeading
        leading=""
        anchor={anchor || derivedTitle}
        trailing=""
        size="lg"
        className="!text-left"
      />

      {/* Question answered */}
      {derivedQuestion && (
        <p className="text-base text-neutral-700 font-medium">
          {derivedQuestion}
        </p>
      )}

      {/* Use when hint */}
      {derivedUseWhen && (
        <p className="text-sm text-neutral-500">
          <span className="font-medium text-neutral-600">Use when:</span> {derivedUseWhen}
        </p>
      )}
    </motion.header>
  );
}
