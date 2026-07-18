/**
 * POST /api/stripe/webhook — receives Stripe webhook events.
 *
 * Verifies signature using STRIPE_WEBHOOK_SECRET, then handles:
 *   - payment_intent.succeeded: marks the order as paid
 *   - payment_intent.payment_failed: logs failure
 *   - charge.refunded: marks order as refunded
 *
 * NOTE: Stripe requires the raw body — Next.js Route Handlers give us the
 * body via await req.text(). Do NOT parse as JSON first.
 *
 * Configure in Stripe Dashboard → Webhooks → endpoint URL:
 *   https://yourdomain.com/api/stripe/webhook
 * Events to send:
 *   - payment_intent.succeeded
 *   - payment_intent.payment_failed
 *   - charge.refunded
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyStripeWebhook } from "@/lib/stripe/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
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

  if (!isSupabaseServiceConfigured()) {
    // Demo mode — accept but no-op
    return NextResponse.json({ received: true, demo: true });
  }

  const supabase = createSupabaseServiceClient();

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const { data: order } = await supabase
          .from("orders")
          .select("id, status, payment_status, total")
          .eq("payment_intent_id", intent.id)
          .maybeSingle();

        if (!order) {
          logger.info("webhook: no order found for intent", { intentId: intent.id });
          break;
        }

        if (order.payment_status !== "paid") {
          await supabase
            .from("orders")
            .update({
              status: "paid",
              payment_status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", order.id);
          logger.info("order marked paid via webhook", { orderId: order.id });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const { data: order } = await supabase
          .from("orders")
          .select("id, status")
          .eq("payment_intent_id", intent.id)
          .maybeSingle();
        if (order && order.status === "pending") {
          await supabase
            .from("orders")
            .update({
              status: "cancelled",
              payment_status: "failed",
              cancelled_at: new Date().toISOString(),
            })
            .eq("id", order.id);
          logger.warn("order marked failed via webhook", { orderId: order.id });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const intentId =
          typeof charge.payment_intent === "string" ? charge.payment_intent : null;
        if (!intentId) break;
        const { data: order } = await supabase
          .from("orders")
          .select("id, status, payment_status")
          .eq("payment_intent_id", intentId)
          .maybeSingle();
        if (order) {
          await supabase
            .from("orders")
            .update({
              status: "refunded",
              payment_status:
                charge.amount_refunded >= charge.amount
                  ? "refunded"
                  : "partial_refund",
            })
            .eq("id", order.id);
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
