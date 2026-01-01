import clsx from "clsx";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "muted" | "success" | "warning" | "secondary";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "bg-neutral-900 text-white",
    muted: "bg-neutral-100 text-neutral-700",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    secondary: "bg-neutral-100 text-neutral-600 border border-neutral-200",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

