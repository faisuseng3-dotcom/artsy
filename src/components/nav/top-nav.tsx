import Link from "next/link";
import type { Session } from "next-auth";
import { Search, Heart } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function TopNav({ session }: { session: Session | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="font-display text-2xl tracking-tight text-ink">
          Artsy
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-ink-muted md:flex">
          <Link href="/" className="hover:text-ink">Discover</Link>
          <Link href="/creators" className="hover:text-ink">Creators</Link>
          <Link href="/collections" className="hover:text-ink">Collections</Link>
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href="/search"
            className="hidden h-10 w-56 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm text-ink-faint md:flex"
          >
            <Search className="h-4 w-4" />
            Search creations, creators…
          </Link>
          <Link href="/search" className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5 md:hidden">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/saved" className="hidden h-10 w-10 place-items-center rounded-full hover:bg-ink/5 md:grid">
            <Heart className="h-5 w-5" />
          </Link>

          {session?.user ? (
            <>
              {session.user.role === "CREATOR" && (
                <ButtonLink href="/sell" size="sm" variant="accent" className="hidden md:inline-flex">
                  Sell
                </ButtonLink>
              )}
              <Link
                href={session.user.role === "ADMIN" ? "/admin" : "/account"}
                className="grid h-10 w-10 place-items-center rounded-full bg-ink/5 text-sm font-medium"
              >
                {session.user.name?.[0]?.toUpperCase() ?? "A"}
              </Link>
            </>
          ) : (
            <ButtonLink href="/login" size="sm" variant="outline">
              Sign in
            </ButtonLink>
          )}
        </div>
      </div>
    </header>
  );
}
