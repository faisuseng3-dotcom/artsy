import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatMoney } from "@/lib/utils";
import { originalityLabels, shippingLabels } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Gallery } from "@/components/product/gallery";
import { SaveButton } from "@/components/product/save-button";
import { ReportButton } from "@/components/product/report-button";
import { FollowButton } from "@/components/creator/follow-button";
import { ButtonLink } from "@/components/ui/button";
import { MapPin, Ruler, Weight, Truck, ShieldCheck } from "lucide-react";

export const revalidate = 0;

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product || product.status === "REMOVED") notFound();

  const session = await auth();

  // Fire-and-forget analytics — never block the page render on it.
  void prisma.$transaction([
    prisma.event.create({
      data: { userId: session?.user?.id, type: "product_viewed", productId: product.id, creatorId: product.creatorId, categoryId: product.categoryId },
    }),
    prisma.productStats.upsert({
      where: { productId: product.id },
      update: { viewCount: { increment: 1 } },
      create: { productId: product.id, viewCount: 1 },
    }),
  ]);

  const [isSaved, isFollowing] = session?.user
    ? await Promise.all([
        prisma.favorite.findUnique({ where: { userId_productId: { userId: session.user.id, productId: product.id } } }),
        prisma.follow.findUnique({ where: { userId_creatorId: { userId: session.user.id, creatorId: product.creatorId } } }),
      ])
    : [null, null];

  const location = [product.creator.studioCity, product.creator.studioCountry].filter(Boolean).join(", ");
  const dims = [product.widthCm, product.heightCm, product.depthCm].filter(Boolean).map((n) => `${n} cm`).join(" × ");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
      <div className="grid gap-10 md:grid-cols-2">
        <Gallery images={product.images} title={product.title} />

        <div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <Badge tone="accent">{originalityLabels[product.originality]}</Badge>
            {product.status === "SOLD" && <Badge tone="neutral">Sold</Badge>}
            {product.status === "RESERVED" && <Badge tone="neutral">Reserved</Badge>}
          </div>

          <h1 className="font-display text-3xl text-ink md:text-4xl">{product.title}</h1>

          <Link href={`/creators/${product.creator.slug}`} className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
            <MapPin className="h-3.5 w-3.5" />
            By {product.creator.displayName}
            {location && ` · ${location}`}
          </Link>

          <p className="mt-4 font-display text-2xl text-ink">{formatMoney(product.priceCents, product.currency)}</p>
          {product.editionSize && (
            <p className="text-sm text-ink-muted">Edition of {product.editionSize}{product.editionNumber ? ` · #${product.editionNumber}` : ""}</p>
          )}

          <div className="mt-5 flex gap-2">
            <ButtonLink
              href={product.status === "ACTIVE" ? `/checkout/${product.id}` : "#"}
              variant="accent"
              size="lg"
              className="flex-1"
              aria-disabled={product.status !== "ACTIVE"}
            >
              {product.status === "SOLD" ? "Sold" : product.status === "RESERVED" ? "Reserved" : "Buy now"}
            </ButtonLink>
            <SaveButton productId={product.id} initialSaved={!!isSaved} isSignedIn={!!session?.user} />
          </div>

          <div className="mt-6 space-y-3 border-t border-line pt-6 text-sm text-ink">
            {dims && (
              <div className="flex items-center gap-2 text-ink-muted">
                <Ruler className="h-4 w-4" /> {dims}
              </div>
            )}
            {product.weightGrams && (
              <div className="flex items-center gap-2 text-ink-muted">
                <Weight className="h-4 w-4" /> {(product.weightGrams / 1000).toFixed(1)} kg
              </div>
            )}
            <div className="flex items-center gap-2 text-ink-muted">
              <Truck className="h-4 w-4" />
              {product.shippingMethods.map((m) => shippingLabels[m]).join(" · ")}
              {product.shippingPriceCents ? ` · ${formatMoney(product.shippingPriceCents, product.currency)}` : ""}
            </div>
            <div className="flex items-center gap-2 text-ink-muted">
              <ShieldCheck className="h-4 w-4" /> Buyer protection included
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-6">
            <h2 className="mb-2 text-sm font-semibold text-ink">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">{product.description}</p>
            {product.materials && (
              <p className="mt-3 text-sm text-ink-muted">
                <span className="font-medium text-ink">Materials — </span>
                {product.materials}
              </p>
            )}
            {product.conditionNotes && (
              <p className="mt-1 text-sm text-ink-muted">
                <span className="font-medium text-ink">Condition — </span>
                {product.conditionNotes}
              </p>
            )}
          </div>

          <div className="mt-6">
            <ReportButton productId={product.id} isSignedIn={!!session?.user} />
          </div>
        </div>
      </div>

      <div className="mt-14 rounded-2xl border border-line bg-paper-raised p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink/5 font-display text-xl">
              {product.creator.displayName[0]}
            </div>
            <div>
              <p className="font-display text-lg text-ink">{product.creator.displayName}</p>
              <p className="text-sm text-ink-muted">{location}</p>
              {product.creator.story && (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">{product.creator.story}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <FollowButton creatorId={product.creatorId} initialFollowing={!!isFollowing} isSignedIn={!!session?.user} />
            <ButtonLink href={`/creators/${product.creator.slug}`} size="sm" variant="outline">
              View studio
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
