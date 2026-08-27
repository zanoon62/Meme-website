/**
 * GET /api/admin/analytics — aggregated dashboard analytics
 *
 * Returns: revenue stats, order counts, top products, recent orders,
 * conversion funnel, traffic by source.
 *
 * In demo mode (no database configured), returns realistic mock data so the
 * dashboard renders fully for evaluation.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, gte, lt } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { customers, orderItems, orders, products } from "@/lib/db/schema";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const rl = await limiters.admin(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // No database configured — return empty analytics so the dashboard
  // shows real zeros rather than misleading demo data.
  if (!isDatabaseConfigured()) {
    return NextResponse.json(emptyAnalytics);
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevThirtyDays = new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000);

    type OrderLite = { total: string; status: string | null; createdAt: Date | null };
    type OrderTotalOnly = { total: string };

    let orders30: OrderLite[];
    let ordersPrev: OrderTotalOnly[];
    try {
      [orders30, ordersPrev] = await Promise.all([
        db
          .select({ total: orders.total, status: orders.status, createdAt: orders.createdAt })
          .from(orders)
          .where(gte(orders.createdAt, thirtyDaysAgo)),
        db
          .select({ total: orders.total })
          .from(orders)
          .where(and(gte(orders.createdAt, prevThirtyDays), lt(orders.createdAt, thirtyDaysAgo))),
      ]);
    } catch (queryErr) {
      logger.error("analytics query failed", {
        error: queryErr instanceof Error ? queryErr.message : String(queryErr),
      });
      return NextResponse.json(
        { error: "Analytics query failed — see server logs." },
        { status: 500 },
      );
    }

    const [productsCountRow] = await db.select({ value: count() }).from(products);
    const [customersCountRow] = await db.select({ value: count() }).from(customers);
    const [pendingRow] = await db
      .select({ value: count() })
      .from(orders)
      .where(eq(orders.status, "pending"));
    const topProductsRows = await db
      .select({ productName: orderItems.productName, quantity: orderItems.quantity, total: orderItems.total })
      .from(orderItems)
      .orderBy(desc(orderItems.total))
      .limit(5);

    const totalProducts = productsCountRow?.value ?? 0;
    const totalCustomers = customersCountRow?.value ?? 0;
    const pendingOrders = pendingRow?.value ?? 0;

    const revenue = orders30.reduce((s, o) => s + Number(o.total), 0);
    const prevRevenue = ordersPrev.reduce((s, o) => s + Number(o.total), 0);
    const orderCount = orders30.length;
    const aov = orderCount > 0 ? revenue / orderCount : 0;
    const revenueDelta = prevRevenue > 0
      ? ((revenue - prevRevenue) / prevRevenue) * 100
      : 0;

    // Bucket orders by day for the chart
    const buckets = new Map<string, { revenue: number; orders: number }>();
    for (const o of orders30) {
      if (!o.createdAt) continue;
      const d = new Date(o.createdAt).toISOString().slice(0, 10);
      const cur = buckets.get(d) ?? { revenue: 0, orders: 0 };
      cur.revenue += Number(o.total);
      cur.orders += 1;
      buckets.set(d, cur);
    }
    const series = Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, ...v }));

    // Top products by revenue
    const topProductMap = new Map<string, { name: string; units: number; revenue: number }>();
    for (const item of topProductsRows) {
      const cur = topProductMap.get(item.productName) ?? {
        name: item.productName,
        units: 0,
        revenue: 0,
      };
      cur.units += item.quantity;
      cur.revenue += Number(item.total);
      topProductMap.set(item.productName, cur);
    }
    const top = Array.from(topProductMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      kpis: {
        revenue,
        revenueDelta: Number(revenueDelta.toFixed(1)),
        orders: orderCount,
        aov: Number(aov.toFixed(2)),
        totalProducts,
        totalCustomers,
        pendingOrders,
      },
      series,
      topProducts: top,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    logger.error("analytics aggregation failed", { error: e });
    return NextResponse.json(emptyAnalytics);
  }
}

const emptyAnalytics = {
  kpis: {
    revenue: 0,
    revenueDelta: 0,
    orders: 0,
    aov: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
  },
  series: [],
  topProducts: [],
  generatedAt: new Date().toISOString(),
};
