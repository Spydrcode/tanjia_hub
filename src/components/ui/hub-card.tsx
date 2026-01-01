'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "./card";
import { gradientText } from "./brand";

type HubCardProps = {
  title: string;
  anchor?: string;
  subtitle: string;
  href: string;
  delay?: number;
};

export function HubCard({ title, anchor, subtitle, href, delay = 0 }: HubCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay }}
      whileHover={{ y: -2 }}
    >
      <Link href={href} className="block">
        <Card className="group cursor-pointer border-neutral-200 bg-white shadow-sm transition-all hover:border-neutral-300 hover:shadow-md">
          <CardContent className="flex flex-col gap-2 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">
              {title}
              {anchor && <span className={gradientText()}> {anchor}</span>}
            </h2>
            <p className="text-sm text-neutral-600">{subtitle}</p>
            <span className="mt-1 text-xs font-medium text-neutral-500 transition group-hover:text-neutral-700">
              Open →
            </span>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
