/**
 * GET  /api/admin/orders — list all orders (with filters)
 * POST /api/admin/orders — create an order manually (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { demoStore } from "@/lib/demo-store";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const rl = limiters.admin(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Demo mode — return sample orders with line items
  if (!isSupabaseServiceConfigured()) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    let orders = demoStore.listOrders();
    if (status && status !== "all") {
      orders = orders.filter((o) => o.status === status);
    }
    if (q) {
      const lower = q.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.order_number.toLowerCase().includes(lower) ||
          o.email.toLowerCase().includes(lower) ||
          `${o.shipping_address.first_name} ${o.shipping_address.last_name}`.toLowerCase().includes(lower),
      );
    }
    return NextResponse.json({
      orders,
      items: demoStore.listOrderItems(),
      total: orders.length,
    });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const supabase = guard.client;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
    const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

    let query = supabase
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status as "pending" | "paid" | "fulfilled" | "shipped" | "delivered" | "cancelled" | "refunded");
    }

    const { data: orders, error, count } = await query;
    if (error) {
      logger.error("admin orders GET failed", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch related order items
    const orderIds = (orders ?? []).map((o) => o.id);
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);

    return NextResponse.json({
      orders: orders ?? [],
      items: items ?? [],
      total: count ?? 0,
    });
  } catch (e) {
    logger.error("admin orders GET exception", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
