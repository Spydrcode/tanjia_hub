'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, Globe, Users, Clock, HelpCircle, Presentation, CalendarClock } from "lucide-react";
import { PageShell } from "@/src/components/ui/page-shell";
import { IntentHeader } from "@/src/components/ui/intent-header";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { gradientText } from "@/src/components/ui/brand";

const tools = [
  {
    id: "networking",
    href: "/tanjia/tools/networking",
    icon: MessageSquare,
    name: "Networking Replies",
    anchor: "Reply",
    when: "Use this when you saw a post or received a DM and want a calm, thoughtful response.",
    cta: "Write a reply",
  },
  {
    id: "analyze",
    href: "/tanjia/tools/analyze",
    icon: Globe,
    name: "Website Analysis",
    anchor: "Analyze",
    when: "Use this when you want to understand what someone's business is doing and where they might be stuck.",
    cta: "Run analysis",
  },
  {
    id: "leads",
    href: "/tanjia/leads",
    icon: Users,
    name: "Leads",
    anchor: "Leads",
    when: "Use this to see signals on people you're keeping an eye on.",
    cta: "View leads",
  },
  {
    id: "followups",
    href: "/tanjia/followups",
    icon: Clock,
    name: "Follow-ups",
    anchor: "Follow-ups",
    when: "Use this to check who needs a gentle nudge.",
    cta: "View follow-ups",
  },
  {
    id: "scheduler",
    href: "/tanjia/tools/scheduler",
    icon: CalendarClock,
    name: "Cal Scheduling",
    anchor: "Scheduling",
    when: "Use this to book a calm slot on Cal.com without leaving the workspace.",
    cta: "Open scheduler",
  },
  {
    id: "helper",
    href: "/tanjia/helper",
    icon: HelpCircle,
    name: "Helper",
    anchor: "Helper",
    when: "Use this when you want Tanjia to assist with something specific.",
    cta: "Ask helper",
  },
  {
    id: "present",
    href: "/tanjia/present",
    icon: Presentation,
    name: "Present",
    anchor: "Present",
    when: "Use this to show a client-safe view without operator details.",
    cta: "Open presentation",
  },
];

export default function ToolsHubPage() {
  return (
    <PageShell maxWidth="lg">
      <IntentHeader
        badge="Operator"
        badgeVariant="operator"
        title="Your"
        anchor="Tools"
        subtitle="Everything you need between meetings. Pick one action."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool, idx) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
            >
              <Card className="group relative overflow-hidden border-neutral-200 bg-white/80 backdrop-blur transition hover:border-neutral-300 hover:shadow-sm">
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-50 text-neutral-600 transition group-hover:from-emerald-50 group-hover:to-blue-50 group-hover:text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold text-neutral-900">
                      {tool.name.replace(tool.anchor, '')}
                      <span className={gradientText()}>{tool.anchor}</span>
                    </h3>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {tool.when}
                  </p>
                  <div className="mt-auto pt-2">
                    <Link href={tool.href}>
                      <Button variant="secondary" size="sm" className="w-full">
                        {tool.cta}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </PageShell>
  );
}
