import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  productId: z.string().min(1),
  reason: z.enum([
    "COUNTERFEIT",
    "SCAM",
    "INAPPROPRIATE_CONTENT",
    "STOLEN_ARTWORK",
    "MISLEADING_DESCRIPTION",
    "PROHIBITED_ITEM",
    "HARASSMENT",
    "COPYRIGHT_VIOLATION",
    "OTHER",
  ]),
  details: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  await prisma.report.create({
    data: { reporterId: user.id, productId: parsed.data.productId, reason: parsed.data.reason, details: parsed.data.details },
  });

  return NextResponse.json({ ok: true });
}
