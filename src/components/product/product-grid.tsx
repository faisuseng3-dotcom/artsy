import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Compass } from "lucide-react";

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={Compass}
        title="Nothing here yet"
        description="Check back soon — new work is added every day."
      />
    );
  }

  return (
    <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
