import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (id === session.user.id) return NextResponse.json({ error: "Can't change your own status" }, { status: 400 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  await prisma.user.update({ where: { id }, data: { status: parsed.data.status } });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "user.status_changed", targetType: "User", targetId: id, metadata: { status: parsed.data.status } },
  });

  return NextResponse.json({ ok: true });
}
