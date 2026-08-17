import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const bodySchema = z.object({ displayName: z.string().min(1).max(120) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const existing = await prisma.creator.findUnique({ where: { userId: session.user.id } });
  if (existing) return NextResponse.json({ ok: true });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const base = slugify(parsed.data.displayName);
  let slug = base;
  let n = 1;
  while (await prisma.creator.findUnique({ where: { slug } })) slug = `${base}-${++n}`;

  await prisma.$transaction([
    prisma.creator.create({
      data: { userId: session.user.id, slug, displayName: parsed.data.displayName, status: "APPROVED" },
    }),
    prisma.user.update({ where: { id: session.user.id }, data: { role: "CREATOR" } }),
  ]);

  return NextResponse.json({ ok: true });
}
