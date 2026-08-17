"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { cn, formatMoney } from "@/lib/utils";
import { Loader2, Upload, Sparkles, X } from "lucide-react";

type Category = { slug: string; name: string };

const ORIGINALITY_OPTIONS = [
  { value: "ORIGINAL_ONE_OF_ONE", label: "One of one — original" },
  { value: "LIMITED_EDITION", label: "Limited edition" },
  { value: "OPEN_EDITION_PRINT", label: "Open edition print" },
  { value: "HANDMADE_REPRODUCIBLE", label: "Handmade, reproducible" },
  { value: "AI_ASSISTED", label: "AI-assisted" },
] as const;

const SHIPPING_OPTIONS = [
  { value: "PICKUP_ONLY", label: "Local pickup" },
  { value: "LOCAL_DELIVERY", label: "Local delivery" },
  { value: "STANDARD_SHIPPING", label: "Standard shipping" },
  { value: "LARGE_ITEM_SHIPPING", label: "Large-item shipping" },
] as const;

export function ListingWizard({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? "");
  const [images, setImages] = useState<{ url: string; file: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const [rawDescription, setRawDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSource, setAiSource] = useState<"ai" | "fallback" | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materials, setMaterials] = useState("");
  const [originality, setOriginality] = useState<(typeof ORIGINALITY_OPTIONS)[number]["value"]>("ORIGINAL_ONE_OF_ONE");
  const [editionSize, setEditionSize] = useState("");
  const [condition, setCondition] = useState("Excellent");

  const [priceEuros, setPriceEuros] = useState("");
  const [priceSuggestion, setPriceSuggestion] = useState<{ lowCents: number; highCents: number; sampleSize: number; explanation: string } | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [depthCm, setDepthCm] = useState("");
  const [weightGrams, setWeightGrams] = useState("");
  const [shippingMethods, setShippingMethods] = useState<string[]>(["PICKUP_ONLY"]);
  const [shippingPriceEuros, setShippingPriceEuros] = useState("");

  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryName = categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug;

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: { url: string; file: string }[] = [];
    for (const file of Array.from(files).slice(0, 6 - images.length)) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        uploaded.push({ url: data.url, file: file.name });
      }
    }
    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
  }

  async function runAssistant() {
    setAiLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/listing-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryName, rawDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't draft a listing");
      setTitle(data.title);
      setDescription(data.description);
      setMaterials(data.materials ?? "");
      setCondition(data.condition ?? "Excellent");
      setMissingFields(data.missingFields ?? []);
      setAiSource(data.source);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAiLoading(false);
    }
  }

  async function loadPriceSuggestion() {
    setPriceLoading(true);
    const res = await fetch("/api/ai/price-suggestion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categorySlug }),
    });
    if (res.ok) setPriceSuggestion(await res.json());
    setPriceLoading(false);
  }

  async function publish() {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorySlug,
          title,
          description,
          materials: materials || undefined,
          originality,
          editionSize: originality === "LIMITED_EDITION" && editionSize ? Number(editionSize) : undefined,
          priceCents: Math.round(Number(priceEuros) * 100),
          widthCm: widthCm ? Number(widthCm) : undefined,
          heightCm: heightCm ? Number(heightCm) : undefined,
          depthCm: depthCm ? Number(depthCm) : undefined,
          weightGrams: weightGrams ? Number(weightGrams) : undefined,
          condition,
          shippingMethods,
          shippingPriceCents: shippingPriceEuros ? Math.round(Number(shippingPriceEuros) * 100) : undefined,
          imageUrls: images.map((i) => i.url),
          aiAssisted: aiSource === "ai",
          publish: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't publish this listing");
      router.push(`/p/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPublishing(false);
    }
  }

  const steps = ["What do you make?", "Add photos", "Describe it", "Review listing", "Price & shipping"];

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-ink/10")} />
        ))}
      </div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-faint">
        Step {step + 1} of {steps.length}
      </p>
      <h1 className="mb-6 font-display text-2xl text-ink">{steps[step]}</h1>

      {error && <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      {step === 0 && (
        <div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => setCategorySlug(c.slug)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left text-sm font-medium",
                  categorySlug === c.slug ? "border-accent bg-accent-soft text-accent" : "border-ink/15 text-ink"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
          <Button className="mt-6" variant="accent" size="lg" onClick={() => setStep(1)} disabled={!categorySlug}>
            Continue
          </Button>
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((img, i) => (
              <div key={img.url} className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-ink/5">
                <Image src={img.url} alt="" fill className="object-cover" />
                <button
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/70 text-paper"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {images.length < 6 && (
              <label className="grid aspect-[4/5] cursor-pointer place-items-center rounded-xl border border-dashed border-ink/25 text-ink-faint hover:border-ink/40">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
              </label>
            )}
          </div>
          <p className="mt-3 text-xs text-ink-muted">Add at least one photo. A hero shot plus a detail and scale shot works best.</p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button variant="accent" onClick={() => setStep(2)} disabled={images.length === 0}>Continue</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <Label>Tell us about this piece, in your own words</Label>
          <Textarea
            rows={6}
            value={rawDescription}
            onChange={(e) => setRawDescription(e.target.value)}
            placeholder='e.g. "I made this lamp from reclaimed oak and brass. It took me about two weeks. It stands roughly 45cm tall."'
          />
          <p className="mt-2 text-xs text-ink-muted">
            Our assistant turns this into a polished listing — you approve every word before it goes live.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button variant="accent" onClick={runAssistant} disabled={aiLoading || rawDescription.trim().length < 5}>
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Drafting…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Draft my listing
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          {aiSource === "fallback" && (
            <p className="rounded-lg bg-accent-soft px-3 py-2 text-xs text-accent">
              Drafted from your description. Fill in anything we couldn&apos;t detect below.
            </p>
          )}
          {missingFields.length > 0 && (
            <p className="rounded-lg bg-ink/5 px-3 py-2 text-xs text-ink-muted">
              We couldn&apos;t tell: {missingFields.join(", ")}. Add these if you can.
            </p>
          )}
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Materials</Label>
            <Input value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="e.g. Reclaimed oak, brass" />
          </div>
          <div>
            <Label>Originality</Label>
            <select
              value={originality}
              onChange={(e) => setOriginality(e.target.value as typeof originality)}
              className="h-11 w-full rounded-xl border border-ink/15 bg-paper-raised px-4 text-sm"
            >
              {ORIGINALITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {originality === "LIMITED_EDITION" && (
            <div>
              <Label>Edition size</Label>
              <Input type="number" min={1} value={editionSize} onChange={(e) => setEditionSize(e.target.value)} />
            </div>
          )}
          <div>
            <Label>Condition</Label>
            <Input value={condition} onChange={(e) => setCondition(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button variant="accent" onClick={() => { setStep(4); loadPriceSuggestion(); }} disabled={!title || !description}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <div>
            <Label>Price (EUR)</Label>
            <Input type="number" min={1} value={priceEuros} onChange={(e) => setPriceEuros(e.target.value)} placeholder="450" />
            <div className="mt-2 text-xs text-ink-muted">
              {priceLoading && "Looking at comparable listings…"}
              {priceSuggestion && priceSuggestion.sampleSize >= 3 && (
                <p>
                  Suggested range:{" "}
                  <button
                    type="button"
                    className="font-medium text-accent underline"
                    onClick={() => setPriceEuros(String(Math.round((priceSuggestion.lowCents + priceSuggestion.highCents) / 2 / 100)))}
                  >
                    {formatMoney(priceSuggestion.lowCents)} – {formatMoney(priceSuggestion.highCents)}
                  </button>
                  . {priceSuggestion.explanation}
                </p>
              )}
              {priceSuggestion && priceSuggestion.sampleSize < 3 && <p>{priceSuggestion.explanation}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Width (cm)</Label>
              <Input type="number" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} />
            </div>
            <div>
              <Label>Height (cm)</Label>
              <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            </div>
            <div>
              <Label>Depth (cm)</Label>
              <Input type="number" value={depthCm} onChange={(e) => setDepthCm(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Weight (grams)</Label>
            <Input type="number" value={weightGrams} onChange={(e) => setWeightGrams(e.target.value)} />
          </div>

          <div>
            <Label>Shipping</Label>
            <div className="flex flex-wrap gap-2">
              {SHIPPING_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() =>
                    setShippingMethods((prev) => (prev.includes(o.value) ? prev.filter((m) => m !== o.value) : [...prev, o.value]))
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm",
                    shippingMethods.includes(o.value) ? "border-accent bg-accent-soft text-accent" : "border-ink/15 text-ink-muted"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          {shippingMethods.some((m) => m !== "PICKUP_ONLY") && (
            <div>
              <Label>Shipping price (EUR)</Label>
              <Input type="number" min={0} value={shippingPriceEuros} onChange={(e) => setShippingPriceEuros(e.target.value)} />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
            <Button variant="accent" size="lg" onClick={publish} disabled={publishing || !priceEuros}>
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Publishing…
                </>
              ) : (
                "Publish listing"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
