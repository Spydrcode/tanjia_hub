import clsx from "clsx";
import { ReactNode } from "react";

type GradientPillProps = {
  label?: string;
  delta?: number;
  tone?: "neutral" | "positive" | "negative";
  icon?: ReactNode;
  className?: string;
};

const toneClasses: Record<NonNullable<GradientPillProps["tone"]>, string> = {
  positive: "border-emerald-200 text-emerald-900 bg-gradient-to-r from-emerald-50 via-white to-white",
  negative: "border-amber-200 text-amber-900 bg-gradient-to-r from-amber-50 via-white to-white",
  neutral: "border-neutral-200 text-neutral-800 bg-gradient-to-r from-neutral-50 via-white to-white",
};

export function GradientPill({ label, delta, tone = "neutral", icon, className }: GradientPillProps) {
  const formattedDelta = delta !== undefined ? `${delta > 0 ? "+" : ""}${delta}` : undefined;
  const resolvedTone = delta !== undefined ? (delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral") : tone;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm",
        toneClasses[resolvedTone],
        className,
      )}
    >
      {icon}
      {label ? <span>{label}</span> : null}
      {formattedDelta ? <span className="tracking-tight">{formattedDelta}</span> : null}
    </span>
  );
}
