import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  xs: { className: "h-5 w-5 text-[10px]", px: 20 },
  sm: { className: "h-7 w-7 text-xs", px: 28 },
  md: { className: "h-10 w-10 text-sm", px: 40 },
  lg: { className: "h-14 w-14 text-xl", px: 56 },
  xl: { className: "h-20 w-20 text-3xl", px: 80 },
};

export function CreatorAvatar({
  name,
  imageUrl,
  size = "sm",
  className,
}: {
  name: string;
  imageUrl?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const { className: sizeClass, px } = sizes[size];

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={px}
        height={px}
        className={cn("shrink-0 rounded-full object-cover", sizeClass, className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-ink/8 font-display font-medium text-ink-muted",
        sizeClass,
        className
      )}
    >
      {name[0]?.toUpperCase()}
    </span>
  );
}
