import { notFound } from "next/navigation";
import Image from "next/image";
import { getCreatorBySlug, getSavedProductIds } from "@/lib/queries";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FollowButton } from "@/components/creator/follow-button";
import { ProductGrid } from "@/components/product/product-grid";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, MapPin } from "lucide-react";

export const revalidate = 0;

export default async function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const creator = await getCreatorBySlug(slug);
  if (!creator || creator.status !== "APPROVED") notFound();

  const session = await auth();
  const [isFollowing, savedIds] = await Promise.all([
    session?.user
      ? prisma.follow.findUnique({ where: { userId_creatorId: { userId: session.user.id, creatorId: creator.id } } })
      : null,
    getSavedProductIds(session?.user?.id),
  ]);

  const active = creator.products.filter((p) => p.status === "ACTIVE");
  const sold = creator.products.filter((p) => p.status === "SOLD");
  const location = [creator.studioCity, creator.studioCountry].filter(Boolean).join(", ");

  return (
    <div>
      <div className="border-b border-line bg-paper-raised">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex gap-5">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-ink/5 font-display text-3xl">
                {creator.displayName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-3xl text-ink">{creator.displayName}</h1>
                  {creator.verified && <ShieldCheck className="h-5 w-5 text-accent" />}
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                  <MapPin className="h-3.5 w-3.5" /> {location}
                </p>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">{creator.bio}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {creator.categories.map((c) => (
                    <Badge key={c}>{c}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <FollowButton creatorId={creator.id} initialFollowing={!!isFollowing} isSignedIn={!!session?.user} />
          </div>

          <div className="mt-8 flex gap-8 text-sm">
            <Stat label="Followers" value={creator.stats?.followerCount ?? 0} />
            <Stat label="Sales" value={creator.stats?.salesCount ?? sold.length} />
            <Stat label="Active works" value={active.length} />
            {creator.responseRateBp && <Stat label="Response rate" value={`${Math.round(creator.responseRateBp / 100)}%`} />}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        {creator.story && (
          <div className="mb-10">
            <h2 className="mb-2 font-display text-xl text-ink">Story</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">{creator.story}</p>
          </div>
        )}

        {creator.studioImages.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-3 font-display text-xl text-ink">Studio</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {creator.studioImages.map((img) => (
                <div key={img.id} className="overflow-hidden rounded-xl bg-ink/5">
                  <Image src={img.url} alt={img.caption ?? ""} width={400} height={300} className="aspect-[4/3] w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-10">
          <h2 className="mb-3 font-display text-xl text-ink">Works ({active.length})</h2>
          <ProductGrid products={active} savedIds={savedIds} isSignedIn={!!session?.user} />
        </div>

        {sold.length > 0 && (
          <div>
            <h2 className="mb-3 font-display text-xl text-ink">Sold</h2>
            <ProductGrid products={sold} savedIds={savedIds} isSignedIn={!!session?.user} />
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-display text-xl text-ink">{value}</p>
      <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}
