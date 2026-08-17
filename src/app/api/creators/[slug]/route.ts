import { NextResponse } from "next/server";
import { getCreatorBySlug } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const creator = await getCreatorBySlug(slug);
  if (!creator || creator.status !== "APPROVED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getApiUser(req);
  const isFollowing = user
    ? await prisma.follow.findUnique({ where: { userId_creatorId: { userId: user.id, creatorId: creator.id } } })
    : null;

  return NextResponse.json({ creator, isFollowing: !!isFollowing });
}
