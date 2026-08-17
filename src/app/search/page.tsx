import { prisma } from "@/lib/prisma";
import { rankProducts } from "@/lib/discovery";
import { ProductGrid } from "@/components/product/product-grid";
import { getCategories } from "@/lib/queries";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const revalidate = 0;

const productInclude = {
  images: { orderBy: { position: "asc" as const } },
  creator: { include: { stats: true } },
  stats: true,
} as const;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; oneOfOne?: string; maxPrice?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const categories = await getCategories();

  const products = q || params.category || params.oneOfOne || params.maxPrice
    ? rankProducts(
        await prisma.product.findMany({
          where: {
            status: "ACTIVE",
            ...(q
              ? {
                  OR: [
                    { title: { contains: q, mode: "insensitive" } },
                    { description: { contains: q, mode: "insensitive" } },
                    { materials: { contains: q, mode: "insensitive" } },
                    { tags: { has: q.toLowerCase() } },
                    { creator: { displayName: { contains: q, mode: "insensitive" } } },
                    { creator: { studioCity: { contains: q, mode: "insensitive" } } },
                  ],
                }
              : {}),
            ...(params.category ? { category: { slug: params.category } } : {}),
            ...(params.oneOfOne ? { originality: "ORIGINAL_ONE_OF_ONE" } : {}),
            ...(params.maxPrice ? { priceCents: { lte: Number(params.maxPrice) * 100 } } : {}),
          },
          include: productInclude,
          take: 100,
        })
      )
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      <form action="/search" className="mb-5">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Try “wooden chair”, “blue painting”, or a creator's city…"
          className="h-12 w-full rounded-full border border-ink/15 bg-paper-raised px-5 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          autoFocus
        />
      </form>

      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
        <FilterChip href={buildHref(params, { oneOfOne: params.oneOfOne ? undefined : "1" })} active={!!params.oneOfOne}>
          One of one
        </FilterChip>
        <FilterChip href={buildHref(params, { maxPrice: params.maxPrice ? undefined : "300" })} active={!!params.maxPrice}>
          Under €300
        </FilterChip>
        {categories.slice(0, 6).map((c) => (
          <FilterChip
            key={c.slug}
            href={buildHref(params, { category: params.category === c.slug ? undefined : c.slug })}
            active={params.category === c.slug}
          >
            {c.name}
          </FilterChip>
        ))}
      </div>

      {q || params.category || params.oneOfOne || params.maxPrice ? (
        <>
          <p className="mb-4 text-sm text-ink-muted">{products.length} results</p>
          <ProductGrid products={products} />
        </>
      ) : (
        <p className="py-16 text-center text-sm text-ink-muted">
          Search for a material, a color, a city, or a creator&apos;s name.
        </p>
      )}
    </div>
  );
}

function buildHref(current: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const merged = { ...current, ...patch };
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) usp.set(k, v);
  return `/search?${usp.toString()}`;
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm",
        active ? "border-ink bg-ink text-paper" : "border-ink/15 text-ink-muted hover:border-ink/30"
      )}
    >
      {children}
    </Link>
  );
}
