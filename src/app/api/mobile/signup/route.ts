import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { signMobileToken } from "@/lib/api-auth";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["BUYER", "CREATOR"]).default("BUYER"),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash, role } });

  if (role === "CREATOR") {
    const base = slugify(name);
    let slug = base;
    let n = 1;
    while (await prisma.creator.findUnique({ where: { slug } })) slug = `${base}-${++n}`;
    await prisma.creator.create({ data: { userId: user.id, slug, displayName: name, status: "APPROVED" } });
  }

  const token = signMobileToken({ id: user.id, role: user.role, email: user.email, name: user.name });
  return NextResponse.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
  });
}
