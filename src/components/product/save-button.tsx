"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function SaveButton({
  productId,
  initialSaved,
  isSignedIn,
  className,
}: {
  productId: string;
  initialSaved: boolean;
  isSignedIn: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!isSignedIn) {
          router.push("/login");
          return;
        }
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
        "inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 transition-colors hover:border-ink/30",
        saved && "border-accent bg-accent-soft",
        className
      )}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save"}
    >
      <Heart className={cn("h-5 w-5", saved ? "fill-accent text-accent" : "text-ink")} />
    </button>
  );
}
