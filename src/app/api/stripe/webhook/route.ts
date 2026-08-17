import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const orderId = checkoutSession.metadata?.orderId;
    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (order && order.status === "PENDING_PAYMENT") {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: orderId },
            data: {
              status: "PAID",
              stripePaymentIntentId:
                typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : undefined,
            },
          }),
          prisma.payment.create({
            data: {
              orderId,
              status: "SUCCEEDED",
              amountCents: order.totalCents,
              currency: order.currency,
            },
          }),
          prisma.payout.create({
            data: {
              orderId,
              creatorId: order.creatorId,
              amountCents: order.totalCents - order.platformFeeCents,
              status: "PENDING",
            },
          }),
          ...order.items.flatMap((item) => [
            prisma.product.update({
              where: { id: item.productId },
              data: { status: "SOLD", quantitySold: { increment: item.quantity } },
            }),
          ]),
          prisma.creatorStats.updateMany({
            where: { creatorId: order.creatorId },
            data: { salesCount: { increment: 1 }, activeListings: { decrement: order.items.length } },
          }),
        ]);

        const buyer = await prisma.user.findUnique({ where: { id: order.buyerId } });
        const creator = await prisma.creator.findUnique({ where: { id: order.creatorId } });
        if (creator) {
          await prisma.notification.create({
            data: {
              userId: creator.userId,
              type: "PRODUCT_SOLD",
              title: "You made a sale",
              body: buyer ? `${buyer.name} just bought your work.` : undefined,
              linkUrl: "/sell",
            },
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
