import clsx from "clsx";
import React from "react";

type SeparatorProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
};

export function Separator({ 
  className, 
  orientation = "horizontal", 
  ...props 
}: SeparatorProps) {
  return (
    <div
      role="separator"
      className={clsx(
        "shrink-0 bg-neutral-200",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  );
}
