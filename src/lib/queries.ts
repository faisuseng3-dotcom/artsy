import { prisma } from "@/lib/prisma";
import { rankProducts } from "@/lib/discovery";

const productInclude = {
  images: { orderBy: { position: "asc" as const } },
  creator: { include: { stats: true } },
  stats: true,
} as const;

export async function getFeedProducts(limit = 40) {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: productInclude,
    take: 200,
  });
  return rankProducts(products).slice(0, limit);
}

export async function getProductsByCategory(categorySlug: string, limit = 40) {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", category: { slug: categorySlug } },
    include: productInclude,
    take: 200,
  });
  return rankProducts(products).slice(0, limit);
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      creator: { include: { stats: true } },
      category: true,
    },
  });
}

export async function getRelatedProducts(product: { id: string; categoryId: string; creatorId: string }, limit = 8) {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", categoryId: product.categoryId, id: { not: product.id }, creatorId: { not: product.creatorId } },
    include: productInclude,
    take: 40,
  });
  return rankProducts(products).slice(0, limit);
}

export async function getMoreFromCreator(product: { id: string; creatorId: string }, limit = 8) {
  return prisma.product.findMany({
    where: { status: "ACTIVE", creatorId: product.creatorId, id: { not: product.id } },
    include: productInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getCreatorBySlug(slug: string) {
  return prisma.creator.findUnique({
    where: { slug },
    include: {
      stats: true,
      studioImages: { orderBy: { createdAt: "asc" } },
      products: {
        where: { status: { in: ["ACTIVE", "SOLD"] } },
        include: { images: { orderBy: { position: "asc" } }, stats: true, creator: { include: { stats: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getSavedProductIds(userId: string | undefined) {
  if (!userId) return new Set<string>();
  const favorites = await prisma.favorite.findMany({ where: { userId }, select: { productId: true } });
  return new Set(favorites.map((f) => f.productId));
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getMarketplaceMetrics() {
  const [creatorCount, activeListings, gmvAgg, orderCount] = await Promise.all([
    prisma.creator.count({ where: { status: "APPROVED" } }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.order.aggregate({ _sum: { totalCents: true }, where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } } }),
    prisma.order.count({ where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } } }),
  ]);
  return {
    creatorCount,
    activeListings,
    gmvCents: gmvAgg._sum.totalCents ?? 0,
    orderCount,
  };
}
