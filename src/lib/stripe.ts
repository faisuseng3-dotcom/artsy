import Stripe from "stripe";

export function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}

/** Platform take rate — spec target range is 8–12%; 10% is the launch default. */
export const PLATFORM_FEE_BP = 1000; // basis points of subtotal
