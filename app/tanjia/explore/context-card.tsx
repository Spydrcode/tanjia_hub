'use client';

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { MessageSquare, Clock } from "lucide-react";

type ContextCardProps = {
  icon: "message" | "clock";
  title: string;
  content: string;
};

const icons = {
  message: MessageSquare,
  clock: Clock,
};

export function ContextCard({ icon, title, content }: ContextCardProps) {
  const Icon = icons[icon];
  
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <Card className="h-full shadow-sm transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-neutral-500" />
            <p className="text-sm font-semibold text-neutral-900">{title}</p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p
            className="text-sm leading-relaxed text-neutral-700"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {content}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
