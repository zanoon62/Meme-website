/**
 * GET  /api/admin/orders — list all orders (with filters)
 * POST /api/admin/orders — create an order manually (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { count, desc, eq, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { orders, orderItems } from "@/lib/db/schema";
import { toSnakeCaseArray } from "@/lib/db/to-snake-case";
import { demoStore } from "@/lib/demo-store";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export async function GET(req: NextRequest) {
  const rl = await limiters.admin(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Demo mode — return sample orders with line items
  if (!isDatabaseConfigured()) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    let ordersList = demoStore.listOrders();
    if (status && status !== "all") {
      ordersList = ordersList.filter((o) => o.status === status);
    }
    if (q) {
      const lower = q.toLowerCase();
      ordersList = ordersList.filter(
        (o) =>
          o.order_number.toLowerCase().includes(lower) ||
          o.email.toLowerCase().includes(lower) ||
          `${o.shipping_address.first_name} ${o.shipping_address.last_name}`.toLowerCase().includes(lower),
      );
    }
    return NextResponse.json({
      orders: ordersList,
      items: demoStore.listOrderItems(),
      total: ordersList.length,
    });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
    const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

    const whereClause =
      status && status !== "all" ? eq(orders.status, status as OrderStatus) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(orders)
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(orders).where(whereClause),
    ]);

    // Fetch related order items
    const orderIds = rows.map((o) => o.id);
    const items = orderIds.length
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
      : [];

    return NextResponse.json({
      orders: toSnakeCaseArray(rows),
      items: toSnakeCaseArray(items),
      total: countRows[0]?.value ?? 0,
    });
  } catch (e) {
    logger.error("admin orders GET exception", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
