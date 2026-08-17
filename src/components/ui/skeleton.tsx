import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-ink/8", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="mb-4 break-inside-avoid">
      <Skeleton className="w-full aspect-[4/5]" />
      <Skeleton className="mt-2 h-3 w-2/3" />
      <Skeleton className="mt-1.5 h-3 w-1/3" />
    </div>
  );
}
