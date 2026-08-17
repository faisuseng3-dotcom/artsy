import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { AdminActionButton } from "@/components/admin/action-button";
import Link from "next/link";

export const revalidate = 0;

export default async function AdminCreatorsPage() {
  const creators = await prisma.creator.findMany({
    include: { stats: true, user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-paper-raised text-xs uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-4 py-3">Creator</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Listings</th>
            <th className="px-4 py-3">Sales</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {creators.map((c) => (
            <tr key={c.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3">
                <Link href={`/creators/${c.slug}`} className="font-medium text-ink hover:text-accent">
                  {c.displayName}
                </Link>
                <p className="text-xs text-ink-muted">{c.user.email}</p>
              </td>
              <td className="px-4 py-3">
                <Badge tone={c.status === "APPROVED" ? "success" : c.status === "SUSPENDED" ? "neutral" : "accent"}>
                  {c.status.toLowerCase()}
                </Badge>
              </td>
              <td className="px-4 py-3">{c.stats?.activeListings ?? 0}</td>
              <td className="px-4 py-3">{c.stats?.salesCount ?? 0}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {c.status !== "APPROVED" && (
                    <AdminActionButton url={`/api/admin/creators/${c.id}`} body={{ status: "APPROVED" }} label="Approve" variant="accent" />
                  )}
                  {c.status !== "SUSPENDED" && (
                    <AdminActionButton
                      url={`/api/admin/creators/${c.id}`}
                      body={{ status: "SUSPENDED" }}
                      label="Suspend"
                      confirmMessage="Suspend this creator? Their listings stay live but they can't publish new ones."
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
