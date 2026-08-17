import Link from "next/link";
import Image from "next/image";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  creator: { displayName: string; slug: string; studioCity: string | null; studioCountry: string | null };
};

function isNew(product: ProductCardData) {
  const anchor = new Date(product.publishedAt ?? product.createdAt);
  return Date.now() - anchor.getTime() < 1000 * 60 * 60 * 24 * 14;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  const location = [product.creator.studioCity, product.creator.studioCountry].filter(Boolean).join(", ");

  return (
    <Link href={`/p/${product.id}`} className="group mb-4 block break-inside-avoid">
      <div className="relative overflow-hidden rounded-2xl bg-ink/5">
        {image ? (
          <Image
            src={image.url}
            alt={product.title}
            width={image.width ?? 600}
            height={image.height ?? 750}
            className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="aspect-[4/5] w-full" />
        )}

        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {product.originality === "ORIGINAL_ONE_OF_ONE" && <Badge tone="accent">One of one</Badge>}
          {product.status === "SOLD" && <Badge tone="neutral">Sold</Badge>}
          {isNew(product) && product.status !== "SOLD" && <Badge tone="success">New</Badge>}
        </div>
      </div>

      <div className="mt-2.5 space-y-0.5">
        <p className="truncate text-[13px] font-medium text-ink">{product.title}</p>
        <p className="truncate text-[13px] text-ink-muted">
          {product.creator.displayName}
          {location && ` · ${location}`}
        </p>
        <p className="text-[13px] font-semibold text-ink">
          {formatMoney(product.priceCents, product.currency)}
        </p>
      </div>
    </Link>
  );
}
