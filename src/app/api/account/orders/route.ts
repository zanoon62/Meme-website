/**
 * GET /api/account/orders — returns the current logged-in customer's own orders.
 *
 * Requires a valid session cookie.
 * Returns [] if not authenticated or the database is not configured.
 */

import { NextRequest, NextResponse } from "next/server";
import { desc, eq, ilike, inArray, or } from "drizzle-orm";
import { requireCustomerSession } from "@/lib/auth/customer-guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { orderItems, orders } from "@/lib/db/schema";
import { toSnakeCase } from "@/lib/db/to-snake-case";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const rl = await limiters.public(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ orders: [], demo: true });
  }

  try {
    const guard = await requireCustomerSession();
    if (!guard.ok) return guard.error;

    // Match orders linked to this customer, or guest-checkout orders placed
    // with the same email (these get backfilled with customer_id below).
    const rows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerId: orders.customerId,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        fulfillmentStatus: orders.fulfillmentStatus,
        subtotal: orders.subtotal,
        discountTotal: orders.discountTotal,
        shippingTotal: orders.shippingTotal,
        taxTotal: orders.taxTotal,
        total: orders.total,
        currency: orders.currency,
        shippingAddress: orders.shippingAddress,
        shippingMethod: orders.shippingMethod,
        placedAt: orders.placedAt,
        shippedAt: orders.shippedAt,
        deliveredAt: orders.deliveredAt,
        trackingNumber: orders.trackingNumber,
        trackingUrl: orders.trackingUrl,
      })
      .from(orders)
      .where(or(eq(orders.customerId, guard.customerId), ilike(orders.email, guard.email)))
      .orderBy(desc(orders.placedAt))
      .limit(50);

    const orderIds = rows.map((r) => r.id);
    const itemsByOrder = new Map<string, Record<string, unknown>[]>();

    if (orderIds.length > 0) {
      const items = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productName: orderItems.productName,
          productSlug: orderItems.productSlug,
          productImage: orderItems.productImage,
          variantColor: orderItems.variantColor,
          variantSize: orderItems.variantSize,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          total: orderItems.total,
        })
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds));

      for (const item of items) {
        const orderId = item.orderId;
        if (!orderId) continue;
        const { orderId: _drop, ...rest } = item;
        const list = itemsByOrder.get(orderId) ?? [];
        list.push(toSnakeCase(rest));
        itemsByOrder.set(orderId, list);
      }
    }

    // Backfill customer_id on unlinked orders matching this customer
    // (fire-and-forget, same as the previous behavior).
    const unlinkedIds = rows.filter((o) => !o.customerId).map((o) => o.id);
    if (unlinkedIds.length > 0) {
      db.update(orders)
        .set({ customerId: guard.customerId })
        .where(inArray(orders.id, unlinkedIds))
        .catch((updateErr: unknown) => {
          logger.warn("Failed to backfill customer_id on orders", {
            error: updateErr instanceof Error ? updateErr.message : String(updateErr),
          });
        });
    }

    const result = rows.map((r) => {
      const { customerId: _drop, ...rest } = r;
      return {
        ...toSnakeCase(rest),
        order_items: itemsByOrder.get(r.id) ?? [],
      };
    });

    return NextResponse.json({ orders: result });
  } catch (e) {
    logger.error("account orders exception", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
