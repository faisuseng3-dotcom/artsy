"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

const REASONS = [
  { value: "MISLEADING_DESCRIPTION", label: "Misleading description" },
  { value: "COUNTERFEIT", label: "Counterfeit" },
  { value: "STOLEN_ARTWORK", label: "Stolen artwork" },
  { value: "PROHIBITED_ITEM", label: "Prohibited item" },
  { value: "SCAM", label: "Scam" },
  { value: "OTHER", label: "Other" },
] as const;

export function ReportButton({ productId, isSignedIn }: { productId: string; isSignedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  if (!isSignedIn) return null;

  if (submitted) {
    return <p className="text-xs text-ink-muted">Thanks — we&apos;ll review this listing.</p>;
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-ink-faint hover:text-ink">
        <Flag className="h-3 w-3" /> Report this listing
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-line p-3">
      <p className="mb-2 text-xs font-medium text-ink">Why are you reporting this?</p>
      <div className="flex flex-wrap gap-1.5">
        {REASONS.map((r) => (
          <Button
            key={r.value}
            size="sm"
            variant="outline"
            onClick={async () => {
              await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, reason: r.value }),
              });
              setSubmitted(true);
              router.refresh();
            }}
          >
            {r.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
