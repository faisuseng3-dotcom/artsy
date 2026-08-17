import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Package } from "lucide-react";

export const revalidate = 0;

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/orders");

  const orders = await prisma.order.findMany({
    where: { buyerId: session.user.id },
    include: { items: { include: { product: { include: { images: { take: 1 } } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl text-ink">Your orders</h1>
      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" description="When you buy something, it'll show up here." />
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center gap-3 rounded-xl border border-line p-3">
              {o.items[0]?.product.images[0] && (
                <Image src={o.items[0].product.images[0].url} alt="" width={48} height={60} className="rounded object-cover" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{o.items.map((i) => i.product.title).join(", ")}</p>
                <p className="text-xs text-ink-muted">{formatRelativeTime(o.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-ink">{formatMoney(o.totalCents, o.currency)}</p>
                <Badge tone={o.status === "PAID" ? "success" : "neutral"}>{o.status.toLowerCase().replace("_", " ")}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
