import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRelativeTime, cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Bell } from "lucide-react";

export const revalidate = 0;

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/activity");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (notifications.length > 0) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl text-ink">Activity</h1>
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Nothing yet" description="Updates on your orders, saves, and follows will appear here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.linkUrl ?? "#"}
              className={cn("block rounded-xl border border-line p-3", !n.readAt && "bg-accent-soft/40")}
            >
              <p className="text-sm font-medium text-ink">{n.title}</p>
              {n.body && <p className="text-sm text-ink-muted">{n.body}</p>}
              <p className="mt-0.5 text-xs text-ink-faint">{formatRelativeTime(n.createdAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
