import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["BUYER", "CREATOR"]).default("BUYER"),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }
  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
  });

  if (role === "CREATOR") {
    const base = slugify(name);
    let slug = base;
    let n = 1;
    while (await prisma.creator.findUnique({ where: { slug } })) {
      slug = `${base}-${++n}`;
    }
    // MVP: auto-approve so a new creator can list within minutes of signing
    // up (spec priority #4 — frictionless onboarding). Trust/quality is
    // enforced after the fact via moderation, not as a signup gate — see
    // admin's creator-suspend flow.
    await prisma.creator.create({
      data: { userId: user.id, slug, displayName: name, status: "APPROVED" },
    });
  }

  return NextResponse.json({ ok: true });
}
