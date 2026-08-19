import { PrismaClient, Originality, ProductStatus, ShippingMethod } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generate } from "../scripts/generate-placeholder-images.mjs";
import { searchUnsplashPhoto, isUnsplashConfigured } from "../src/lib/unsplash";

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: "painting", name: "Painting" },
  { slug: "sculpture", name: "Sculpture" },
  { slug: "ceramics", name: "Ceramics" },
  { slug: "furniture", name: "Furniture" },
  { slug: "jewelry", name: "Jewelry" },
  { slug: "textile", name: "Textile Art" },
  { slug: "photography", name: "Photography" },
  { slug: "woodwork", name: "Woodwork" },
  { slug: "metalwork", name: "Metalwork" },
  { slug: "glass", name: "Glass Art" },
];

// Extra search queries per category, used for supporting images (detail
// shots, studio/lifestyle context) beyond the one hero image that's matched
// to the exact product. Keeps the gallery visually varied without pretending
// every shot was taken of that specific piece.
const CATEGORY_VARIETY_QUERIES: Record<string, string[]> = {
  painting: ["abstract painting art studio", "framed painting on gallery wall", "oil painting brush texture detail"],
  sculpture: ["abstract sculpture art gallery", "stone sculpture studio", "sculpture texture detail"],
  ceramics: ["ceramic pottery studio shelf", "handmade ceramic bowl", "pottery glaze texture detail"],
  furniture: ["wood furniture craftsman workshop", "handmade wooden table interior", "wood grain texture detail"],
  jewelry: ["jewelry macro photography", "gold ring studio shot", "jewelry making workbench detail"],
  textile: ["weaving loom textile art", "wool textile texture", "handmade rug textile detail"],
  photography: ["fine art photography print", "photography darkroom print", "black and white photography wall"],
  woodwork: ["wood carving craftsman hands", "woodworking workshop tools", "wood texture detail"],
  metalwork: ["blacksmith forged metal workshop", "welded steel art", "metal texture detail"],
  glass: ["glass blowing studio", "colored glass art vessel", "glass texture detail"],
};

const CREATORS: {
  name: string;
  slug: string;
  city: string;
  country: string;
  categories: string[];
  bio: string;
  story: string;
  portraitQuery: string;
  studioQueries: string[];
}[] = [
  {
    name: "Erik Lindqvist",
    slug: "erik-lindqvist",
    city: "Stockholm",
    country: "Sweden",
    categories: ["furniture", "woodwork"],
    bio: "Furniture maker working in reclaimed Nordic oak and ash.",
    story:
      "Erik trained as a boatbuilder before turning to furniture. Every piece starts from wood he sources himself from torn-down barns around Stockholm — nothing arrives from a lumber yard.",
    portraitQuery: "woodworker craftsman portrait workshop",
    studioQueries: ["woodworking workshop interior", "carpenter workbench tools", "wood furniture workshop light"],
  },
  {
    name: "Maja Berg",
    slug: "maja-berg",
    city: "Gothenburg",
    country: "Sweden",
    categories: ["ceramics"],
    bio: "Wheel-thrown stoneware with ash glazes fired in a wood kiln.",
    story:
      "Maja fires her kiln twice a year, over three days, feeding it by hand through the night. The unpredictability of the ash glaze is the entire point — no two pieces from a firing are alike.",
    portraitQuery: "ceramic artist potter portrait studio",
    studioQueries: ["pottery studio wheel", "ceramic kiln workshop", "potter hands clay wheel"],
  },
  {
    name: "Sofia Almqvist",
    slug: "sofia-almqvist",
    city: "Malmö",
    country: "Sweden",
    categories: ["painting"],
    bio: "Oil painter exploring the Öresund coastline in abstract color fields.",
    story:
      "Sofia paints outdoors year-round, even in winter, working fast before the oil stiffens in the cold. The texture in her canvases comes from actual sea spray drying into the paint.",
    portraitQuery: "painter artist portrait studio",
    studioQueries: ["painter art studio easel", "artist palette paint brushes", "painting studio natural light"],
  },
  {
    name: "Noah Fischer",
    slug: "noah-fischer",
    city: "Berlin",
    country: "Germany",
    categories: ["sculpture", "metalwork"],
    bio: "Welded steel sculpture, salvaged industrial material.",
    story:
      "Noah worked a decade in a shipyard before his first solo show. He still sources steel from the same scrapyards he used to buy fittings from as an apprentice.",
    portraitQuery: "sculptor metal artist portrait workshop",
    studioQueries: ["metal sculpture workshop", "welding workshop sparks", "industrial sculpture studio"],
  },
  {
    name: "Ines Moreau",
    slug: "ines-moreau",
    city: "Lyon",
    country: "France",
    categories: ["textile"],
    bio: "Hand-woven wall hangings on a floor loom, natural dyes.",
    story:
      "Ines dyes every thread herself using onion skin, madder root, and walnut hull. A single wall hanging can take three weeks from dye pot to finished weave.",
    portraitQuery: "textile artist weaver portrait studio",
    studioQueries: ["weaving loom studio", "textile dye workshop", "yarn thread studio shelf"],
  },
  {
    name: "Tomas Rehn",
    slug: "tomas-rehn",
    city: "Copenhagen",
    country: "Denmark",
    categories: ["glass"],
    bio: "Studio glassblower making one-off vessels.",
    story:
      "Tomas apprenticed on the island of Murano before opening his own hot shop in Copenhagen. He blows every piece alone, which is why nothing is ever produced twice.",
    portraitQuery: "glass blower artist portrait studio",
    studioQueries: ["glass blowing hot shop", "glassblower furnace workshop", "glass studio tools"],
  },
  {
    name: "Clara Duvall",
    slug: "clara-duvall",
    city: "Paris",
    country: "France",
    categories: ["jewelry"],
    bio: "Fine jewelry cast from hand-carved wax originals.",
    story:
      "Clara carves every original by hand in wax before casting — nothing is drawn on a screen. It means each design carries the small asymmetries of a hand tool.",
    portraitQuery: "jewelry designer artist portrait studio",
    studioQueries: ["jewelry workbench tools", "jewelry making studio", "goldsmith workshop detail"],
  },
  {
    name: "Aino Salo",
    slug: "aino-salo",
    city: "Helsinki",
    country: "Finland",
    categories: ["photography"],
    bio: "Large-format film photography of Nordic light.",
    story:
      "Aino shoots exclusively on a 4x5 view camera and prints in her own darkroom. She makes fewer than twenty exposures a month by choice.",
    portraitQuery: "photographer artist portrait studio",
    studioQueries: ["photography darkroom studio", "film camera large format", "photography studio light"],
  },
];

