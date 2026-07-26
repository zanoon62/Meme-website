/**
 * POST /api/checkout — create an order (called after Stripe payment confirmed)
 *
 * Flow:
 *   1. Client → POST /api/checkout/payment-intent → returns client_secret
 *   2. Client confirms payment with Stripe.js
 *   3. Client → POST /api/checkout with payment_intent_id → server verifies,
 *      creates order, decrements inventory
 *
 * Body: CheckoutPayload (see src/lib/checkout/types.ts)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CheckoutPayloadSchema } from "@/lib/checkout/types";
import { checkInventory, createOrder } from "@/lib/checkout/server";
import { retrievePaymentIntent } from "@/lib/stripe/server";
import { isStripeConfigured } from "@/lib/stripe/server";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const rl = limiters.checkout(req);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a minute." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  // Parse & validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CheckoutPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid checkout payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const payload = parsed.data;

  // Supabase not configured — return a fake success for demo purposes
  if (!isSupabaseServiceConfigured()) {
    const orderNumber = `MEME-${Date.now().toString(36).toUpperCase()}`;
    return NextResponse.json({
      ok: true,
      demo: true,
      order: {
        id: `demo-${Date.now()}`,
        order_number: orderNumber,
        total: payload.lines.reduce((s, l) => s + l.price * l.quantity, 0),
        subtotal: payload.lines.reduce((s, l) => s + l.price * l.quantity, 0),
        discount_total: 0,
        shipping_total: 75,
        tax_total: 0,
        currency: "EGP",
      },
    });
  }

  const supabase = createSupabaseServiceClient();

  // 1. Inventory check
  const inv = await checkInventory(supabase, payload.lines);
  if (!inv.ok) {
    return NextResponse.json(
      {
        error: "Some items are out of stock",
        failures: inv.failures,
      },
      { status: 409 },
    );
  }

  // 2. Verify Stripe payment (if a payment_intent_id is provided)
  if (isStripeConfigured() && payload.payment_intent_id) {
    const intent = await retrievePaymentIntent(payload.payment_intent_id);
    if (!intent) {
      return NextResponse.json(
        { error: "Payment verification failed — intent not found." },
        { status: 400 },
      );
    }
    if (intent.status !== "succeeded") {
      return NextResponse.json(
        { error: `Payment not completed (status: ${intent.status}).` },
        { status: 402 },
      );
    }
    // Verify amount matches cart total (basic anti-tampering)
    const expectedTotal = payload.lines.reduce((s, l) => s + l.price * l.quantity, 0);
    if (intent.amount !== Math.round(expectedTotal * 100)) {
      logger.warn("Payment amount mismatch", {
        intentAmount: intent.amount,
        expected: Math.round(expectedTotal * 100),
      });
      return NextResponse.json(
        { error: "Payment amount mismatch — please contact support." },
        { status: 400 },
      );
    }
  }

  // 3. Identify customer (if logged in)
  let customerId: string | undefined;
  try {
    const serverClient = await createSupabaseServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (user) {
      const { data: cust } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (cust) customerId = cust.id;
    }
  } catch {
    // Not logged in — guest checkout, fine
  }

  // 4. Create the order
  const result = await createOrder(supabase, {
    email: payload.email,
    lines: payload.lines,
    shipping_address: payload.shipping_address,
    shipping_method: payload.shipping_method,
    coupon_code: payload.coupon_code,
    customer_note: payload.customer_note,
    customer_id: customerId,
    payment_intent_id: payload.payment_intent_id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // 5. If Stripe is configured & payment was verified, mark order as paid
  if (isStripeConfigured() && payload.payment_intent_id) {
    await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", result.order.id);
  }

  return NextResponse.json({ ok: true, order: result.order });
}
