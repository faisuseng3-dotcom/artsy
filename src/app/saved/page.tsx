import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/product/product-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { Heart } from "lucide-react";

export const revalidate = 0;

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/saved");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: { images: { orderBy: { position: "asc" } }, creator: { include: { stats: true } }, stats: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const products = favorites.map((f) => f.product).filter((p) => p.status !== "REMOVED");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <h1 className="mb-6 font-display text-2xl text-ink">Saved</h1>
      {products.length === 0 ? (
        <EmptyState icon={Heart} title="Nothing saved yet" description="Start exploring and save pieces you love." />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
