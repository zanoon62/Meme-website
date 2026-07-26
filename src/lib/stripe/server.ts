/**
 * Stripe helper — server-only.
 *
 * - Lazily inits Stripe with the secret key.
 * - Provides typed helpers for: creating PaymentIntents, retrieving them,
 *   verifying webhook signatures.
 *
 * Never import this from a Client Component — server-only.
 */

import Stripe from "stripe";
import { logger } from "@/lib/logger";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!_stripe) {
    _stripe = new Stripe(key, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Construct a Stripe Event from a raw webhook body, verifying the signature. */
export function verifyStripeWebhook(
  body: string | Buffer,
  signature: string,
): Stripe.Event | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripe();
  if (!stripe || !secret) {
    logger.error("Stripe webhook secret not configured");
    return null;
  }
  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    logger.warn("Stripe webhook signature verification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Create a PaymentIntent for the given amount (in major currency units, e.g. USD).
 * Returns the client_secret for the frontend to confirm with Stripe.js.
 */
export async function createPaymentIntent(params: {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
  description?: string;
}): Promise<{ client_secret: string; id: string } | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(params.amount * 100), // cents
    currency: params.currency ?? "usd",
    automatic_payment_methods: { enabled: true },
    metadata: params.metadata,
    description: params.description,
  });
  return { client_secret: intent.client_secret!, id: intent.id };
}

export async function retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  try {
    return await stripe.paymentIntents.retrieve(id);
  } catch (err) {
    logger.error("Failed to retrieve PaymentIntent", { id, error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
