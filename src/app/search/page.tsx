import { prisma } from "@/lib/prisma";
import { rankProducts } from "@/lib/discovery";
import { ProductGrid } from "@/components/product/product-grid";
import { getCategories, getSavedProductIds } from "@/lib/queries";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const revalidate = 0;

const productInclude = {
  images: { orderBy: { position: "asc" as const } },
  creator: { include: { stats: true } },
  stats: true,
} as const;

const EXAMPLE_SEARCHES = [
  "Handmade ceramics",
  "Art under €300",
  "Sculptures",
  "Scandinavian furniture",
  "Unique gifts",
  "Abstract paintings",
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; oneOfOne?: string; maxPrice?: string }>;
}) {
  const params = await searchParams;
  const rawQ = params.q?.trim() ?? "";
  const session = await auth();
  const [categories, savedIds] = await Promise.all([getCategories(), getSavedProductIds(session?.user?.id)]);

  // Lightweight natural-language parsing: pull a price ceiling out of phrases
  // like "under €300" so example searches ("Art under €300") actually filter
  // by price instead of literally text-matching the word "under".
  const priceMatch = rawQ.match(/under\s*€?\s*(\d+)/i);
  const parsedMaxPrice = priceMatch ? Number(priceMatch[1]) : undefined;
  const q = rawQ.replace(/\s*under\s*€?\s*\d+/i, "").trim();
  const maxPriceFilter = params.maxPrice ? Number(params.maxPrice) : parsedMaxPrice;

  const hasQuery = !!(rawQ || params.category || params.oneOfOne || maxPriceFilter);

  const products = hasQuery
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
            ...(maxPriceFilter ? { priceCents: { lte: maxPriceFilter * 100 } } : {}),
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
          defaultValue={rawQ}
          placeholder="Find something unexpected…"
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

      {hasQuery ? (
        <>
          <p className="mb-4 text-sm text-ink-muted">{products.length} results</p>
          <ProductGrid products={products} savedIds={savedIds} isSignedIn={!!session?.user} />
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="mb-4 text-sm text-ink-muted">Try searching</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_SEARCHES.map((s) => (
              <Link
                key={s}
                href={`/search?q=${encodeURIComponent(s)}`}
                className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink-muted hover:border-ink/30 hover:text-ink"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
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