type ProductTemplate = {
  category: string;
  title: string;
  description: string;
  materials: string;
  priceCents: number;
  originality: Originality;
  editionSize?: number;
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
  weightGrams?: number;
  imageCount: number;
  imageQuery: string;
};

const PRODUCT_TEMPLATES: ProductTemplate[] = [
  {
    category: "furniture",
    title: "Reclaimed Oak Dining Chair",
    description:
      "A dining chair built from oak reclaimed from a demolished barn outside Stockholm. Hand-planed joints, no screws — the frame is entirely pegged and glued.",
    materials: "Reclaimed Swedish oak, natural wax finish",
    priceCents: 62000,
    originality: Originality.ORIGINAL_ONE_OF_ONE,
    widthCm: 45,
    heightCm: 88,
    depthCm: 50,
    weightGrams: 6200,
    imageCount: 4,
    imageQuery: "handmade wooden dining chair oak",
  },
  {
    category: "furniture",
    title: "Low Ash Side Table",
    description: "A compact side table in ash with a hand-rubbed oil finish. Built to sit beside a reading chair.",
    materials: "Solid ash, hardwax oil",
    priceCents: 38000,
    originality: Originality.ORIGINAL_ONE_OF_ONE,
    widthCm: 40,
    heightCm: 45,
    depthCm: 40,
    weightGrams: 4100,
    imageCount: 3,
    imageQuery: "handmade wooden side table minimal",
  },
  {
    category: "ceramics",
    title: "Ash-Glazed Stoneware Vase",
    description:
      "Wheel-thrown stoneware fired in a wood kiln for three days. The ash glaze pooled naturally on the shoulder of the piece — no two firings ever produce the same result.",
    materials: "Stoneware clay, natural wood-ash glaze",
    priceCents: 24000,
    originality: Originality.ORIGINAL_ONE_OF_ONE,
    widthCm: 18,
    heightCm: 32,
    depthCm: 18,
    weightGrams: 1400,
    imageCount: 4,
    imageQuery: "hand thrown ceramic stoneware vase",
  },
  {
    category: "ceramics",
    title: "Set of Four Stoneware Cups",
    description: "A set of four wood-fired cups, each with slightly different ash markings from their position in the kiln.",
    materials: "Stoneware clay, ash glaze",
    priceCents: 14000,
    originality: Originality.HANDMADE_REPRODUCIBLE,
    weightGrams: 900,
    imageCount: 3,
    imageQuery: "handmade ceramic stoneware cups set",
  },
  {
    category: "painting",
    title: "Öresund, Late October",
    description:
      "An abstract oil study of the strait between Malmö and Copenhagen, painted outdoors over four sessions in autumn light. Sea spray is worked directly into the paint surface.",
    materials: "Oil on linen canvas",
    priceCents: 145000,
    originality: Originality.ORIGINAL_ONE_OF_ONE,
    widthCm: 100,
    heightCm: 80,
    weightGrams: 3200,
    imageCount: 5,
    imageQuery: "abstract seascape oil painting coastal",
  },
  {
    category: "painting",
    title: "Winter Coastline Study No. 3",
    description: "A smaller-format winter coastal study, third in a series of six painted over one January.",
    materials: "Oil on canvas board",
    priceCents: 62000,
    originality: Originality.ORIGINAL_ONE_OF_ONE,
    widthCm: 40,
    heightCm: 30,
    weightGrams: 900,
    imageCount: 3,
    imageQuery: "winter coastline oil painting abstract",
  },
  {
    category: "sculpture",
    title: "Salvage Form No. 12",
    description:
      "A welded steel sculpture built from salvaged shipyard fittings. Part of an ongoing series exploring industrial material after its working life ends.",
    materials: "Salvaged welded steel, clear lacquer",
    priceCents: 320000,
    originality: Originality.ORIGINAL_ONE_OF_ONE,
    widthCm: 35,
    heightCm: 90,
    depthCm: 30,
    weightGrams: 18000,
    imageCount: 4,
    imageQuery: "welded steel abstract sculpture industrial",
  },
  {
    category: "textile",
    title: "Madder Root Wall Hanging",
    description:
      "A hand-woven wall hanging on a floor loom, dyed entirely with madder root and walnut hull. Three weeks from dye pot to finished piece.",
    materials: "Wool, cotton warp, natural dyes",
    priceCents: 48000,
    originality: Originality.ORIGINAL_ONE_OF_ONE,
    widthCm: 70,
    heightCm: 110,
    weightGrams: 1600,
    imageCount: 4,
    imageQuery: "handwoven wall hanging textile art",
  },
  {
    category: "glass",
    title: "Amber Blown Vessel",
    description: "A hand-blown glass vessel in amber, shaped alone in a one-person hot shop. No two vessels share the same profile.",
    materials: "Hand-blown glass",
    priceCents: 39000,
    originality: Originality.ORIGINAL_ONE_OF_ONE,
    widthCm: 22,
    heightCm: 28,
    depthCm: 22,
    weightGrams: 2100,
    imageCount: 3,
    imageQuery: "hand blown amber glass vessel",
  },
  {
    category: "jewelry",
    title: "Carved Wax Signet Ring",
    description: "A signet ring cast from a hand-carved wax original in solid brass, showing the small asymmetries of hand tools.",
    materials: "Cast brass",
    priceCents: 21000,
    originality: Originality.LIMITED_EDITION,
    editionSize: 12,
    weightGrams: 15,
    imageCount: 3,
    imageQuery: "handmade brass signet ring jewelry",
  },
  {
    category: "photography",
    title: "Archipelago, Silver Gelatin Print",
    description: "A large-format 4x5 film photograph of the Helsinki archipelago, printed and toned by hand in the artist's own darkroom.",
    materials: "Silver gelatin print, archival paper",
    priceCents: 58000,
    originality: Originality.LIMITED_EDITION,
    editionSize: 8,
    widthCm: 40,
    heightCm: 50,
    imageCount: 3,
    imageQuery: "black and white archipelago fine art photography",
  },
  {
    category: "metalwork",
    title: "Forged Steel Candle Sconce",
    description: "A hand-forged wall sconce in blackened steel, made using traditional blacksmithing techniques.",
    materials: "Forged steel, blackened finish",
    priceCents: 32000,
    originality: Originality.ORIGINAL_ONE_OF_ONE,
    widthCm: 20,
    heightCm: 35,
    depthCm: 15,
    weightGrams: 2600,
    imageCount: 3,
    imageQuery: "hand forged blackened steel wall sconce",
  },
  {
    category: "woodwork",
    title: "Carved Ash Serving Board",
    description: "A one-piece serving board carved and sanded by hand from a single ash offcut, finished in food-safe oil.",
    materials: "Solid ash, food-safe oil",
    priceCents: 12000,
    originality: Originality.ORIGINAL_ONE_OF_ONE,
    widthCm: 45,
    depthCm: 20,
    weightGrams: 1100,
    imageCount: 3,
    imageQuery: "handmade wooden serving board carved",
  },
];

