"use client";

import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

export function StickyPurchaseBarSentinel({ children }: { children: React.ReactNode }) {
  return <div data-purchase-sentinel>{children}</div>;
}

export function StickyPurchaseBar({
  priceCents,
  currency,
  href,
  label,
  disabled,
}: {
  priceCents: number;
  currency: string;
  href: string;
  label: string;
  disabled: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = document.querySelector("[data-purchase-sentinel]");
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`fixed inset-x-0 bottom-16 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur transition-transform duration-200 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-lg text-ink">{formatMoney(priceCents, currency)}</p>
        <ButtonLink href={href} variant="accent" size="md" className="flex-1 justify-center" aria-disabled={disabled}>
          {label}
        </ButtonLink>
      </div>
    </div>
  );
}
