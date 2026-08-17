import { PrismaClient, Originality, ProductStatus, ShippingMethod } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generate } from "../scripts/generate-placeholder-images.mjs";

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

const CREATORS = [
  {
    name: "Erik Lindqvist",
    slug: "erik-lindqvist",
    city: "Stockholm",
    country: "Sweden",
    categories: ["furniture", "woodwork"],
    bio: "Furniture maker working in reclaimed Nordic oak and ash.",
    story:
      "Erik trained as a boatbuilder before turning to furniture. Every piece starts from wood he sources himself from torn-down barns around Stockholm — nothing arrives from a lumber yard.",
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
  },
];

const PRODUCT_TEMPLATES: {
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
}[] = [
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
  },
];

async function main() {
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
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        name: c.name,
        role: "CREATOR",
        city: c.city,
        country: c.country,
      },
    });

    const creator = await prisma.creator.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        slug: c.slug,
        displayName: c.name,
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

    for (let i = 0; i < 3; i++) {
      const seed = `${c.slug}-studio-${i}`;
      const url = generate(c.categories[0] ?? "sculpture", seed, 1200, 900);
      await prisma.studioImage.create({
        data: { creatorId: creator.id, url, caption: i === 0 ? "In the studio" : undefined },
      });
    }

    creatorRecords.push({ id: creator.id, slug: c.slug, categories: c.categories });
  }

  console.log("Seeding products…");
  let productIndex = 0;
  for (const tpl of PRODUCT_TEMPLATES) {
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

    for (let i = 0; i < tpl.imageCount; i++) {
      const seed = `product-${productIndex}-${i}`;
      const url = generate(tpl.category, seed, 900, 1125);
      await prisma.productImage.create({
        data: { productId: product.id, url, position: i, kind: i === 0 ? "hero" : "gallery", width: 900, height: 1125 },
      });
    }

    await prisma.productStats.create({
      data: {
        productId: product.id,
        viewCount: Math.round(Math.random() * 3000),
        saveCount: Math.round(Math.random() * 150),
        shareCount: Math.round(Math.random() * 30),
      },
    });

    productIndex++;
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
