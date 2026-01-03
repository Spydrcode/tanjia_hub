'use client';

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";

type CoachContent = { title: string; body: string };

function getContent(path: string): CoachContent {
  if (path === "/tanjia") {
    return {
      title: "Start",
      body: "Pick the path that matches the room you're in.",
    };
  }
  if (path.startsWith("/tanjia/explore")) {
    return {
      title: "In a meeting",
      body: "Read one line. Ask one question. Don't drift into tools unless needed.",
    };
  }
  if (path.startsWith("/tanjia/prepare")) {
    return {
      title: "After meeting",
      body: "Log the person, set the follow-up, then exit.",
    };
  }
  if (path.startsWith("/tanjia/leads")) {
    return {
      title: "Leads",
      body: "Pick one lead to work next. Don't browse.",
    };
  }
  if (path.startsWith("/tanjia/introduce")) {
    return {
      title: "Explain",
      body: "Say it once. Offer the link only if they ask.",
    };
  }
  if (path.startsWith("/tanjia/present")) {
    return {
      title: "Client view",
      body: "This is Client View. Keep it simple.",
    };
  }
  return {
    title: "Right now",
    body: "Pick the path that matches the room you're in.",
  };
}

export function GuideWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const content = getContent(pathname || "");

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        <motion.div
          key="coach-toggle"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-auto"
        >
          <Button variant="secondary" size="sm" className="shadow-sm" onClick={() => setOpen((v) => !v)}>
            Coach
          </Button>
        </motion.div>

        {open ? (
          <motion.div
            key="coach-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto w-80"
          >
            <Card className="border-neutral-200/80 bg-white/95 p-4 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.08em] text-neutral-500">{content.title}</p>
                <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
              <p className="mt-2 text-sm text-neutral-700">{content.body}</p>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
