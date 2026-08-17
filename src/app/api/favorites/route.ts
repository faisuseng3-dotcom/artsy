import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({ productId: z.string().min(1) });

export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { productId } = parsed.data;

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.favorite.delete({ where: { id: existing.id } }),
      prisma.productStats.updateMany({ where: { productId }, data: { saveCount: { decrement: 1 } } }),
    ]);
    return NextResponse.json({ saved: false });
  }

  await prisma.$transaction([
    prisma.favorite.create({ data: { userId: user.id, productId } }),
    prisma.productStats.upsert({
      where: { productId },
      update: { saveCount: { increment: 1 } },
      create: { productId, saveCount: 1 },
    }),
    prisma.event.create({ data: { userId: user.id, type: "product_saved", productId } }),
  ]);
  return NextResponse.json({ saved: true });
}
