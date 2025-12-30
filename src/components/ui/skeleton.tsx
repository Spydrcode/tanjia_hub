import clsx from "clsx";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={clsx("animate-pulse rounded-lg bg-neutral-200/70", className)}
      {...props}
    />
  );
}

