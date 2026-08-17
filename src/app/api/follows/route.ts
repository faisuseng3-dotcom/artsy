import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({ creatorId: z.string().min(1) });

export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { creatorId } = parsed.data;

  const existing = await prisma.follow.findUnique({
    where: { userId_creatorId: { userId: user.id, creatorId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.follow.delete({ where: { id: existing.id } }),
      prisma.creatorStats.updateMany({ where: { creatorId }, data: { followerCount: { decrement: 1 } } }),
    ]);
    return NextResponse.json({ following: false });
  }

  await prisma.$transaction([
    prisma.follow.create({ data: { userId: user.id, creatorId } }),
    prisma.creatorStats.upsert({
      where: { creatorId },
      update: { followerCount: { increment: 1 } },
      create: { creatorId, followerCount: 1 },
    }),
  ]);
  return NextResponse.json({ following: true });
}
