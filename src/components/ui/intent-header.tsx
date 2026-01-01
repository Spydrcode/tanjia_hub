import Link from "next/link";
import clsx from "clsx";
import { gradientText } from "./brand";

type IntentHeaderProps = {
  loopLine?: boolean;
  badge?: string;
  badgeVariant?: "operator" | "client" | "listen";
  title: string;
  anchor?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
};

const badgeStyles = {
  operator: "bg-amber-100 text-amber-800",
  client: "bg-emerald-100 text-emerald-800",
  listen: "bg-blue-100 text-blue-800",
};

export function IntentHeader({
  loopLine = true,
  badge,
  badgeVariant = "operator",
  title,
  anchor,
  subtitle,
  backHref = "/tanjia",
  backLabel = "Back to Start",
  className,
}: IntentHeaderProps) {
  return (
    <div className={clsx("flex flex-col gap-3", className)}>
      {loopLine && (
        <p className="text-xs text-neutral-500">
          The 2ndmynd Loop: Listen → Clarify → Map → Decide → Support
        </p>
      )}
      
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
        >
          <span>←</span>
          <span>{backLabel}</span>
        </Link>
      </div>

      {badge && (
        <span className={clsx(
          "self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]",
          badgeStyles[badgeVariant]
        )}>
          {badge}
        </span>
      )}

      <h1 className="text-2xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-3xl">
        {title}
        {anchor && <span className={gradientText()}> {anchor}</span>}
      </h1>

      {subtitle && (
        <p className="text-sm text-neutral-600 sm:text-base">{subtitle}</p>
      )}
    </div>
  );
}
