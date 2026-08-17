import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  categorySlug: z.string().min(1),
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(4000),
  materials: z.string().max(300).optional(),
  originality: z.enum([
    "ORIGINAL_ONE_OF_ONE",
    "LIMITED_EDITION",
    "OPEN_EDITION_PRINT",
    "HANDMADE_REPRODUCIBLE",
    "AI_ASSISTED",
  ]),
  editionSize: z.number().int().positive().optional(),
  priceCents: z.number().int().positive().max(100_000_000),
  widthCm: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  depthCm: z.number().positive().optional(),
  weightGrams: z.number().int().positive().optional(),
  condition: z.string().max(80).optional(),
  shippingMethods: z.array(z.enum(["PICKUP_ONLY", "LOCAL_DELIVERY", "STANDARD_SHIPPING", "LARGE_ITEM_SHIPPING"])).min(1),
  shippingPriceCents: z.number().int().min(0).optional(),
  imageUrls: z.array(z.string().min(1)).min(1).max(10),
  aiAssisted: z.boolean().optional(),
  publish: z.boolean().default(true),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CREATOR") {
    return NextResponse.json({ error: "Only creators can publish listings" }, { status: 403 });
  }

  const creator = await prisma.creator.findUnique({ where: { userId: session.user.id } });
  if (!creator || creator.status !== "APPROVED") {
    return NextResponse.json({ error: "Your creator account isn't approved yet" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid listing" }, { status: 400 });
  }
  const data = parsed.data;

  const category = await prisma.category.findUnique({ where: { slug: data.categorySlug } });
  if (!category) return NextResponse.json({ error: "Unknown category" }, { status: 400 });

  const now = new Date();
  const product = await prisma.product.create({
    data: {
      creatorId: creator.id,
      categoryId: category.id,
      title: data.title,
      description: data.description,
      materials: data.materials,
      originality: data.originality,
      editionSize: data.originality === "LIMITED_EDITION" ? data.editionSize : undefined,
      priceCents: data.priceCents,
      widthCm: data.widthCm,
      heightCm: data.heightCm,
      depthCm: data.depthCm,
      weightGrams: data.weightGrams,
      condition: data.condition,
      shippingMethods: data.shippingMethods,
      shippingPriceCents: data.shippingPriceCents,
      status: data.publish ? "ACTIVE" : "DRAFT",
      publishedAt: data.publish ? now : null,
      aiAssisted: data.aiAssisted ?? false,
      images: { create: data.imageUrls.map((url, i) => ({ url, position: i, kind: i === 0 ? "hero" : "gallery" })) },
      stats: { create: {} },
    },
  });

  if (data.publish) {
    await prisma.creatorStats.upsert({
      where: { creatorId: creator.id },
      update: { activeListings: { increment: 1 } },
      create: { creatorId: creator.id, activeListings: 1 },
    });

    // Notify followers — capped batch write, no per-follower fan-out job needed at this scale.
    const followers = await prisma.follow.findMany({ where: { creatorId: creator.id }, select: { userId: true } });
    if (followers.length > 0) {
      await prisma.notification.createMany({
        data: followers.map((f) => ({
          userId: f.userId,
          type: "NEW_WORK_FROM_FOLLOWED_CREATOR" as const,
          title: `${creator.displayName} published new work`,
          body: data.title,
          linkUrl: `/p/${product.id}`,
        })),
      });
    }
  }

  return NextResponse.json({ id: product.id, status: product.status });
}
