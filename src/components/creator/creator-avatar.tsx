import { cn } from "@/lib/utils";

const sizes = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-xl",
};

export function CreatorAvatar({
  name,
  size = "sm",
  className,
}: {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-ink/8 font-display font-medium text-ink-muted",
        sizes[size],
        className
      )}
    >
      {name[0]?.toUpperCase()}
    </span>
  );
}
