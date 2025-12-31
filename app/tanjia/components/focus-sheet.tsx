'use client';

import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";

type FocusSheetProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function FocusSheet({ open, title, description, onClose, children }: FocusSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/20 p-3 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-3xl"
          >
            <Card className="rounded-2xl border-neutral-200 shadow-2xl">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{title}</p>
                    {description ? <p className="text-xs text-neutral-600">{description}</p> : null}
                  </div>
                  <Button size="sm" variant="ghost" onClick={onClose}>
                    Close
                  </Button>
                </div>
                {children}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