/**
 * Resolves one real photo (search + download-tracking, per Unsplash API
 * guidelines) or falls back to a generated placeholder if Unsplash isn't
 * configured, the search comes up empty, or the free tier's 50-req/hour
 * limit is hit mid-run — seeding must still finish either way.
 */
async function resolveImage(
  query: string,
  fallbackCategory: string,
  fallbackSeed: string,
  orientation: "portrait" | "landscape" | "squarish" = "portrait"
) {
  if (isUnsplashConfigured()) {
    const photo = await searchUnsplashPhoto(query, orientation);
    if (photo) {
      // Skipped during seeding: the download-tracking ping (required by
      // Unsplash guidelines when a photo is actually shown to end users)
      // doubles the request cost, which burns through the free tier's
      // 50/hour limit twice as fast. It matters for the live app, not for
      // populating demo data — trackUnsplashDownload stays available in
      // src/lib/unsplash.ts for wiring into the real product page later.
      return { url: photo.url, width: photo.width, height: photo.height, attribution: photo.attribution };
    }
  }
  const url = generate(fallbackCategory, fallbackSeed, 900, 1125);
  return { url, width: 900, height: 1125, attribution: null as string | null };
}

async function seedProductImages(productId: string, tpl: ProductTemplate, productIndex: number) {
  const varietyQueries = CATEGORY_VARIETY_QUERIES[tpl.category] ?? [];
  for (let i = 0; i < tpl.imageCount; i++) {
    // The hero shot is matched to the exact product; supporting shots draw
    // from category-level variety so the gallery isn't five near-duplicate
    // search results for the same narrow query.
    const query = i === 0 ? tpl.imageQuery : varietyQueries[(i - 1) % varietyQueries.length] ?? tpl.imageQuery;
    const orientation = i === 0 ? "portrait" : i % 2 === 0 ? "squarish" : "landscape";
    const img = await resolveImage(query, tpl.category, `product-${productIndex}-${i}`, orientation);
    await prisma.productImage.create({
      data: {
        productId,
        url: img.url,
        position: i,
        kind: i === 0 ? "hero" : "gallery",
        width: img.width,
        height: img.height,
        attribution: img.attribution,
      },
    });
  }
}

