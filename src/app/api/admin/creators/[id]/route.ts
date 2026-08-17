import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ status: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  await prisma.creator.update({ where: { id }, data: { status: parsed.data.status } });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "creator.status_changed", targetType: "Creator", targetId: id, metadata: { status: parsed.data.status } },
  });

  return NextResponse.json({ ok: true });
}
