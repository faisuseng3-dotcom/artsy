/**
 * Real, licensed product photography for seed data — Unsplash API (Unsplash
 * License permits commercial use). This is a seed-time-only helper (runs
 * inside prisma/seed.ts via tsx on the developer's machine, never in the
 * Next.js app itself), but it follows the same "AI/external service is an
 * enhancement, never a single point of failure" rule as src/lib/ai.ts:
 * without UNSPLASH_ACCESS_KEY, seeding still works via the SVG generator
 * fallback in scripts/generate-placeholder-images.mjs.
 */

const UNSPLASH_API = "https://api.unsplash.com";

export type UnsplashPhoto = {
  url: string; // ~1080px wide, good for masonry cards and detail views
  width: number;
  height: number;
  attribution: string; // "Photo by {name} on Unsplash" — required by Unsplash API guidelines
  downloadLocation: string; // ping this to register a "download" per Unsplash API guidelines
};

export function isUnsplashConfigured() {
  return !!process.env.UNSPLASH_ACCESS_KEY;
}

// Tracks photo IDs already used this seed run so no two products/creators
// end up with the same photo — the brief is explicit that this must not happen.
const usedPhotoIds = new Set<string>();

/**
 * Searches Unsplash for `query` and returns the first result not already
 * used this run. Falls back to reusing search results with a wider `page`
 * if the first page is exhausted, and returns null if nothing is found —
 * callers should fall back to the SVG generator in that case.
 */
export async function searchUnsplashPhoto(
  query: string,
  orientation: "portrait" | "landscape" | "squarish" = "portrait"
): Promise<UnsplashPhoto | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  for (let page = 1; page <= 3; page++) {
    const res = await fetch(
      `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&per_page=10&page=${page}&content_filter=high&orientation=${orientation}`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );
    if (!res.ok) {
      console.warn(`Unsplash search failed for "${query}": ${res.status} ${await res.text().catch(() => "")}`);
      return null;
    }
    const data = await res.json();
    const results: Array<{
      id: string;
      width: number;
      height: number;
      urls: { regular: string };
      user: { name: string };
      links: { download_location: string };
    }> = data.results ?? [];

    const unused = results.find((p) => !usedPhotoIds.has(p.id));
    if (unused) {
      usedPhotoIds.add(unused.id);
      return {
        url: unused.urls.regular,
        width: unused.width,
        height: unused.height,
        attribution: `Photo by ${unused.user.name} on Unsplash`,
        downloadLocation: unused.links.download_location,
      };
    }
    if (results.length < 10) break; // no more pages to try
  }
  return null;
}

/** Required by the Unsplash API guidelines whenever a photo is actually used, not just previewed. */
export async function trackUnsplashDownload(downloadLocation: string) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return;
  try {
    await fetch(downloadLocation, { headers: { Authorization: `Client-ID ${accessKey}` } });
  } catch {
    // Non-critical — a failed download ping shouldn't fail the seed run.
  }
}
