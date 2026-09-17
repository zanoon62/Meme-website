/**
 * PATCH /api/admin/orders/[id] — update order status, tracking, notes
 *
 * Secured by requireAdmin. In demo mode, persists to in-memory store.
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { orders, orderItems } from "@/lib/db/schema";
import { toSnakeCase, toSnakeCaseArray } from "@/lib/db/to-snake-case";
import { demoStore } from "@/lib/demo-store";
import { publishRealtimeEvent } from "@/lib/realtime/publish";
import { isResendConfigured, sendOrderConfirmationEmail } from "@/lib/email";
import { PAYMENT_METHODS } from "@/lib/format";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

/** snake_case body key -> camelCase Drizzle column key, for the `orders` table. */
function toCamelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // Demo mode — persist to in-memory store
  if (!isDatabaseConfigured()) {
    const updated = demoStore.updateOrder(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order: updated, success: true });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  // Auto-set timestamp fields based on status changes. These must be real
  // Date objects, not ISO strings — Drizzle's timestamp columns call
  // .toISOString() on the value, so a string here throws and the whole
  // update 400s (which is what silently broke every admin status change).
  const now = new Date();
  const rawUpdate: Record<string, unknown> = { ...body };
  if (body.status === "paid" && !body.paid_at) rawUpdate.paid_at = now;
  if (body.status === "fulfilled" && !body.fulfilled_at) rawUpdate.fulfilled_at = now;
  if (body.status === "shipped" && !body.shipped_at) rawUpdate.shipped_at = now;
  if (body.status === "delivered" && !body.delivered_at) rawUpdate.delivered_at = now;
  if (body.status === "cancelled" && !body.cancelled_at) rawUpdate.cancelled_at = now;

  // "Confirm order" — the one action an admin takes after reviewing a new
  // order. It accepts the order and, for prepaid methods (InstaPay/Vodafone),
  // also records that the transfer was verified. COD orders are accepted the
  // same way but stay payment_status "awaiting" until the courier collects
  // the cash, because no money has actually changed hands yet.
  if (body.status === "paid") {
    rawUpdate.payment_confirmed_at = now;
    rawUpdate.payment_confirmed_by = guard.userId;

    const [existing] = await db
      .select({ paymentMethod: orders.paymentMethod })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (existing?.paymentMethod === "cod") {
      // Accepted, but the cash arrives on delivery — don't claim it's paid.
      rawUpdate.payment_status = "awaiting";
      delete rawUpdate.paid_at;
    } else {
      rawUpdate.payment_status = "paid";
    }
  }

  // Cash collected on delivery — settle a COD order's payment at that point.
  if (body.status === "delivered") {
    const [existing] = await db
      .select({ paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (existing?.paymentMethod === "cod" && existing.paymentStatus !== "paid") {
      rawUpdate.payment_status = "paid";
      rawUpdate.paid_at = now;
    }
  }

  // A cancelled order's payment is no longer expected to arrive.
  if (body.status === "cancelled" && !body.payment_status) {
    rawUpdate.payment_status = "failed";
  }

  // Shipping/delivering implies the goods went out, so keep
  // fulfillment_status coherent rather than leaving it "unfulfilled" forever.
  if (
    (body.status === "shipped" || body.status === "delivered" || body.status === "fulfilled") &&
    !body.fulfillment_status
  ) {
    rawUpdate.fulfillment_status = "fulfilled";
  }

  // Any caller-supplied timestamp still arrives as an ISO string over JSON —
  // coerce those too, for the same reason as above.
  for (const key of [
    "paid_at",
    "fulfilled_at",
    "shipped_at",
    "delivered_at",
    "cancelled_at",
    "payment_confirmed_at",
  ]) {
    const value = rawUpdate[key];
    if (typeof value === "string") rawUpdate[key] = new Date(value);
  }

  // Never let a client overwrite identity/audit columns directly.
  delete rawUpdate.id;
  delete rawUpdate.order_number;
  delete rawUpdate.created_at;

  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawUpdate)) {
    update[toCamelKey(key)] = value;
  }
  update.updatedAt = now;

  try {
    const [row] = await db.update(orders).set(update).where(eq(orders.id, id)).returning();

    if (!row) {
      logger.warn("order update failed", { id, error: "not found" });
      return NextResponse.json({ error: "Order not found" }, { status: 400 });
    }

    logger.info("order updated", { id, status: body.status, by: guard.userId });
    if (body.status !== undefined) {
      publishRealtimeEvent("order.status_changed", {
        orderId: row.id,
        orderNumber: row.orderNumber,
        customerId: row.customerId,
        newStatus: row.status,
      }).catch(() => {});
    }

    // Admin just confirmed an InstaPay/Vodafone transfer — send the order
    // confirmation email now (COD already got its email at checkout time).
    // Wrapped so an email/DB hiccup here can never fail the status change
    // the admin actually asked for — the order is already updated above.
    try {
    if (body.status === "paid" && !row.confirmationEmailSentAt && isResendConfigured()) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, row.id));
      const method = PAYMENT_METHODS.find((m) => m.id === row.paymentMethod);
      const addr = (row.shippingAddress ?? { city: "" }) as { city: string; [key: string]: unknown };
      sendOrderConfirmationEmail({
        orderNumber: row.orderNumber,
        recipientEmail: row.email,
        lines: items.map((it) => ({
          name: it.productName,
          quantity: it.quantity,
          price: Number(it.unitPrice),
          size: it.variantSize ?? undefined,
          color: it.variantColor ?? undefined,
          image: it.productImage ?? undefined,
        })),
        subtotal: Number(row.subtotal),
        discountTotal: Number(row.discountTotal),
        couponCode: row.couponCode ?? undefined,
        shippingTotal: Number(row.shippingTotal),
        paymentMethodName: method?.name,
        total: Number(row.total),
        shippingAddress: addr,
        customerNote: row.customerNote ?? undefined,
      }).catch((err) => {
        logger.error("Failed to send payment-confirmed order email", { error: err, orderId: row.id });
      });
      await db
        .update(orders)
        .set({ confirmationEmailSentAt: new Date() })
        .where(eq(orders.id, row.id));
    }
    } catch (emailErr) {
      logger.error("post-confirm email step failed (order status still updated)", {
        orderId: row.id,
        error: emailErr instanceof Error ? emailErr.message : String(emailErr),
      });
    }

    return NextResponse.json({ order: toSnakeCase(row) });
  } catch (e) {
    logger.error("order update failed", {
      id,
      by: guard.userId,
      attemptedStatus: body.status,
      fields: Object.keys(update),
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 400 },
    );
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  if (!isDatabaseConfigured()) {
    const order = demoStore.listOrders().find((o) => o.id === id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const items = demoStore.listOrderItems().filter((i) => i.order_id === id);
    return NextResponse.json({ order, items });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

    return NextResponse.json({ order: toSnakeCase(order), items: toSnakeCaseArray(items) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 404 },
    );
  }
}
