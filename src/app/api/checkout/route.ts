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
import { eq, ilike } from "drizzle-orm";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { customers, orders } from "@/lib/db/schema";
import { getCurrentSession } from "@/lib/auth/session";
import { CheckoutPayloadSchema } from "@/lib/checkout/types";
import { checkInventory, createOrder } from "@/lib/checkout/server";
import { retrievePaymentIntent } from "@/lib/stripe/server";
import { isStripeConfigured } from "@/lib/stripe/server";
import { isResendConfigured, sendOrderConfirmationEmail } from "@/lib/email";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const rl = await limiters.checkout(req);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a minute." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

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

  // Database not configured — return a fake success for demo purposes
  if (!isDatabaseConfigured()) {
    const orderNumber = `MEME-${Date.now().toString(36).toUpperCase()}`;
    const total = payload.lines.reduce((s, l) => s + l.price * l.quantity, 0) + 75;

    if (isResendConfigured()) {
      sendOrderConfirmationEmail({
        orderNumber,
        recipientEmail: payload.email,
        lines: payload.lines,
        total,
        shippingAddress: payload.shipping_address,
        shippingMethod: payload.shipping_method,
      }).catch((err) => {
        logger.error("Failed to send demo order confirmation email", { error: err });
      });
    }

    return NextResponse.json({
      ok: true,
      demo: true,
      order: {
        id: `demo-${Date.now()}`,
        order_number: orderNumber,
        total,
        subtotal: payload.lines.reduce((s, l) => s + l.price * l.quantity, 0),
        discount_total: 0,
        shipping_total: 75,
        tax_total: 0,
        currency: "EGP",
      },
    });
  }

  // 1. Inventory check
  const inv = await checkInventory(payload.lines);
  if (!inv.ok) {
    return NextResponse.json({ error: "Some items are out of stock", failures: inv.failures }, { status: 409 });
  }

  // 2. Verify Stripe payment (if a payment_intent_id is provided)
  if (isStripeConfigured() && payload.payment_intent_id) {
    const intent = await retrievePaymentIntent(payload.payment_intent_id);
    if (!intent) {
      return NextResponse.json({ error: "Payment verification failed — intent not found." }, { status: 400 });
    }
    if (intent.status !== "succeeded") {
      return NextResponse.json({ error: `Payment not completed (status: ${intent.status}).` }, { status: 402 });
    }
    const expectedTotal = payload.lines.reduce((s, l) => s + l.price * l.quantity, 0);
    if (intent.amount !== Math.round(expectedTotal * 100)) {
      logger.warn("Payment amount mismatch", {
        intentAmount: intent.amount,
        expected: Math.round(expectedTotal * 100),
      });
      return NextResponse.json({ error: "Payment amount mismatch — please contact support." }, { status: 400 });
    }
  }

  // 3. Identify customer (if logged in or matching email) — guest checkout is fine.
  let customerId: string | undefined;
  try {
    const { user } = await getCurrentSession();
    if (user) {
      const [cust] = await db.select({ id: customers.id }).from(customers).where(eq(customers.userId, user.id)).limit(1);
      if (cust) customerId = cust.id;
    }
    if (!customerId && payload.email) {
      const [cust] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(ilike(customers.email, payload.email))
        .limit(1);
      if (cust) customerId = cust.id;
    }
  } catch {
    // Not logged in — guest checkout, fine
  }

  // 4. Create the order
  const result = await createOrder({
    email: payload.email,
    lines: payload.lines,
    shipping_address: payload.shipping_address,
    shipping_method: payload.shipping_method,
    shipping_zone_id: payload.shipping_zone_id,
    payment_method_id: payload.payment_method_id,
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
    await db
      .update(orders)
      .set({ status: "paid", paymentStatus: "paid", paidAt: new Date() })
      .where(eq(orders.id, result.order.id));
  }

  // 6. Send order confirmation email via Resend (non-blocking)
  if (isResendConfigured()) {
    sendOrderConfirmationEmail({
      orderNumber: result.order.order_number,
      recipientEmail: payload.email,
      lines: payload.lines,
      subtotal: result.order.subtotal,
      discountTotal: result.order.discount_total,
      couponCode: result.order.coupon_code,
      shippingTotal: result.order.shipping_total,
      shippingZoneName: result.order.shipping_zone_name,
      vatTotal: result.order.vat_total,
      paymentFee: result.order.payment_fee,
      paymentMethodName: result.order.payment_method_name,
      total: result.order.total,
      shippingAddress: payload.shipping_address,
      customerNote: payload.customer_note,
    }).catch((err) => {
      logger.error("Failed to send order confirmation email", { error: err });
    });
  }

  return NextResponse.json({ ok: true, order: result.order });
}
