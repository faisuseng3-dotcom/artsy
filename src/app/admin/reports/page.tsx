import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminActionButton } from "@/components/admin/action-button";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    include: { reporter: true, product: { include: { creator: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  if (reports.length === 0) {
    return <EmptyState icon={ShieldAlert} title="No reports" description="Reported listings and users will appear here." />;
  }

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div key={r.id} className="rounded-xl border border-line p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Badge tone={r.status === "OPEN" ? "accent" : "neutral"}>{r.status.toLowerCase().replace("_", " ")}</Badge>
                <span className="text-xs text-ink-faint">{r.reason.toLowerCase().replace(/_/g, " ")}</span>
              </div>
              {r.product ? (
                <Link href={`/p/${r.product.id}`} className="font-medium text-ink hover:text-accent">
                  {r.product.title}
                </Link>
              ) : (
                <p className="font-medium text-ink">General report</p>
              )}
              {r.product && <p className="text-xs text-ink-muted">by {r.product.creator.displayName}</p>}
              {r.details && <p className="mt-1 text-sm text-ink-muted">&ldquo;{r.details}&rdquo;</p>}
              <p className="mt-1 text-xs text-ink-faint">
                Reported by {r.reporter.name} · {formatRelativeTime(r.createdAt)}
              </p>
            </div>
            {r.status === "OPEN" && (
              <div className="flex gap-2">
                <AdminActionButton
                  url={`/api/admin/reports/${r.id}`}
                  body={{ status: "ACTIONED", removeListing: true }}
                  label="Remove listing"
                  confirmMessage="Remove this listing from the marketplace?"
                />
                <AdminActionButton url={`/api/admin/reports/${r.id}`} body={{ status: "DISMISSED" }} label="Dismiss" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
