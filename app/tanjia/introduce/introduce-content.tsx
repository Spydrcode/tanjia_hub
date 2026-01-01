'use client';

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";

type IntentKey = "meeting" | "one_to_one" | "followup" | "bni";

type IntroduceContentProps = {
  intent: string;
  copy: { headline: string; body: string; closing: string };
  secondLookUrl: string;
};

const intentLabels: Record<IntentKey, string> = {
  meeting: "Meeting",
  one_to_one: "One-to-one",
  followup: "Follow-up",
  bni: "BNI",
};

export function IntroduceContent({ intent, copy, secondLookUrl }: IntroduceContentProps) {
  const [copied, setCopied] = useState(false);

  const fullScript = `${copy.body}\n\n${copy.closing}`;

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard?.writeText(fullScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // silent
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(intentLabels) as IntentKey[]).map((key) => (
          <Link
            key={key}
            href={`/tanjia/introduce?intent=${key}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              intent === key
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {intentLabels[key]}
          </Link>
        ))}
      </div>

      <motion.div
        key={intent}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="border-neutral-200 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
            <p className="text-sm font-semibold text-neutral-900">{copy.headline}</p>
            <div className="space-y-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
              <p>{copy.body}</p>
              <p className="italic text-neutral-600">{copy.closing}</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button size="sm" onClick={handleCopyScript}>
                {copied ? "Copied!" : "Copy script"}
              </Button>
              <Link
                href="/tanjia/present"
                className="text-xs text-neutral-500 hover:text-neutral-700"
              >
                Open client view
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <p className="text-center text-xs text-neutral-500">
        The 2ndmynd Loop: Listen → Clarify → Map → Decide → Support
      </p>
    </div>
  );
}
