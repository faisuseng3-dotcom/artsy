"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  default: "h-11 w-11 border border-ink/15 hover:border-ink/30",
  overlay: "h-8 w-8 border border-white/40 bg-white/85 backdrop-blur-sm hover:bg-white",
};

export function SaveButton({
  productId,
  initialSaved,
  isSignedIn,
  variant = "default",
  className,
}: {
  productId: string;
  initialSaved: boolean;
  isSignedIn: boolean;
  variant?: keyof typeof variants;
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [bump, setBump] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!bump) return;
    const t = setTimeout(() => setBump(false), 200);
    return () => clearTimeout(t);
  }, [bump]);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isSignedIn) {
          router.push("/login");
          return;
        }
        setBump(true);
        startTransition(async () => {
          setSaved((s) => !s);
          const res = await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
          if (!res.ok) setSaved((s) => !s); // revert on failure
        });
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors",
        variants[variant],
        variant === "default" && saved && "border-accent bg-accent-soft",
        className
      )}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save"}
    >
      <Heart
        className={cn(
          "h-[18px] w-[18px] transition-transform duration-200",
          saved ? "fill-accent text-accent" : "text-ink",
          bump && "scale-125"
        )}
      />
    </button>
  );
}
