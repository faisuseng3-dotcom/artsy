import { getCategories, getFeedProducts } from "@/lib/queries";
import { CategoryRail } from "@/components/category-rail";
import { ProductGrid } from "@/components/product/product-grid";
import Link from "next/link";

export const revalidate = 0;

export default async function HomePage() {
  const [categories, products] = await Promise.all([getCategories(), getFeedProducts(60)]);

  const oneOfOne = products.filter((p) => p.originality === "ORIGINAL_ONE_OF_ONE").slice(0, 8);
  const stockholm = products.filter((p) => p.creator.studioCity === "Stockholm").slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      <div className="mb-6">
        <CategoryRail categories={categories} />
      </div>

      <section className="mb-10">
        <ProductGrid products={products} />
      </section>

      {oneOfOne.length > 0 && (
        <EditorialSection
          title="One-of-one"
          subtitle="Every piece here exists exactly once."
          products={oneOfOne}
          href="/c/painting"
        />
      )}

      {stockholm.length > 0 && (
        <EditorialSection
          title="Made in Stockholm"
          subtitle="Work from creators based in one city."
          products={stockholm}
        />
      )}
    </div>
  );
}

function EditorialSection({
  title,
  subtitle,
  products,
  href,
}: {
  title: string;
  subtitle: string;
  products: Awaited<ReturnType<typeof getFeedProducts>>;
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
      <ProductGrid products={products} />
    </section>
  );
}
