'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";

import clsx from "clsx";

type CopyFieldProps = {
  label: string;
  value: string;
  className?: string;
};

function CopyField({ label, value, className }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // silent
    }
  };

  return (
    <div className={clsx("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 gap-1.5 px-2 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-600" />
              <span className="text-emerald-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>
      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700 leading-relaxed">
        {value}
      </div>
    </div>
  );
}

type OutputCardProps = {
  title?: string;
  fields: Array<{
    label: string;
    value: string;
  }>;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    icon?: React.ReactNode;
  }>;
  className?: string;
};

export function OutputCard({ title, fields, actions, className }: OutputCardProps) {
  const validFields = fields.filter(f => f.value?.trim());
  
  if (validFields.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
    >
      <Card className={clsx("border-neutral-200 bg-white/80 backdrop-blur", className)}>
        {title && (
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-neutral-900">
              {title}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={clsx(!title && "pt-4")}>
          <div className="space-y-4">
            {validFields.map((field, idx) => (
              <div key={field.label}>
                <CopyField label={field.label} value={field.value} />
                {idx < validFields.length - 1 && (
                  <div className="mt-4 h-px w-full bg-neutral-200" />
                )}
              </div>
            ))}
          </div>
          
          {actions && actions.length > 0 && (
            <>
              <div className="my-4 h-px w-full bg-neutral-200" />
              <div className="flex flex-wrap items-center gap-2">
                {actions.map((action) => (
                  <Button
                    key={action.label}
                    variant={action.variant || 'secondary'}
                    size="sm"
                    onClick={action.onClick}
                    className="gap-1.5"
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

type BulletListCardProps = {
  title: string;
  items: string[];
  className?: string;
};

export function BulletListCard({ title, items, className }: BulletListCardProps) {
  const [copied, setCopied] = useState(false);

  if (!items?.length) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(items.join('\n• '));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // silent
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={clsx("border-neutral-200 bg-white/80 backdrop-blur", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-neutral-900">
              {title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 gap-1.5 px-2 text-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-1.5">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-neutral-700">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-neutral-400" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
