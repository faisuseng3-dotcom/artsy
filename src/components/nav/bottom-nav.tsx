"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { Compass, Search, PlusCircle, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const isCreator = session?.user.role === "CREATOR";

  const items = [
    { href: "/", label: "Home", icon: Compass },
    { href: "/search", label: "Discover", icon: Search },
    { href: isCreator ? "/sell" : "/become-a-creator", label: "Sell", icon: PlusCircle },
    { href: "/activity", label: "Activity", icon: Bell },
    { href: session ? "/account" : "/login", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const isSell = label === "Sell";
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px]",
                isSell ? "text-accent" : active ? "text-accent" : "text-ink-faint"
              )}
            >
              {isSell ? (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-ink">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
              ) : (
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
              )}
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
