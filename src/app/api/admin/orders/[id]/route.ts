/**
 * PATCH /api/admin/orders/[id] — update order status, tracking, notes
 *
 * Secured by requireAdmin.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  // Demo mode — pretend success
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ success: true, note: "demo mode" });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const { id } = await params;
  const body = await req.json();
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
