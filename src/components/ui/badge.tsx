import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-ink/5 text-ink-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success/10 text-success",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