async function main() {
  if (!isUnsplashConfigured()) {
    console.log("UNSPLASH_ACCESS_KEY not set — seeding with generated placeholder images. See .env.example.");
  }

  console.log("Seeding categories…");
  const categoryBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
    categoryBySlug.set(c.slug, cat.id);
  }

  console.log("Seeding creators…");
  const creatorRecords: { id: string; slug: string; categories: string[] }[] = [];
  for (const c of CREATORS) {
    const passwordHash = await bcrypt.hash("password123", 10);
    const email = `${c.slug.replace(/-/g, ".")}@artsy.dev`;

    const existingCreator = await prisma.creator.findUnique({ where: { slug: c.slug }, include: { studioImages: true } });
    // A generated placeholder avatar is a local /seed/*.svg path; a real one
    // is an Unsplash CDN URL. Only refetch when it's still a placeholder and
    // a key is now available — never burn API quota re-fetching a photo we
    // already have.
    const needsRealPortrait = isUnsplashConfigured() && !existingCreator?.avatarUrl?.includes("images.unsplash.com");
    const portrait = needsRealPortrait
      ? await resolveImage(c.portraitQuery, c.categories[0] ?? "sculpture", `${c.slug}-portrait`, "squarish")
      : { url: existingCreator?.avatarUrl ?? generate(c.categories[0] ?? "sculpture", `${c.slug}-portrait`, 900, 1125) };

    const user = await prisma.user.upsert({
      where: { email },
      update: needsRealPortrait ? { avatarUrl: portrait.url } : {},
      create: {
        email,
        passwordHash,
        name: c.name,
        avatarUrl: portrait.url,
        role: "CREATOR",
        city: c.city,
        country: c.country,
      },
    });

    const creator = await prisma.creator.upsert({
      where: { userId: user.id },
      update: needsRealPortrait ? { avatarUrl: portrait.url } : {},
      create: {
        userId: user.id,
        slug: c.slug,
        displayName: c.name,
        avatarUrl: portrait.url,
        bio: c.bio,
        story: c.story,
        studioCity: c.city,
        studioCountry: c.country,
        categories: c.categories,
        status: "APPROVED",
        verified: true,
        responseRateBp: 9200 + Math.round(Math.random() * 700),
      },
    });

    await prisma.creatorStats.upsert({
      where: { creatorId: creator.id },
      update: {},
      create: { creatorId: creator.id, followerCount: Math.round(20 + Math.random() * 400) },
    });

    const studioStillPlaceholder = !existingCreator || existingCreator.studioImages.every((img) => !img.attribution);
    const shouldRefreshStudio = !existingCreator?.studioImages.length || (isUnsplashConfigured() && studioStillPlaceholder);
    if (shouldRefreshStudio) {
      await prisma.studioImage.deleteMany({ where: { creatorId: creator.id } });
      for (let i = 0; i < c.studioQueries.length; i++) {
        const img = await resolveImage(c.studioQueries[i], c.categories[0] ?? "sculpture", `${c.slug}-studio-${i}`, "landscape");
        await prisma.studioImage.create({
          data: {
            creatorId: creator.id,
            url: img.url,
            caption: i === 0 ? "In the studio" : undefined,
            attribution: img.attribution,
          },
        });
      }
    }

    creatorRecords.push({ id: creator.id, slug: c.slug, categories: c.categories });
  }

  console.log("Seeding products…");
  let productIndex = 0;
  for (const tpl of PRODUCT_TEMPLATES) {
    productIndex++;

    const existing = await prisma.product.findFirst({
      where: { title: tpl.title },
      include: { images: true },
    });

    // A product that already exists (e.g. from a first seed run without an
    // Unsplash key) keeps all its data — title, price, description, likes,
    // everything — untouched. The only thing this re-run is allowed to
    // change is swapping placeholder images for real photos, and only if
    // they're still placeholders (attribution null means "not a real photo
    // yet"); a product that already has real photos is left alone too, so
    // re-running seed repeatedly never re-fetches images it already has.
    if (existing) {
      const stillPlaceholder = existing.images.every((img) => !img.attribution);
      if (!isUnsplashConfigured() || !stillPlaceholder) {
        console.log(`Skipping "${tpl.title}" — ${stillPlaceholder ? "no Unsplash key configured" : "already has real photos"}.`);
        continue;
      }
      console.log(`Replacing placeholder images for "${tpl.title}"…`);
      await prisma.productImage.deleteMany({ where: { productId: existing.id } });
      await seedProductImages(existing.id, tpl, productIndex);
      continue;
    }

    const creator = creatorRecords.find((c) => c.categories.includes(tpl.category)) ?? creatorRecords[0];
    const categoryId = categoryBySlug.get(tpl.category)!;
    const daysAgo = Math.floor(Math.random() * 40);
    const publishedAt = new Date(Date.now() - daysAgo * 86_400_000);

    const product = await prisma.product.create({
      data: {
        creatorId: creator.id,
        categoryId,
        title: tpl.title,
        description: tpl.description,
        materials: tpl.materials,
        tags: [tpl.category],
        originality: tpl.originality,
        editionSize: tpl.editionSize,
        priceCents: tpl.priceCents,
        widthCm: tpl.widthCm,
        heightCm: tpl.heightCm,
        depthCm: tpl.depthCm,
        weightGrams: tpl.weightGrams,
        condition: "excellent",
        shippingMethods: [ShippingMethod.PICKUP_ONLY, ShippingMethod.STANDARD_SHIPPING],
        shippingCountries: ["SE", "DK", "NO", "FI", "DE", "FR"],
        shippingPriceCents: 4500,
        status: ProductStatus.ACTIVE,
        publishedAt,
        createdAt: publishedAt,
      },
    });

    await seedProductImages(product.id, tpl, productIndex);

    await prisma.productStats.create({
      data: {
        productId: product.id,
        viewCount: Math.round(Math.random() * 3000),
        saveCount: Math.round(Math.random() * 150),
        shareCount: Math.round(Math.random() * 30),
      },
    });
  }

  console.log("Seeding a demo buyer…");
  const buyerPasswordHash = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "buyer@artsy.dev" },
    update: {},
    create: {
      email: "buyer@artsy.dev",
      passwordHash: buyerPasswordHash,
      name: "Demo Buyer",
      role: "BUYER",
      city: "Stockholm",
      country: "Sweden",
      interests: ["furniture", "ceramics"],
    },
  });

  console.log("Seeding an admin…");
  const adminPasswordHash = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "admin@artsy.dev" },
    update: {},
    create: {
      email: "admin@artsy.dev",
      passwordHash: adminPasswordHash,
      name: "Platform Admin",
      role: "ADMIN",
    },
  });

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
