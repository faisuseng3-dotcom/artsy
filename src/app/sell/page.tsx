import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatRelativeTime } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PackagePlus } from "lucide-react";

export const revalidate = 0;

export default async function SellDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/sell");
  if (session.user.role !== "CREATOR") redirect("/become-a-creator");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    include: { stats: true },
  });
  if (!creator) redirect("/become-a-creator");

  const [products, orders] = await Promise.all([
    prisma.product.findMany({
      where: { creatorId: creator.id },
      include: { images: { take: 1, orderBy: { position: "asc" } }, stats: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { creatorId: creator.id },
      include: { buyer: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const revenueCents = orders
    .filter((o) => ["PAID", "SHIPPED", "DELIVERED"].includes(o.status))
    .reduce((sum, o) => sum + o.totalCents - o.platformFeeCents, 0);

  const active = products.filter((p) => p.status === "ACTIVE");
  const sold = products.filter((p) => p.status === "SOLD");
  const totalViews = products.reduce((sum, p) => sum + (p.stats?.viewCount ?? 0), 0);
  const totalSaves = products.reduce((sum, p) => sum + (p.stats?.saveCount ?? 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Your studio</h1>
          <p className="text-sm text-ink-muted">{creator.displayName}</p>
        </div>
        <ButtonLink href="/sell/new" variant="accent" size="lg">
          <PackagePlus className="h-4 w-4" /> New listing
        </ButtonLink>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active listings" value={active.length} />
        <StatCard label="Sold" value={sold.length} />
        <StatCard label="Views" value={totalViews.toLocaleString()} />
        <StatCard label="Saves" value={totalSaves.toLocaleString()} />
        <StatCard label="Revenue (after fees)" value={formatMoney(revenueCents)} />
        <StatCard label="Followers" value={creator.stats?.followerCount ?? 0} />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-xl text-ink">Listings</h2>
        {products.length === 0 ? (
          <EmptyState
            icon={PackagePlus}
            title="Your studio is empty"
            description="Upload your first creation — it takes about three minutes."
            action={<ButtonLink href="/sell/new" variant="accent" size="sm" className="mt-2">Add your first piece</ButtonLink>}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper-raised text-xs uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-4 py-3">Piece</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Saves</th>
                  <th className="px-4 py-3">Listed</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="flex items-center gap-3 px-4 py-3">
                      {p.images[0] && (
                        <Image src={p.images[0].url} alt="" width={40} height={50} className="aspect-[4/5] rounded object-cover" />
                      )}
                      <Link href={`/p/${p.id}`} className="font-medium text-ink hover:text-accent">
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.status === "ACTIVE" ? "success" : p.status === "SOLD" ? "accent" : "neutral"}>
                        {p.status.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{formatMoney(p.priceCents, p.currency)}</td>
                    <td className="px-4 py-3">{p.stats?.viewCount ?? 0}</td>
                    <td className="px-4 py-3">{p.stats?.saveCount ?? 0}</td>
                    <td className="px-4 py-3 text-ink-muted">{formatRelativeTime(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl text-ink">Orders</h2>
        {orders.length === 0 ? (
          <EmptyState title="No orders yet" description="When someone buys your work, it'll show up here." />
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{o.items.map((i) => i.product.title).join(", ")}</p>
                  <p className="text-ink-muted">{o.buyer.name} · {formatRelativeTime(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-ink">{formatMoney(o.totalCents, o.currency)}</span>
                  <Badge tone={o.status === "PAID" ? "success" : "neutral"}>{o.status.toLowerCase().replace("_", " ")}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line bg-paper-raised p-4">
      <p className="font-display text-2xl text-ink">{value}</p>
      <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}
