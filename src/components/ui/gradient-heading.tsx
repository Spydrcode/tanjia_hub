import clsx from "clsx";
import { gradientText } from "./brand";

type GradientHeadingProps = {
  eyebrow?: string;
  leading?: string;
  anchor?: string;
  trailing?: string;
  subtitle?: string;
  align?: "left" | "center";
  size?: "xl" | "lg" | "md";
  className?: string;
  subtitleClassName?: string;
};

const sizes: Record<NonNullable<GradientHeadingProps["size"]>, string> = {
  xl: "text-3xl sm:text-4xl",
  lg: "text-2xl sm:text-3xl",
  md: "text-xl sm:text-2xl",
};

export function GradientHeading({
  eyebrow,
  leading,
  anchor,
  trailing,
  subtitle,
  align = "left",
  size = "xl",
  className,
  subtitleClassName,
}: GradientHeadingProps) {
  return (
    <div className={clsx("flex flex-col gap-2", align === "center" && "items-center text-center", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">{eyebrow}</p>
      ) : null}
      <h1
        className={clsx(
          "font-semibold leading-tight tracking-tight text-neutral-900",
          sizes[size],
          "drop-shadow-sm",
        )}
      >
        {leading ? <span>{leading} </span> : null}
        {anchor ? <span className={gradientText()}>{anchor}</span> : null}
        {trailing ? <span> {trailing}</span> : null}
      </h1>
      {subtitle ? (
        <p className={clsx("text-sm text-neutral-600 sm:text-base", align === "center" && "max-w-2xl", subtitleClassName)}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
