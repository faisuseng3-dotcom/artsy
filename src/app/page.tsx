import { getCategories, getFeedProducts, getSavedProductIds } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CategoryRail } from "@/components/category-rail";
import { ProductGrid } from "@/components/product/product-grid";
import { CreatorCard } from "@/components/creator/creator-card";
import { Hero } from "@/components/hero";
import Link from "next/link";

export const revalidate = 0;

export default async function HomePage() {
  const session = await auth();
  const [categories, products, savedIds, newCreators] = await Promise.all([
    getCategories(),
    getFeedProducts(60),
    getSavedProductIds(session?.user?.id),
    prisma.creator.findMany({
      where: { status: "APPROVED" },
      include: { studioImages: { take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const isSignedIn = !!session?.user;
  const justDropped = [...products]
    .sort((a, b) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime())
    .slice(0, 8);
  const oneOfOne = products.filter((p) => p.originality === "ORIGINAL_ONE_OF_ONE").slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      <Hero />

      <div className="mb-6">
        <CategoryRail categories={categories} />
      </div>

      {newCreators.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 font-display text-xl text-ink">Artists to discover</h2>
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {newCreators.map((c) => (
              <CreatorCard key={c.id} creator={c} />
            ))}
          </div>
        </section>
      )}

      {justDropped.length > 0 && (
        <EditorialSection title="Just dropped" subtitle="The newest work on Artsy." products={justDropped} savedIds={savedIds} isSignedIn={isSignedIn} />
      )}

      {oneOfOne.length > 0 && (
        <EditorialSection
          title="One of one"
          subtitle="Every piece here exists exactly once."
          products={oneOfOne}
          savedIds={savedIds}
          isSignedIn={isSignedIn}
        />
      )}

      <section id="feed" className="mb-10 scroll-mt-20 border-t border-line pt-8">
        <h2 className="mb-4 font-display text-xl text-ink">For you</h2>
        <ProductGrid products={products} savedIds={savedIds} isSignedIn={isSignedIn} />
      </section>
    </div>
  );
}

function EditorialSection({
  title,
  subtitle,
  products,
  savedIds,
  isSignedIn,
  href,
}: {
  title: string;
  subtitle: string;
  products: Awaited<ReturnType<typeof getFeedProducts>>;
  savedIds: Set<string>;
  isSignedIn: boolean;
  href?: string;
}) {
  return (
    <section className="mb-10 border-t border-line pt-8">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl text-ink">{title}</h2>
          <p className="text-sm text-ink-muted">{subtitle}</p>
        </div>
        {href && (
          <Link href={href} className="text-sm font-medium text-accent">
            See all
          </Link>
        )}
      </div>
      <ProductGrid products={products} savedIds={savedIds} isSignedIn={isSignedIn} />
    </section>
  );
}
