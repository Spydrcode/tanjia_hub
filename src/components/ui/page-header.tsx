import React from "react";
import { Button } from "./button";
import clsx from "clsx";
import { GradientHeading } from "./gradient-heading";

type PageHeaderProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  actionVariant?: "primary" | "secondary" | "ghost" | "destructive";
  eyebrow?: string;
  anchor?: string;
  align?: "left" | "center";
  size?: "xl" | "lg" | "md";
  children?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
  actionVariant = "primary",
  eyebrow,
  anchor,
  align = "left",
  size = "xl",
  children,
}: PageHeaderProps) {
  const ActionButton = actionLabel ? (
    actionHref ? (
      <Button asChild variant={actionVariant}>
        <a href={actionHref}>{actionLabel}</a>
      </Button>
    ) : (
      <Button onClick={actionOnClick} variant={actionVariant}>
        {actionLabel}
      </Button>
    )
  ) : null;

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className={clsx("flex flex-col gap-2", align === "center" && "items-center text-center")}>
        {anchor ? (
          <GradientHeading
            eyebrow={eyebrow}
            leading={title}
            anchor={anchor}
            subtitle={description}
            align={align}
            size={size}
          />
        ) : (
          <>
            {eyebrow ? <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">{eyebrow}</p> : null}
            <h1
              className={clsx(
                "font-semibold tracking-tight text-neutral-900",
                size === "lg" ? "text-3xl sm:text-4xl" : size === "md" ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl",
              )}
            >
              {title}
            </h1>
            {description ? <p className="text-sm text-neutral-600">{description}</p> : null}
          </>
        )}
        {children}
      </div>
      {ActionButton}
    </div>
  );
}
