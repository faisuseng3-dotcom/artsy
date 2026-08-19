import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CreatorAvatar } from "@/components/creator/creator-avatar";
import { SaveButton } from "@/components/product/save-button";

export type ProductCardData = {
  id: string;
  title: string;
  priceCents: number;
  currency: string;
  originality: string;
  status: string;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  images: { url: string; width?: number | null; height?: number | null }[];
  creator: { displayName: string; slug: string; avatarUrl?: string | null; studioCity: string | null; studioCountry: string | null };
};

function isNew(product: ProductCardData) {
  const anchor = new Date(product.publishedAt ?? product.createdAt);
  return Date.now() - anchor.getTime() < 1000 * 60 * 60 * 24 * 14;
}

export function ProductCard({
  product,
  isSaved = false,
  isSignedIn = false,
}: {
  product: ProductCardData;
  isSaved?: boolean;
  isSignedIn?: boolean;
}) {
  const image = product.images[0];
  const location = [product.creator.studioCity, product.creator.studioCountry].filter(Boolean).join(", ");
  const oneOfOne = product.originality === "ORIGINAL_ONE_OF_ONE";

  return (
    <Link href={`/p/${product.id}`} className="group mb-4 block break-inside-avoid">
      <div className="relative overflow-hidden rounded-2xl bg-ink/5">
        {image ? (
          <Image
            src={image.url}
            alt={product.title}
            width={image.width ?? 600}
            height={image.height ?? 750}
            className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="aspect-[4/5] w-full" />
        )}

        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {/* One of one is the strongest signal on the card — everything else is secondary, so only one other badge ever shows alongside it. */}
          {oneOfOne && <Badge tone="onImage">One of one</Badge>}
          {product.status === "SOLD" && <Badge tone="onImageSubtle">Sold</Badge>}
          {!oneOfOne && product.status !== "SOLD" && isNew(product) && <Badge tone="onImage">New</Badge>}
        </div>

        <SaveButton
          productId={product.id}
          initialSaved={isSaved}
          isSignedIn={isSignedIn}
          variant="overlay"
          className="absolute right-2.5 top-2.5"
        />
      </div>

      <div className="mt-2.5 space-y-1">
        <p className="truncate text-[13px] font-medium text-ink">{product.title}</p>
        <div className="flex items-center gap-1.5">
          <CreatorAvatar name={product.creator.displayName} imageUrl={product.creator.avatarUrl} size="xs" />
          <p className="truncate text-[12px] text-ink-muted">
            {product.creator.displayName}
            {location && <span className="text-ink-faint"> · {location}</span>}
          </p>
        </div>
        <p className="text-[13px] font-semibold text-ink">
          {formatMoney(product.priceCents, product.currency)}
        </p>
      </div>
    </Link>
  );
}
