import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { suggestPriceRange } from "@/lib/ai";

const bodySchema = z.object({ categorySlug: z.string().min(1) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const comparables = await prisma.product.findMany({
    where: { category: { slug: parsed.data.categorySlug }, status: { in: ["ACTIVE", "SOLD"] } },
    select: { priceCents: true },
    take: 200,
  });

  const suggestion = suggestPriceRange(comparables.map((c) => c.priceCents));
  return NextResponse.json(suggestion);
}
