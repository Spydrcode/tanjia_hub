import clsx from "clsx";
import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={clsx("rounded-xl border border-neutral-200 bg-white shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={clsx("p-4 sm:p-5", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={clsx("p-4 sm:p-5 pt-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={clsx("text-lg font-semibold text-neutral-900", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={clsx("text-sm text-neutral-500", className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardProps) {
  return <div className={clsx("flex items-center p-4 sm:p-5 pt-0", className)} {...props} />;
}

