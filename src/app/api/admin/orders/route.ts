/**
 * GET  /api/admin/orders — list all orders (with filters)
 * POST /api/admin/orders — create an order manually (admin only)
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

  // Demo mode — return sample orders for preview/evaluation only
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ orders: demoOrders, items: [], total: demoOrders.length });
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

// Demo orders used when Supabase is not configured (still returned in demo mode)
const demoOrders = [
  {
    id: "demo-o-1",
    order_number: "MEME-250101-000001",
    customer_id: null,
    email: "sophia.l@example.com",
    status: "delivered",
    payment_status: "paid",
    fulfillment_status: "fulfilled",
    subtotal: 14500,
    discount_total: 0,
    shipping_total: 0,
    tax_total: 2030,
    total: 16530,
    currency: "EGP",
    coupon_code: null,
    shipping_address: {
      first_name: "Salma",
      last_name: "Ahmed",
      address1: "12 Taha Hussein St., Zamalek",
      city: "Cairo",
      state: "Cairo",
      postal_code: "11211",
      country: "EG",
    },
    placed_at: "2025-09-14T10:30:00Z",
    paid_at: "2025-09-14T10:30:00Z",
    delivered_at: "2025-09-17T16:00:00Z",
    created_at: "2025-09-14T10:30:00Z",
  },
  {
    id: "demo-o-2",
    order_number: "MEME-250103-000002",
    customer_id: null,
    email: "nour.k@example.com",
    status: "shipped",
    payment_status: "paid",
    fulfillment_status: "fulfilled",
    subtotal: 7800,
    discount_total: 780,
    shipping_total: 0,
    tax_total: 983,
    total: 8003,
    currency: "EGP",
    coupon_code: "ATELIER10",
    placed_at: "2025-10-02T14:20:00Z",
    paid_at: "2025-10-02T14:20:00Z",
    shipped_at: "2025-10-03T09:00:00Z",
    created_at: "2025-10-02T14:20:00Z",
  },
  {
    id: "demo-o-3",
    order_number: "MEME-250105-000003",
    customer_id: null,
    email: "margot.r@example.com",
    status: "pending",
    payment_status: "awaiting",
    fulfillment_status: "unfulfilled",
    subtotal: 38500,
    discount_total: 0,
    shipping_total: 75,
    tax_total: 5390,
    total: 43965,
    currency: "EGP",
    coupon_code: null,
    placed_at: "2025-10-12T08:45:00Z",
    created_at: "2025-10-12T08:45:00Z",
  },
];
