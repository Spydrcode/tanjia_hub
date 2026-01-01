'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "./card";
import { Button } from "./button";

type ToolCardProps = {
  title: string;
  useWhen: string;
  href: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  icon?: React.ReactNode;
};

export function ToolCard({
  title,
  useWhen,
  href,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
  icon,
}: ToolCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <Card className="h-full shadow-sm transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            {icon && <span className="text-neutral-500">{icon}</span>}
            <p className="text-sm font-semibold text-neutral-900">{title}</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs text-neutral-600">{useWhen}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm">
              <Link href={href}>{ctaLabel}</Link>
            </Button>
            {secondaryHref && secondaryLabel && (
              <Link
                href={secondaryHref}
                className="text-xs text-neutral-500 hover:text-neutral-700 underline underline-offset-2"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
