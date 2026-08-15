import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse bg-neutral-200/90 border border-black/10 rounded-none",
        className
      )}
      {...props}
    />
  );
}
