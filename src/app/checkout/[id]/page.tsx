import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured, PLATFORM_FEE_BP } from "@/lib/stripe";
import { ButtonLink } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/checkout/${id}`);

  const product = await prisma.product.findUnique({
    where: { id },
    include: { creator: true, images: { take: 1, orderBy: { position: "asc" } } },
  });
  if (!product) notFound();
  if (product.status !== "ACTIVE") redirect(`/p/${id}`);

  const viewerCreator = await prisma.creator.findUnique({ where: { userId: session.user.id } });
  if (viewerCreator && product.creatorId === viewerCreator.id) redirect(`/p/${id}`);

  if (!isStripeConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <CreditCard className="mx-auto mb-4 h-8 w-8 text-ink-faint" strokeWidth={1.5} />
        <h1 className="font-display text-2xl text-ink">Payments aren&apos;t connected yet</h1>
        <p className="mt-2 text-sm text-ink-muted">
          This environment doesn&apos;t have a Stripe account configured, so real checkout is disabled rather than
          simulated. Set <code className="rounded bg-ink/5 px-1">STRIPE_SECRET_KEY</code> to enable it — the
          integration (Checkout Session + Connect payout, in <code className="rounded bg-ink/5 px-1">src/lib/stripe.ts</code>)
          is otherwise complete.
        </p>
        <ButtonLink href={`/p/${id}`} variant="outline" className="mt-6">
          Back to listing
        </ButtonLink>
      </div>
    );
  }

  const subtotalCents = product.priceCents;
  const shippingCents = product.shippingPriceCents ?? 0;
  const platformFeeCents = Math.round((subtotalCents * PLATFORM_FEE_BP) / 10_000);
  const totalCents = subtotalCents + shippingCents;

  const order = await prisma.order.create({
    data: {
      buyerId: session.user.id,
      creatorId: product.creatorId,
      status: "PENDING_PAYMENT",
      subtotalCents,
      shippingCents,
      platformFeeCents,
      totalCents,
      currency: product.currency,
      items: { create: [{ productId: product.id, quantity: 1, unitPriceCents: product.priceCents }] },
    },
  });

  const stripe = getStripe();
  const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: product.currency.toLowerCase(),
          unit_amount: subtotalCents,
          product_data: {
            name: product.title,
            description: `By ${product.creator.displayName}`,
            images: product.images[0] ? [new URL(product.images[0].url, origin).toString()] : undefined,
          },
        },
      },
      ...(shippingCents > 0
        ? [
            {
              quantity: 1,
              price_data: {
                currency: product.currency.toLowerCase(),
                unit_amount: shippingCents,
                product_data: { name: "Shipping" },
              },
            },
          ]
        : []),
    ],
    payment_intent_data: {
      // Platform fee captured here; transfer_data.destination would route the
      // remainder to the creator's Stripe Connect account once onboarded
      // (Creator.payoutAccountId) — omitted while no test Connect accounts
      // exist in this environment, so payouts stay in PENDING until then.
      application_fee_amount: product.creator.payoutAccountId ? platformFeeCents : undefined,
      transfer_data: product.creator.payoutAccountId ? { destination: product.creator.payoutAccountId } : undefined,
      metadata: { orderId: order.id },
    },
    metadata: { orderId: order.id },
    success_url: `${origin}/orders/${order.id}?success=1`,
    cancel_url: `${origin}/p/${product.id}`,
  });

  await prisma.order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: checkoutSession.id } });

  redirect(checkoutSession.url!);
}
