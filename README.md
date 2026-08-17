# Artsy — a discovery marketplace for independent creators

> "Discover something you didn't know you wanted, made by someone you would
> never have discovered otherwise."

This is a working MVP, not a mockup. Every flow described below is wired to
a real Postgres database, real auth, and (where a third-party service is
required) real integration code — the only thing not "live" in this
environment is Stripe itself, because no API keys exist here. See
[What's real vs. stubbed](#whats-real-vs-stubbed).

## Running it

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL at minimum
npx prisma migrate dev
npm run db:seed
npm run dev
```

Demo accounts (seeded, password `password123` for all):
- `buyer@artsy.dev` — buyer
- `erik.lindqvist@artsy.dev` — creator (7 more creators seeded, see `prisma/seed.ts`)
- `admin@artsy.dev` — admin

Seed data includes 8 creators, 13 listings across 10 categories, studio
photos, and stats. Product photos are generated locally as deterministic
SVGs (`scripts/generate-placeholder-images.mjs`) — this environment's
network policy blocks hotlinking to Unsplash/Picsum, so the seed is fully
self-contained rather than depending on an external image host.

## Product decisions, and why

**The homepage has no search bar as the primary action.** The brief
correctly identifies that "search products" reads as e-commerce, not
discovery. The feed (`/`) opens directly on a ranked, masonry grid of work,
with category chips and editorial rails ("One of one", "Made in Stockholm")
below it. Search exists at `/search` for people who already know what
they want.

**Creator accounts are auto-approved at signup, not gated behind admin
review.** The brief's own priority list puts "extremely easy seller
onboarding" above trust infrastructure, and section 76 explicitly invites
disagreement with default assumptions. A pending-approval queue is the
right *long-term* answer once volume creates real fraud risk, but at MVP
scale it just adds a day of dead time between signup and first listing —
which kills the "publish in 3 minutes" promise this product is supposed to
prove. Admin retains suspend power (`/admin/creators`), so bad actors are
still removable; they're just not blocked pre-emptively. This is the kind
of thing that should flip back to gated once there's real abuse to react to.

**The AI listing assistant never invents facts.** This was a hard
requirement in the brief and it's enforced twice: the system prompt sent to
the model explicitly forbids inventing materials/dimensions/process, and
asks for a `missingFields` list instead of guessing; and independently, the
no-API-key fallback path (`src/lib/ai.ts`) only extracts what's literally
present in the creator's own text via keyword/regex matching — it never
fabricates. Whichever path runs, the creator sees and edits every field
before anything publishes (spec section 11's "never auto-publish AI
content" is a hard constraint, not a suggestion).

**Price suggestions are computed, not modeled.** `suggestPriceRange()` in
`src/lib/ai.ts` takes the 25th–75th percentile of real comparable listing
prices in the same category — no LLM call, no invented number. Below 3
comparables it says so plainly instead of pretending to have signal. This
matches the brief's explicit instruction not to present an estimate as
objective truth.

**Discovery ranking is a transparent weighted score, not a black-box
model.** `src/lib/discovery.ts` scores recency, engagement (log-dampened so
one viral item can't permanently dominate), category/creator affinity,
price compatibility, and creator quality/verification. Every `Event` the
spec asks to track (views, saves, follows, shares, purchases) already
lands in the `Event` table, so a learned ranker can replace this function
later without a schema change — but building an ML ranker now, before
there's enough interaction data to train on, would be solving a problem
the product doesn't have yet.

**Checkout is real Stripe Checkout Session + Connect code, not a fake
"Buy" button.** The brief is explicit: *"Do not create fake checkout."*
Since this environment has no `STRIPE_SECRET_KEY`, the honest thing to do
was not to simulate success — `/checkout/[id]` shows a plain "payments
aren't connected" state and links to the code that would run with a real
key. The webhook handler (`/api/stripe/webhook`) does the real work on
`checkout.session.completed`: marks the order paid, the product sold,
creates a `Payment` and a `Payout` (pending until the creator's Stripe
Connect account exists), and notifies the creator. Platform take rate is
10% (`PLATFORM_FEE_BP`), inside the brief's 8–12% target range.

**Image uploads write to local disk in dev, not S3, but through the same
API contract.** `/api/uploads` is where an S3-compatible client would slot
in; swapping the implementation doesn't touch any caller.

## Architecture

```
src/
  app/                  Next.js App Router — pages + API routes colocated
    p/[id]/              product detail
    creators/[slug]/     creator profile
    sell/, sell/new/      creator dashboard + listing wizard
    checkout/[id]/, orders/  commerce
    admin/               moderation + marketplace metrics
    api/                 REST-ish route handlers (auth, products, ai/*, admin/*, stripe/webhook)
  components/
    ui/                  design system primitives (Button, Badge, Input, Skeleton, EmptyState)
    product/, creator/, sell/, admin/, nav/, auth/
  lib/
    prisma.ts            singleton client
    auth.ts              NextAuth config (credentials + JWT sessions, role-aware)
    discovery.ts          feed ranking
    ai.ts                listing draft + price suggestion (AI + fallback)
    stripe.ts             Connect-ready Stripe client
    queries.ts             shared Prisma queries
prisma/
  schema.prisma           full data model
  seed.ts                 realistic demo data
```

Everything server-rendering product data does so at request time
(`revalidate = 0`) rather than statically — a marketplace feed is wrong the
moment it's stale (sold items, new listings), so freshness beats the
caching win at this scale.

## Data model

Full schema in `prisma/schema.prisma`. Shape follows the brief's entity
list directly: `User` → `Creator` (1:1) → `Product` → `ProductImage`,
`Order` → `OrderItem` → `Payment`/`Payout`, plus `Favorite`, `Follow`,
`SavedCollection`, `Review` (with `isVerifiedPurchase` distinguishing
purchase-backed reviews per spec section 18), `Report` + `AuditLog` for
moderation, `Notification`, and an append-only `Event` table that is the
single input to both discovery ranking and future analytics dashboards.
Money is always integer cents; ratings are basis points of a 5.0 scale —
both to avoid floating-point drift in anything financial.

Indexes are on every foreign key plus the columns the feed/search/admin
queries actually filter or sort by (`status`, `createdAt`, `priceCents`,
`(type, createdAt)` on `Event`).

## What's real vs. stubbed

| Area | Status |
|---|---|
| Auth, roles, sessions | Real (NextAuth + bcrypt + Postgres) |
| Feed, search, product/creator pages | Real, live queries |
| Sell flow, image upload, AI draft, price suggestion | Real; AI degrades to a rules-based extractor without `OPENAI_API_KEY` |
| Favorites, follows, notifications, reports | Real |
| Admin moderation, audit log | Real |
| Stripe checkout + webhook + payout record | Real code; inert without `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` (shows an honest "not connected" state, never a fake success) |
| Image storage | Local disk in dev; swap point for S3 is `/api/uploads` |
| Discovery ranking | Real weighted heuristic; documented as the seam for a future learned ranker |
| Editorial collections | Real data, hand-picked filters (cold-start solution per spec section 51 — the algorithm shouldn't have to solve discovery alone on day one) |

## Deliberately not built (see spec sections 48, 74, 84)

Auctions, drops/collections-as-a-feature, livestream commerce, AR,
multi-currency/i18n UI, collector tools, in-app messaging (a real trust
surface — needs scam/off-platform-payment detection to be safe, which is
more than an MVP slice), and a learned recommendation model. All of these
are additive to the current schema and architecture, not blocked by it.

## North Star metric

**Weekly creator–buyer transactions** (not downloads, not follower counts).
Everything on `/admin` — GMV, orders, active listings, creator/buyer
counts — feeds that number. Secondary: time-to-first-sale for new
creators, and buyer repeat-purchase rate, since those are what liquidity
actually depends on.
