import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const bodySchema = z.object({ displayName: z.string().min(1).max(120) });

export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const existing = await prisma.creator.findUnique({ where: { userId: user.id } });
  if (existing) return NextResponse.json({ ok: true });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const base = slugify(parsed.data.displayName);
  let slug = base;
  let n = 1;
  while (await prisma.creator.findUnique({ where: { slug } })) slug = `${base}-${++n}`;

  await prisma.$transaction([
    prisma.creator.create({
      data: { userId: user.id, slug, displayName: parsed.data.displayName, status: "APPROVED" },
    }),
    prisma.user.update({ where: { id: user.id }, data: { role: "CREATOR" } }),
  ]);

  return NextResponse.json({ ok: true });
}
