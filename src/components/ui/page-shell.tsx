'use client';

import { motion } from "framer-motion";
import clsx from "clsx";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl";
};

const widths = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
};

export function PageShell({ children, className, maxWidth = "md" }: PageShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={clsx("mx-auto flex flex-col gap-6 pb-12", widths[maxWidth], className)}
    >
      {children}
    </motion.div>
  );
}
