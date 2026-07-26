/**
 * POST /api/checkout/payment-intent — create a Stripe PaymentIntent.
 *
 * Body: { lines: CartLine[], shipping_method, coupon_code?, email }
 * Returns: { client_secret, payment_intent_id } — pass to Stripe.js on the client.
 *
 * In demo mode (no Stripe configured), returns a fake client_secret so the
 * frontend can still proceed to /api/checkout (which will return a demo order).
 */

import { NextRequest, NextResponse } from "next/server";
import { createPaymentIntent, isStripeConfigured } from "@/lib/stripe/server";
import { CheckoutPayloadSchema } from "@/lib/checkout/types";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const rl = limiters.checkout(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Reuse the checkout payload schema but only need lines + shipping + coupon
  const parsed = CheckoutPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const subtotal = parsed.data.lines.reduce(
    (s, l) => s + l.price * l.quantity,
    0,
  );

  if (!isStripeConfigured()) {
    return NextResponse.json({
      demo: true,
      client_secret: "demo_secret_no_stripe_configured",
      payment_intent_id: `demo_pi_${Date.now()}`,
      amount: subtotal,
    });
  }

  const intent = await createPaymentIntent({
    amount: subtotal,
    currency: "usd",
    description: `MEME Atelier order — ${parsed.data.email}`,
    metadata: {
      email: parsed.data.email,
      line_count: String(parsed.data.lines.length),
      coupon: parsed.data.coupon_code ?? "",
    },
  });

  if (!intent) {
    logger.error("PaymentIntent creation returned null");
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    client_secret: intent.client_secret,
    payment_intent_id: intent.id,
    amount: subtotal,
  });
}
