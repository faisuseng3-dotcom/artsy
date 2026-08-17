import { ButtonLink } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="mb-8 border-b border-line pb-8 pt-2 text-center md:pb-10 md:pt-6">
      <h1 className="mx-auto max-w-xl font-display text-[28px] leading-[1.15] text-ink md:text-[38px]">
        Things you won&apos;t find anywhere else.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] text-ink-muted">
        Original works and objects made by independent creators.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <ButtonLink href="#feed" variant="primary" size="md">
          Explore works
        </ButtonLink>
        <ButtonLink href="/become-a-creator" variant="outline" size="md">
          Sell your work
        </ButtonLink>
      </div>
    </section>
  );
}
