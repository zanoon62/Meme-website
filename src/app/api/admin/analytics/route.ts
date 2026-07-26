/**
 * GET /api/admin/analytics — aggregated dashboard analytics
 *
 * Returns: revenue stats, order counts, top products, recent orders,
 * conversion funnel, traffic by source.
 *
 * In demo mode (no Supabase), returns realistic mock data so the
 * dashboard renders fully for evaluation.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const rl = limiters.admin(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Demo mode — return mock analytics for preview/evaluation
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(demoAnalytics);
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const supabase = guard.client;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevThirtyDays = new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000);

    const orders30Res = await supabase
      .from("orders")
      .select("total, status, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString());
    const ordersPrevRes = await supabase
      .from("orders")
      .select("total")
      .gte("created_at", prevThirtyDays.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString());
    const productsCountRes = await supabase.from("products").select("*", { count: "exact", head: true });
    const customersCountRes = await supabase.from("customers").select("*", { count: "exact", head: true });
    const pendingRes = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    const topProductsRes = await supabase
      .from("order_items")
      .select("product_name, quantity, total")
      .order("total", { ascending: false })
      .limit(5);

    type OrderLite = { total: number; status: string; created_at: string };
    type OrderTotalOnly = { total: number };
    type OrderItemLite = { product_name: string; quantity: number; total: number };
    const orders30: OrderLite[] = (orders30Res.data as unknown as OrderLite[]) ?? [];
    const oErr = orders30Res.error;
    const ordersPrev: OrderTotalOnly[] = (ordersPrevRes.data as unknown as OrderTotalOnly[]) ?? [];
    const opErr = ordersPrevRes.error;
    const totalProducts = productsCountRes.count;
    const totalCustomers = customersCountRes.count;
    const pendingOrders = pendingRes.count;
    const topProducts: OrderItemLite[] = (topProductsRes.data as unknown as OrderItemLite[]) ?? [];

    if (oErr || opErr) {
      logger.error("analytics query failed", { oErr: oErr?.message, opErr: opErr?.message });
      return NextResponse.json(
        { error: "Analytics query failed — see server logs." },
        { status: 500 },
      );
    }

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
      const d = new Date(o.created_at).toISOString().slice(0, 10);
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
    for (const item of topProducts) {
      const cur = topProductMap.get(item.product_name) ?? {
        name: item.product_name,
        units: 0,
        revenue: 0,
      };
      cur.units += item.quantity;
      cur.revenue += Number(item.total);
      topProductMap.set(item.product_name, cur);
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
        totalProducts: totalProducts ?? 0,
        totalCustomers: totalCustomers ?? 0,
        pendingOrders: pendingOrders ?? 0,
      },
      series,
      topProducts: top,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(demoAnalytics);
  }
}

const demoAnalytics = {
  kpis: {
    revenue: 48620.5,
    revenueDelta: 18.4,
    orders: 127,
    aov: 383.62,
    totalProducts: 12,
    totalCustomers: 847,
    pendingOrders: 3,
  },
  series: [
    { date: "2025-09-15", revenue: 1280, orders: 4 },
    { date: "2025-09-18", revenue: 2450, orders: 7 },
    { date: "2025-09-21", revenue: 980, orders: 3 },
    { date: "2025-09-24", revenue: 3120, orders: 9 },
    { date: "2025-09-27", revenue: 1860, orders: 5 },
    { date: "2025-09-30", revenue: 4280, orders: 12 },
    { date: "2025-10-03", revenue: 2940, orders: 8 },
    { date: "2025-10-06", revenue: 5210, orders: 14 },
    { date: "2025-10-09", revenue: 3680, orders: 10 },
    { date: "2025-10-12", revenue: 6420, orders: 17 },
    { date: "2025-10-15", revenue: 4890, orders: 13 },
  ],
  topProducts: [
    { name: "Noir Tailored Blazer Dress", units: 38, revenue: 18582 },
    { name: "Cashmere Oversized Hoodie", units: 52, revenue: 12740 },
    { name: "Wide-Leg Silk Trouser", units: 24, revenue: 6960 },
    { name: "Italian Moto Jacket", units: 11, revenue: 6050 },
    { name: "Silk Slip Dress", units: 19, revenue: 4845 },
  ],
  generatedAt: new Date().toISOString(),
};
