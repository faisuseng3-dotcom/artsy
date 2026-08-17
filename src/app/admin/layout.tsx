import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/creators", label: "Creators" },
    { href: "/admin/users", label: "Users" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <h1 className="mb-1 font-display text-3xl text-ink">Admin</h1>
      <p className="mb-6 text-sm text-ink-muted">Marketplace operations</p>
      <nav className="mb-8 flex gap-1 border-b border-line">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="px-3 py-2 text-sm text-ink-muted hover:text-ink">
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
