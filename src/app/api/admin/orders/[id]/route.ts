/**
 * PATCH /api/admin/orders/[id] — update order status, tracking, notes
 *
 * Secured by requireAdmin. In demo mode, persists to in-memory store.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { demoStore } from "@/lib/demo-store";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // Demo mode — persist to in-memory store
  if (!isSupabaseServiceConfigured()) {
    const updated = demoStore.updateOrder(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order: updated, success: true });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const supabase = guard.client;

  // Auto-set timestamp fields based on status changes
  const update: Record<string, unknown> = { ...body };
  if (body.status === "paid" && !body.paid_at) update.paid_at = new Date().toISOString();
  if (body.status === "fulfilled" && !body.fulfilled_at)
    update.fulfilled_at = new Date().toISOString();
  if (body.status === "shipped" && !body.shipped_at)
    update.shipped_at = new Date().toISOString();
  if (body.status === "delivered" && !body.delivered_at)
    update.delivered_at = new Date().toISOString();
  if (body.status === "cancelled" && !body.cancelled_at)
    update.cancelled_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("orders")
    .update(update as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logger.warn("order update failed", { id, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  logger.info("order updated", { id, status: body.status, by: guard.userId });
  return NextResponse.json({ order: data });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  if (!isSupabaseServiceConfigured()) {
    const order = demoStore.listOrders().find((o) => o.id === id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const items = demoStore.listOrderItems().filter((i) => i.order_id === id);
    return NextResponse.json({ order, items });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const supabase = guard.client;
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  return NextResponse.json({ order, items: items ?? [] });
}
