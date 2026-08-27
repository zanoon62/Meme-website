/**
 * POST /api/stripe/webhook — receives Stripe webhook events.
 *
 * Verifies signature using STRIPE_WEBHOOK_SECRET, then handles:
 *   - payment_intent.succeeded: marks the order as paid
 *   - payment_intent.payment_failed: logs failure
 *   - charge.refunded: marks order as refunded
 *
 * NOTE: Stripe requires the raw body — Next.js Route Handlers give us the
 * body via await req.text(). Do NOT parse as JSON first. The Nginx reverse
 * proxy in front of this route must not buffer/transform the request body
 * (see docs/VPS_DEPLOYMENT.md once written).
 *
 * Configure in Stripe Dashboard → Webhooks → endpoint URL:
 *   https://yourdomain.com/api/stripe/webhook
 * Events to send:
 *   - payment_intent.succeeded
 *   - payment_intent.payment_failed
 *   - charge.refunded
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { verifyStripeWebhook } from "@/lib/stripe/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  const event = verifyStripeWebhook(rawBody, signature);
  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  logger.info("stripe webhook received", { type: event.type, id: event.id });

  if (!isDatabaseConfigured()) {
    // Demo mode — accept but no-op
    return NextResponse.json({ received: true, demo: true });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const [order] = await db
          .select({ id: orders.id, status: orders.status, paymentStatus: orders.paymentStatus })
          .from(orders)
          .where(eq(orders.paymentIntentId, intent.id))
          .limit(1);

        if (!order) {
          logger.info("webhook: no order found for intent", { intentId: intent.id });
          break;
        }

        if (order.paymentStatus !== "paid") {
          await db
            .update(orders)
            .set({ status: "paid", paymentStatus: "paid", paidAt: new Date() })
            .where(eq(orders.id, order.id));
          logger.info("order marked paid via webhook", { orderId: order.id });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const [order] = await db
          .select({ id: orders.id, status: orders.status })
          .from(orders)
          .where(eq(orders.paymentIntentId, intent.id))
          .limit(1);

        if (order && order.status === "pending") {
          await db
            .update(orders)
            .set({ status: "cancelled", paymentStatus: "failed", cancelledAt: new Date() })
            .where(eq(orders.id, order.id));
          logger.warn("order marked failed via webhook", { orderId: order.id });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
        if (!intentId) break;

        const [order] = await db
          .select({ id: orders.id })
          .from(orders)
          .where(eq(orders.paymentIntentId, intentId))
          .limit(1);

        if (order) {
          await db
            .update(orders)
            .set({
              status: "refunded",
              paymentStatus: charge.amount_refunded >= charge.amount ? "refunded" : "partial_refund",
            })
            .where(eq(orders.id, order.id));
          logger.info("order marked refunded via webhook", { orderId: order.id });
        }
        break;
      }

      default:
        logger.debug("stripe webhook unhandled event", { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error("stripe webhook handler failed", {
      type: event.type,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
