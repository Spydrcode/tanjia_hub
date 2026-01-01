'use client';

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import clsx from "clsx";

export type StepStatus = 'pending' | 'active' | 'complete';

export type Step = {
  label: string;
  status: StepStatus;
};

type ProgressStepperProps = {
  steps: Step[];
  className?: string;
};

export function ProgressStepper({ steps, className }: ProgressStepperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx("flex items-center gap-2", className)}
    >
      {steps.map((step, idx) => (
        <div key={step.label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <motion.div
              className={clsx(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors",
                step.status === 'complete' && "bg-emerald-100 text-emerald-700",
                step.status === 'active' && "bg-blue-100 text-blue-700",
                step.status === 'pending' && "bg-neutral-100 text-neutral-400"
              )}
              animate={step.status === 'active' ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <AnimatePresence mode="wait">
                {step.status === 'complete' ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </motion.span>
                ) : step.status === 'active' ? (
                  <motion.span
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="number"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {idx + 1}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
            <span
              className={clsx(
                "text-sm transition-colors",
                step.status === 'complete' && "text-emerald-700",
                step.status === 'active' && "text-blue-700 font-medium",
                step.status === 'pending' && "text-neutral-400"
              )}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={clsx(
                "h-px w-6 transition-colors",
                step.status === 'complete' ? "bg-emerald-300" : "bg-neutral-200"
              )}
            />
          )}
        </div>
      ))}
    </motion.div>
  );
}
