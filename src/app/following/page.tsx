import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";

export const revalidate = 0;

export default async function FollowingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/following");

  const follows = await prisma.follow.findMany({
    where: { userId: session.user.id },
    include: { creator: { include: { studioImages: { take: 1 } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl text-ink">Following</h1>
      {follows.length === 0 ? (
        <EmptyState icon={Users} title="Not following anyone yet" description="Follow creators to see their new work first." />
      ) : (
        <div className="space-y-2">
          {follows.map((f) => (
            <Link key={f.id} href={`/creators/${f.creator.slug}`} className="flex items-center gap-3 rounded-xl border border-line p-3">
              {f.creator.studioImages[0] ? (
                <Image src={f.creator.studioImages[0].url} alt="" width={48} height={48} className="rounded-full object-cover" />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-full bg-ink/5 font-display">{f.creator.displayName[0]}</div>
              )}
              <div>
                <p className="text-sm font-medium text-ink">{f.creator.displayName}</p>
                <p className="text-xs text-ink-muted">{[f.creator.studioCity, f.creator.studioCountry].filter(Boolean).join(", ")}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
