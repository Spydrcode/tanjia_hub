import React from "react";
import { Button } from "./button";
import clsx from "clsx";

type PageHeaderProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  actionVariant?: "primary" | "secondary" | "ghost" | "destructive";
  children?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
  actionVariant = "primary",
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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className={clsx("flex flex-col gap-1")}>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description ? <p className="text-sm text-neutral-600">{description}</p> : null}
        {children}
      </div>
      {ActionButton}
    </div>
  );
}

