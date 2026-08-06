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

  // No Supabase configured — return empty analytics so the dashboard
  // shows real zeros rather than misleading demo data.
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(emptyAnalytics);
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
