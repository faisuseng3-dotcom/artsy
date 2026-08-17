import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ShieldCheck } from "lucide-react";

export const revalidate = 0;

export default async function CreatorsPage() {
  const creators = await prisma.creator.findMany({
    where: { status: "APPROVED" },
    include: { stats: true, studioImages: { take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <h1 className="mb-1 font-display text-3xl text-ink">Creators</h1>
      <p className="mb-6 text-sm text-ink-muted">Independent makers on Artsy.</p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {creators.map((creator) => (
          <Link key={creator.id} href={`/creators/${creator.slug}`} className="group">
            <div className="overflow-hidden rounded-2xl bg-ink/5">
              {creator.studioImages[0] ? (
                <Image
                  src={creator.studioImages[0].url}
                  alt=""
                  width={400}
                  height={300}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="aspect-[4/3] w-full" />
              )}
            </div>
            <div className="mt-2 flex items-center gap-1">
              <p className="truncate text-sm font-medium text-ink">{creator.displayName}</p>
              {creator.verified && <ShieldCheck className="h-3.5 w-3.5 text-accent" />}
            </div>
            <p className="text-xs text-ink-muted">{[creator.studioCity, creator.studioCountry].filter(Boolean).join(", ")}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
