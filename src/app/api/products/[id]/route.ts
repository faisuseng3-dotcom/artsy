import { NextResponse } from "next/server";
import { getProduct } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product || product.status === "REMOVED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getApiUser(req);

  void prisma.$transaction([
    prisma.event.create({
      data: { userId: user?.id, type: "product_viewed", productId: product.id, creatorId: product.creatorId, categoryId: product.categoryId },
    }),
    prisma.productStats.upsert({
      where: { productId: product.id },
      update: { viewCount: { increment: 1 } },
      create: { productId: product.id, viewCount: 1 },
    }),
  ]);

  const [isSaved, isFollowing] = user
    ? await Promise.all([
        prisma.favorite.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } }),
        prisma.follow.findUnique({ where: { userId_creatorId: { userId: user.id, creatorId: product.creatorId } } }),
      ])
    : [null, null];

  return NextResponse.json({ product, isSaved: !!isSaved, isFollowing: !!isFollowing });
}
