import { getMarketplaceMetrics } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";

export const revalidate = 0;

export default async function AdminOverviewPage() {
  const [metrics, buyerCount, openReports, pendingCreators] = await Promise.all([
    getMarketplaceMetrics(),
    prisma.user.count({ where: { role: "BUYER" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.creator.count({ where: { status: "PENDING" } }),
  ]);

  const takeRateCents = metrics.gmvCents > 0 ? Math.round((metrics.gmvCents * 0.1)) : 0;

  const cards = [
    { label: "GMV", value: formatMoney(metrics.gmvCents) },
    { label: "Orders", value: metrics.orderCount },
    { label: "Est. platform revenue", value: formatMoney(takeRateCents) },
    { label: "Active listings", value: metrics.activeListings },
    { label: "Approved creators", value: metrics.creatorCount },
    { label: "Buyers", value: buyerCount },
    { label: "Open reports", value: openReports },
    { label: "Creators pending approval", value: pendingCreators },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-line bg-paper-raised p-4">
          <p className="font-display text-2xl text-ink">{c.value}</p>
          <p className="text-xs uppercase tracking-wide text-ink-faint">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
