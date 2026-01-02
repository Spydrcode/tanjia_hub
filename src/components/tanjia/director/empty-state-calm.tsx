'use client';

import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { HelpCircle } from "lucide-react";

type EmptyStateCalmProps = {
  whatWeKnow?: string;
  whatsMissing: string;
  nextAction: {
    label: string;
    href: string;
  };
};

export function EmptyStateCalm({ whatWeKnow, whatsMissing, nextAction }: EmptyStateCalmProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-neutral-100 p-3 mb-4">
          <HelpCircle className="h-6 w-6 text-neutral-400" />
        </div>
        
        {whatWeKnow && (
          <div className="mb-3">
            <p className="text-sm font-medium text-neutral-700">What we know</p>
            <p className="mt-1 text-xs text-neutral-500">{whatWeKnow}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm font-medium text-neutral-700">What's missing</p>
          <p className="mt-1 text-xs text-neutral-500">{whatsMissing}</p>
        </div>

        <Button asChild variant="secondary" size="sm">
          <Link href={nextAction.href}>{nextAction.label}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
