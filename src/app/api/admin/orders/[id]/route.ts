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

  // Auto-set timestamp fields based on status changes (same rule as before,
  // keyed on the snake_case body — converted to camelCase columns below).
  const rawUpdate: Record<string, unknown> = { ...body };
  if (body.status === "paid" && !body.paid_at) rawUpdate.paid_at = new Date().toISOString();
  if (body.status === "fulfilled" && !body.fulfilled_at)
    rawUpdate.fulfilled_at = new Date().toISOString();
  if (body.status === "shipped" && !body.shipped_at)
    rawUpdate.shipped_at = new Date().toISOString();
  if (body.status === "delivered" && !body.delivered_at)
    rawUpdate.delivered_at = new Date().toISOString();
  if (body.status === "cancelled" && !body.cancelled_at)
    rawUpdate.cancelled_at = new Date().toISOString();

  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawUpdate)) {
    update[toCamelKey(key)] = value;
  }

  try {
    const [row] = await db.update(orders).set(update).where(eq(orders.id, id)).returning();

    if (!row) {
      logger.warn("order update failed", { id, error: "not found" });
      return NextResponse.json({ error: "Order not found" }, { status: 400 });
    }

    logger.info("order updated", { id, status: body.status, by: guard.userId });
    return NextResponse.json({ order: toSnakeCase(row) });
  } catch (e) {
    logger.warn("order update failed", { id, error: e instanceof Error ? e.message : String(e) });
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
