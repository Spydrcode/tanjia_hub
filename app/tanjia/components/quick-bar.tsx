'use client';

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import clsx from "clsx";

export type QuickAction = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
};

type QuickBarProps = {
  actions: QuickAction[];
  density: "compact" | "comfortable";
  focusMode: boolean;
};

export function QuickBar({ actions, density, focusMode }: QuickBarProps) {
  const cols = density === "comfortable" ? "md:grid-cols-2" : "md:grid-cols-3";
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={`${density}-${focusMode}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
        className={clsx("mt-3 grid gap-2", cols)}
      >
        {actions.map((action) => {
          if (action.href) {
            return (
              <Button key={action.id} asChild size={focusMode ? "lg" : "sm"} className="justify-start">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            );
          }
          return (
            <Button
              key={action.id}
              size={focusMode ? "lg" : "sm"}
              variant="secondary"
              className="justify-start"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
