import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-ink/5 text-ink-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success/10 text-success",
  // For badges sitting directly on a photo — needs to read on any color/tone
  // of image, so it leans on blur + a hairline border rather than a flat fill.
  onImage: "border border-white/40 bg-white/90 text-ink backdrop-blur-sm",
  onImageSubtle: "bg-black/35 text-white backdrop-blur-sm",
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
