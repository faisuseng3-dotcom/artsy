import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProduct, getRelatedProducts, getMoreFromCreator, getSavedProductIds } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatMoney } from "@/lib/utils";
import { originalityLabels, shippingLabels } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Gallery } from "@/components/product/gallery";
import { SaveButton } from "@/components/product/save-button";
import { ReportButton } from "@/components/product/report-button";
import { FollowButton } from "@/components/creator/follow-button";
import { CreatorAvatar } from "@/components/creator/creator-avatar";
import { ProductGrid } from "@/components/product/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { StickyPurchaseBar, StickyPurchaseBarSentinel } from "@/components/product/sticky-purchase-bar";
import { Truck, ShieldCheck, PackageCheck } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return {};
  const title = `${product.title} — ${originalityLabels[product.originality]} by ${product.creator.displayName} | Artsy`;
  const description = product.description.slice(0, 155);
  return {
    title,
    description,
    openGraph: { title, description, images: product.images[0] ? [product.images[0].url] : undefined },
  };
}

const METHOD_LABELS: Record<string, string> = {
  ORIGINAL_ONE_OF_ONE: "Handmade, original",
  LIMITED_EDITION: "Handmade, limited edition",
  OPEN_EDITION_PRINT: "Print",
  HANDMADE_REPRODUCIBLE: "Handmade",
  AI_ASSISTED: "AI-assisted",
};

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

  const [isSaved, isFollowing, related, moreFromCreator, savedIds] = await Promise.all([
    session?.user
      ? prisma.favorite.findUnique({ where: { userId_productId: { userId: session.user.id, productId: product.id } } })
      : null,
    session?.user
      ? prisma.follow.findUnique({ where: { userId_creatorId: { userId: session.user.id, creatorId: product.creatorId } } })
      : null,
    getRelatedProducts(product),
    getMoreFromCreator(product),
    getSavedProductIds(session?.user?.id),
  ]);

  const location = [product.creator.studioCity, product.creator.studioCountry].filter(Boolean).join(", ");
  const dims = [product.widthCm, product.heightCm, product.depthCm].filter(Boolean).map((n) => `${n} cm`).join(" × ");
  const oneOfOne = product.originality === "ORIGINAL_ONE_OF_ONE";
  const remaining = product.quantityAvailable - product.quantitySold;
  const hasPickup = product.shippingMethods.includes("PICKUP_ONLY");
  const shippableMethod = product.shippingMethods.find((m) => m !== "PICKUP_ONLY");
  const isActive = product.status === "ACTIVE";
  const buyLabel = product.status === "SOLD" ? "Sold" : product.status === "RESERVED" ? "Reserved" : "Buy artwork";
  const processImages = product.images.filter((img) => img.kind === "process");
  const shortStory = product.creator.story && product.creator.story.length > 260 ? `${product.creator.story.slice(0, 260)}…` : product.creator.story;

  const aboutRows: { label: string; value: string }[] = [];
  if (product.materials) aboutRows.push({ label: "Material", value: product.materials });
  if (dims) aboutRows.push({ label: "Dimensions", value: dims });
  if (product.weightGrams) aboutRows.push({ label: "Weight", value: `${(product.weightGrams / 1000).toFixed(1)} kg` });
  if (product.createdAtStudio) aboutRows.push({ label: "Created", value: new Date(product.createdAtStudio).getFullYear().toString() });
  aboutRows.push({ label: "Method", value: METHOD_LABELS[product.originality] });
  if (location) aboutRows.push({ label: "Location", value: location });
  if (product.condition) aboutRows.push({ label: "Condition", value: product.condition });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
      <div className="grid gap-10 md:grid-cols-2">
        <Gallery images={product.images.filter((i) => i.kind !== "process")} title={product.title} />

        <div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <Badge tone="accent">{originalityLabels[product.originality]}</Badge>
            {product.status === "SOLD" && <Badge tone="neutral">Sold</Badge>}
            {product.status === "RESERVED" && <Badge tone="neutral">Reserved</Badge>}
          </div>

          <h1 className="font-display text-3xl text-ink md:text-4xl">{product.title}</h1>

          <Link href={`/creators/${product.creator.slug}`} className="mt-2.5 inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
            <CreatorAvatar name={product.creator.displayName} size="xs" />
            By {product.creator.displayName}
            {location && ` · ${location}`}
          </Link>

          <p className="mt-4 font-display text-2xl text-ink">{formatMoney(product.priceCents, product.currency)}</p>
          {product.editionSize && (
            <p className="text-sm text-ink-muted">Edition of {product.editionSize}{product.editionNumber ? ` · #${product.editionNumber}` : ""}</p>
          )}
          {isActive && (
            <p className="mt-1 text-sm text-ink-muted">
              {oneOfOne
                ? "Only 1 available — original piece"
                : remaining > 0
                  ? `${remaining} of ${product.quantityAvailable} available`
                  : null}
            </p>
          )}

          <StickyPurchaseBarSentinel>
            <div className="mt-5 flex gap-2">
              <ButtonLink
                href={isActive ? `/checkout/${product.id}` : "#"}
                variant="accent"
                size="lg"
                className="flex-1 justify-center"
                aria-disabled={!isActive}
              >
                {buyLabel}
              </ButtonLink>
              <SaveButton productId={product.id} initialSaved={!!isSaved} isSignedIn={!!session?.user} />
            </div>
          </StickyPurchaseBarSentinel>

          <div className="mt-6 space-y-2.5 border-t border-line pt-6 text-sm">
            {location && (
              <div className="flex items-center gap-2 text-ink-muted">
                <Truck className="h-4 w-4 shrink-0" /> Ships from {product.creator.studioCity ?? location}
              </div>
            )}
            {shippableMethod && (
              <div className="flex items-center gap-2 pl-6 text-ink-muted">
                {shippingLabels[shippableMethod]}
                {product.shippingPriceCents ? ` — ${formatMoney(product.shippingPriceCents, product.currency)}` : " — free"}
              </div>
            )}
            {hasPickup && (
              <div className="flex items-center gap-2 pl-6 text-ink-muted">
                <PackageCheck className="h-3.5 w-3.5 shrink-0" /> Local pickup available
              </div>
            )}
            {product.creator.verified && (
              <div className="flex items-center gap-2 text-ink-muted">
                <ShieldCheck className="h-4 w-4 shrink-0" /> Creator verified
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-line pt-6">
            <h2 className="mb-2 text-sm font-semibold text-ink">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">{product.description}</p>
          </div>

          {aboutRows.length > 0 && (
            <div className="mt-6 border-t border-line pt-6">
              <h2 className="mb-3 text-sm font-semibold text-ink">About this piece</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                {aboutRows.map((row) => (
                  <div key={row.label}>
                    <dt className="text-ink-faint">{row.label}</dt>
                    <dd className="text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="mt-6">
            <ReportButton productId={product.id} isSignedIn={!!session?.user} />
          </div>
        </div>
      </div>

      {processImages.length > 0 && (
        <div className="mt-14 border-t border-line pt-8">
          <h2 className="mb-4 font-display text-xl text-ink">The process</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {processImages.map((img) => (
              <Image key={img.id} src={img.url} alt="" width={300} height={375} className="aspect-[4/5] w-full rounded-xl object-cover" />
            ))}
          </div>
        </div>
      )}

      <div className="mt-14 rounded-2xl border border-line bg-paper-raised p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-faint">Meet the creator</h2>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <CreatorAvatar name={product.creator.displayName} size="lg" />
            <div>
              <p className="font-display text-lg text-ink">{product.creator.displayName}</p>
              <p className="text-sm text-ink-muted">{location}</p>
              {product.creator.bio && <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">{product.creator.bio}</p>}
              {shortStory && <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">{shortStory}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <FollowButton creatorId={product.creatorId} initialFollowing={!!isFollowing} isSignedIn={!!session?.user} />
            <ButtonLink href={`/creators/${product.creator.slug}`} size="sm" variant="outline">
              View profile
            </ButtonLink>
          </div>
        </div>
      </div>

      {moreFromCreator.length > 0 && (
        <div className="mt-14 border-t border-line pt-8">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-xl text-ink">More from {product.creator.displayName}</h2>
            <Link href={`/creators/${product.creator.slug}`} className="text-sm font-medium text-accent">
              View creator
            </Link>
          </div>
          <ProductGrid products={moreFromCreator} savedIds={savedIds} isSignedIn={!!session?.user} />
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-14 border-t border-line pt-8">
          <h2 className="mb-4 font-display text-xl text-ink">You might also like</h2>
          <ProductGrid products={related} savedIds={savedIds} isSignedIn={!!session?.user} />
        </div>
      )}

      <StickyPurchaseBar priceCents={product.priceCents} currency={product.currency} href={`/checkout/${product.id}`} label={buyLabel} disabled={!isActive} />
    </div>
  );
}
