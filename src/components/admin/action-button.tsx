"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AdminActionButton({
  url,
  body,
  label,
  variant = "outline",
  confirmMessage,
}: {
  url: string;
  body: Record<string, unknown>;
  label: string;
  variant?: "outline" | "accent" | "ghost";
  confirmMessage?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="inline-flex flex-col items-start">
      <Button
        size="sm"
        variant={variant}
        disabled={pending}
        onClick={() => {
          if (confirmMessage && !window.confirm(confirmMessage)) return;
          startTransition(async () => {
            const res = await fetch(url, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              setError(data.error ?? "Failed");
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "…" : label}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
