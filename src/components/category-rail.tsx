import Link from "next/link";

export function CategoryRail({ categories }: { categories: { slug: string; name: string }[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      <Link
        href="/"
        className="shrink-0 rounded-full border border-ink/15 bg-paper-raised px-4 py-2 text-sm font-medium text-ink"
      >
        For You
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/c/${c.slug}`}
          className="shrink-0 rounded-full border border-ink/10 px-4 py-2 text-sm text-ink-muted hover:border-ink/30 hover:text-ink"
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
