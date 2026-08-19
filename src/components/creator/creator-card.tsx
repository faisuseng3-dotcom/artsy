import Link from "next/link";
import Image from "next/image";
import { CreatorAvatar } from "@/components/creator/creator-avatar";

export type CreatorCardData = {
  slug: string;
  displayName: string;
  avatarUrl?: string | null;
  studioCity: string | null;
  studioCountry: string | null;
  bio: string | null;
  studioImages: { url: string }[];
};

export function CreatorCard({ creator }: { creator: CreatorCardData }) {
  const location = [creator.studioCity, creator.studioCountry].filter(Boolean).join(", ");
  const image = creator.studioImages[0];

  return (
    <Link href={`/creators/${creator.slug}`} className="group block w-40 shrink-0 sm:w-48">
      <div className="overflow-hidden rounded-2xl bg-ink/5">
        {image ? (
          <Image
            src={image.url}
            alt=""
            width={300}
            height={225}
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="aspect-[4/3] w-full" />
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <CreatorAvatar name={creator.displayName} imageUrl={creator.avatarUrl} size="xs" />
        <p className="truncate text-[13px] font-medium text-ink">{creator.displayName}</p>
      </div>
      {location && <p className="truncate text-[12px] text-ink-muted">{location}</p>}
    </Link>
  );
}
