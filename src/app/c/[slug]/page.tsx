import { getCategories, getProductsByCategory, getSavedProductIds } from "@/lib/queries";
import { auth } from "@/lib/auth";
import { CategoryRail } from "@/components/category-rail";
import { ProductGrid } from "@/components/product/product-grid";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const session = await auth();
  const [categories, products, savedIds] = await Promise.all([
    getCategories(),
    getProductsByCategory(slug, 60),
    getSavedProductIds(session?.user?.id),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      <div className="mb-6">
        <CategoryRail categories={categories} />
      </div>
      <h1 className="mb-1 font-display text-3xl text-ink">{category.name}</h1>
      <p className="mb-6 text-sm text-ink-muted">{products.length} pieces available</p>
      <ProductGrid products={products} savedIds={savedIds} isSignedIn={!!session?.user} />
    </div>
  );
}
