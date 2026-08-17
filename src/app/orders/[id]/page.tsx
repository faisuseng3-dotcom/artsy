import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export const revalidate = 0;

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { id } = await params;
  const { success } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/orders/${id}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: { include: { images: { take: 1 } } } } }, creator: true },
  });
  if (!order || order.buyerId !== session.user.id) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {success && order.status !== "PENDING_PAYMENT" && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" /> Payment received — thank you.
        </div>
      )}
      {success && order.status === "PENDING_PAYMENT" && (
        <div className="mb-6 rounded-xl bg-ink/5 px-4 py-3 text-sm text-ink-muted">
          Waiting for payment confirmation from Stripe — this updates automatically within a few seconds.
        </div>
      )}

      <h1 className="mb-1 font-display text-2xl text-ink">Order</h1>
      <p className="mb-6 text-sm text-ink-muted">Placed {formatRelativeTime(order.createdAt)}</p>

      <div className="mb-6 space-y-3">
        {order.items.map((item) => (
          <Link key={item.id} href={`/p/${item.productId}`} className="flex items-center gap-3 rounded-xl border border-line p-3">
            {item.product.images[0] && (
              <Image src={item.product.images[0].url} alt="" width={56} height={70} className="rounded object-cover" />
            )}
            <div className="flex-1">
              <p className="font-medium text-ink">{item.product.title}</p>
              <p className="text-sm text-ink-muted">{formatMoney(item.unitPriceCents, order.currency)}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="space-y-1 rounded-xl border border-line p-4 text-sm">
        <div className="flex justify-between text-ink-muted">
          <span>Subtotal</span>
          <span>{formatMoney(order.subtotalCents, order.currency)}</span>
        </div>
        <div className="flex justify-between text-ink-muted">
          <span>Shipping</span>
          <span>{formatMoney(order.shippingCents, order.currency)}</span>
        </div>
        <div className="flex justify-between border-t border-line pt-1 font-medium text-ink">
          <span>Total</span>
          <span>{formatMoney(order.totalCents, order.currency)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-ink-muted">Status</span>
        <Badge tone={order.status === "PAID" ? "success" : "neutral"}>{order.status.toLowerCase().replace("_", " ")}</Badge>
      </div>
    </div>
  );
}
