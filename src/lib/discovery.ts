/**
 * Discovery scoring — deliberately a transparent weighted model, not an ML
 * ranker. It has to work from day one with near-zero interaction data, and
 * every term is auditable, which matters for debugging a cold-start feed.
 * The `Event` table already captures every signal a future learned ranker
 * would need (views, saves, follows, dwell, purchases), so swapping this
 * function for a model later is additive, not a rewrite.
 */

export type ScorableProduct = {
  createdAt: Date;
  publishedAt: Date | null;
  priceCents: number;
  stats: { viewCount: number; saveCount: number; shareCount: number } | null;
  creator: { verified: boolean; stats: { avgRatingBp: number } | null };
};

export type DiscoveryContext = {
  viewerCategoryAffinity?: number; // 0..1, how much the viewer engages with this category
  viewerCreatorAffinity?: number; // 0..1, prior engagement with this creator
  priceCompatibility?: number; // 0..1, how close price is to viewer's typical range
};

const HALF_LIFE_DAYS = 10;

function recencyScore(publishedAt: Date | null, createdAt: Date) {
  const anchor = publishedAt ?? createdAt;
  const ageDays = (Date.now() - anchor.getTime()) / 86_400_000;
  return Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
}

function engagementScore(stats: ScorableProduct["stats"]) {
  if (!stats) return 0;
  const raw = stats.viewCount * 0.02 + stats.saveCount * 0.5 + stats.shareCount * 0.8;
  // Diminishing returns so a single viral item doesn't permanently dominate.
  return Math.log1p(raw) / Math.log1p(200);
}

function qualityScore(creator: ScorableProduct["creator"]) {
  const ratingBp = creator.stats?.avgRatingBp ?? 400; // default to "unproven but decent"
  const ratingComponent = ratingBp / 500;
  const verifiedBonus = creator.verified ? 0.15 : 0;
  return Math.min(1, ratingComponent * 0.85 + verifiedBonus);
}

export function scoreProduct(product: ScorableProduct, ctx: DiscoveryContext = {}) {
  const recency = recencyScore(product.publishedAt, product.createdAt);
  const engagement = engagementScore(product.stats);
  const quality = qualityScore(product.creator);
  const categoryAffinity = ctx.viewerCategoryAffinity ?? 0.5;
  const creatorAffinity = ctx.viewerCreatorAffinity ?? 0;
  const priceCompatibility = ctx.priceCompatibility ?? 0.5;

  const weights = {
    recency: 0.28,
    engagement: 0.22,
    categoryAffinity: 0.18,
    creatorAffinity: 0.12,
    priceCompatibility: 0.08,
    quality: 0.12,
  };

  return (
    recency * weights.recency +
    engagement * weights.engagement +
    categoryAffinity * weights.categoryAffinity +
    creatorAffinity * weights.creatorAffinity +
    priceCompatibility * weights.priceCompatibility +
    quality * weights.quality
  );
}

export function rankProducts<T extends ScorableProduct>(
  products: T[],
  ctx: DiscoveryContext = {}
): T[] {
  return [...products].sort((a, b) => scoreProduct(b, ctx) - scoreProduct(a, ctx));
}
