import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  status: z.enum(["IN_REVIEW", "ACTIONED", "DISMISSED"]),
  resolutionNote: z.string().max(1000).optional(),
  removeListing: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.report.update({
    where: { id },
    data: {
      status: parsed.data.status,
      resolutionNote: parsed.data.resolutionNote,
      resolvedAt: parsed.data.status === "DISMISSED" || parsed.data.status === "ACTIONED" ? new Date() : undefined,
    },
  });

  if (parsed.data.removeListing && report.productId) {
    await prisma.product.update({ where: { id: report.productId }, data: { status: "REMOVED" } });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "report.updated",
      targetType: "Report",
      targetId: id,
      metadata: { status: parsed.data.status, removeListing: parsed.data.removeListing ?? false },
    },
  });

  return NextResponse.json({ ok: true });
}
