import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ChevronRight } from "lucide-react";

export const revalidate = 0;

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const [orderCount, favoriteCount, followCount] = await Promise.all([
    prisma.order.count({ where: { buyerId: session.user.id } }),
    prisma.favorite.count({ where: { userId: session.user.id } }),
    prisma.follow.count({ where: { userId: session.user.id } }),
  ]);

  const links = [
    { href: "/orders", label: "Orders", count: orderCount },
    { href: "/saved", label: "Saved", count: favoriteCount },
    { href: "/following", label: "Following", count: followCount },
    ...(session.user.role === "CREATOR" ? [{ href: "/sell", label: "Your studio", count: null }] : []),
    ...(session.user.role === "BUYER" ? [{ href: "/become-a-creator", label: "Start selling", count: null }] : []),
    ...(session.user.role === "ADMIN" ? [{ href: "/admin", label: "Admin dashboard", count: null }] : []),
  ];

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-ink/5 font-display text-2xl">
          {session.user.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-display text-xl text-ink">{session.user.name}</p>
          <p className="text-sm text-ink-muted">{session.user.email}</p>
        </div>
      </div>

      <div className="divide-y divide-line rounded-xl border border-line">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-ink">{l.label}</span>
            <span className="flex items-center gap-2 text-ink-muted">
              {l.count !== null && l.count}
              <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>

      <SignOutButton className="mt-6" />
    </div>
  );
}
