"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Gallery({
  images,
  title,
}: {
  images: { url: string; width?: number | null; height?: number | null }[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div>
      <div className="overflow-hidden rounded-2xl bg-ink/5">
        {current && (
          <Image
            src={current.url}
            alt={title}
            width={current.width ?? 900}
            height={current.height ?? 1125}
            priority
            className="w-full object-cover"
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={cn(
                "overflow-hidden rounded-lg border-2 transition-colors",
                i === active ? "border-accent" : "border-transparent"
              )}
            >
              <Image src={img.url} alt="" width={120} height={150} className="aspect-[4/5] w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
