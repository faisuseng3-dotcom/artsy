/**
 * AI listing + pricing assistants. Both must degrade gracefully — the sell
 * flow is the product's most important funnel, and it can never break just
 * because OPENAI_API_KEY is unset or the API call fails. When a key is
 * present we ask the model to draft copy strictly from what the creator
 * said (explicit "do not invent facts" instruction, since a hallucinated
 * material or dimension is a trust problem, not a cosmetic one). When it
 * isn't, a rules-based extractor produces a usable, honest draft instead.
 */

export type ListingDraftInput = {
  categoryName: string;
  rawDescription: string;
};

export type ListingDraft = {
  title: string;
  description: string;
  materials: string | null;
  tags: string[];
  condition: string | null;
  missingFields: string[];
  source: "ai" | "fallback";
};

const MATERIAL_WORDS = [
  "oak", "ash", "pine", "walnut", "wood", "steel", "brass", "bronze", "silver", "gold",
  "clay", "stoneware", "porcelain", "ceramic", "glass", "wool", "cotton", "linen",
  "leather", "canvas", "concrete", "marble", "resin", "silk", "copper", "iron",
];

function extractMaterials(text: string): string | null {
  const found = MATERIAL_WORDS.filter((w) => new RegExp(`\\b${w}\\b`, "i").test(text));
  if (found.length === 0) return null;
  return [...new Set(found.map((w) => w[0].toUpperCase() + w.slice(1)))].join(", ");
}

function extractDimension(text: string): string | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s?(cm|centimeters?|centimetres?)/i);
  return match ? `${match[1]} cm` : null;
}

function fallbackDraft({ categoryName, rawDescription }: ListingDraftInput): ListingDraft {
  const materials = extractMaterials(rawDescription);
  const dimension = extractDimension(rawDescription);
  const missingFields: string[] = [];
  if (!materials) missingFields.push("materials");
  if (!dimension) missingFields.push("approximate size");
  if (!/week|day|month/i.test(rawDescription)) missingFields.push("how long it took to make");

  const sentence = rawDescription.trim().replace(/\s+/g, " ");
  const title = sentence.length > 0
    ? `${categoryName} — ${sentence.slice(0, 40).replace(/[.,;]$/, "")}${sentence.length > 40 ? "…" : ""}`
    : `Original ${categoryName}`;

  const description = sentence.length > 0
    ? sentence.charAt(0).toUpperCase() + sentence.slice(1) + (sentence.endsWith(".") ? "" : ".")
    : `A one-of-one ${categoryName.toLowerCase()} piece.`;

  return {
    title,
    description,
    materials,
    tags: [categoryName.toLowerCase()],
    condition: /scratch|mark|wear|chip|small (flaw|imperfection)/i.test(rawDescription) ? "Excellent — minor imperfections noted" : "Excellent",
    missingFields,
    source: "fallback",
  };
}

export async function draftListing(input: ListingDraftInput): Promise<ListingDraft> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallbackDraft(input);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write concise, honest marketplace listings for a creator marketplace. " +
              "Never invent facts (materials, dimensions, weight, process) that are not stated or clearly implied by the creator's own words. " +
              'If something important is missing, list it in "missingFields" instead of guessing. ' +
              'Respond as strict JSON: {"title": string, "description": string, "materials": string|null, "tags": string[], "condition": string|null, "missingFields": string[]}',
          },
          {
            role: "user",
            content: `Category: ${input.categoryName}\nCreator's own description: "${input.rawDescription}"`,
          },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) return fallbackDraft(input);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fallbackDraft(input);
    const parsed = JSON.parse(content);
    return {
      title: parsed.title ?? fallbackDraft(input).title,
      description: parsed.description ?? fallbackDraft(input).description,
      materials: parsed.materials ?? null,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [input.categoryName.toLowerCase()],
      condition: parsed.condition ?? null,
      missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields : [],
      source: "ai",
    };
  } catch {
    return fallbackDraft(input);
  }
}

export type PriceSuggestion = {
  lowCents: number;
  highCents: number;
  sampleSize: number;
  explanation: string;
};

/** Always computed from real comparable listings — never a model guess. */
export function suggestPriceRange(comparablePricesCents: number[]): PriceSuggestion {
  if (comparablePricesCents.length < 3) {
    return {
      lowCents: 0,
      highCents: 0,
      sampleSize: comparablePricesCents.length,
      explanation:
        "Not enough comparable listings in this category yet to suggest a range with confidence. Price based on your materials, time invested, and comparable work you've seen elsewhere.",
    };
  }
  const sorted = [...comparablePricesCents].sort((a, b) => a - b);
  const p25 = sorted[Math.floor(sorted.length * 0.25)];
  const p75 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75))];
  return {
    lowCents: p25,
    highCents: p75,
    sampleSize: sorted.length,
    explanation: `Based on ${sorted.length} comparable listings in this category on Artsy. This is a suggested range, not an appraisal — you set the final price.`,
  };
}
