/**
 * POST /api/admin/reset-store-data — Admin tool to reset all test orders,
 * revenue figures, customer order counts, and analytics back to 0.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { demoStore } from "@/lib/demo-store";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  // 1. Supabase is not configured — reset demo store memory
  if (!isSupabaseServiceConfigured()) {
    demoStore.reset();
    return NextResponse.json({
      ok: true,
      message: "Demo test orders and revenue reset to zero.",
    });
  }

  // 2. Admin Authentication Guard
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const supabase = guard.client;

    // A. Delete all line items
    const { error: itemsErr } = await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (itemsErr) logger.warn("Reset: failed deleting order_items", { error: itemsErr.message });

    // B. Delete all orders
    const { error: ordersErr } = await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (ordersErr) logger.warn("Reset: failed deleting orders", { error: ordersErr.message });

    // C. Reset customer lifetime stats
    const { error: custErr } = await supabase
      .from("customers")
      .update({
        total_orders: 0,
        total_spent: 0,
        last_order_at: null,
      })
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (custErr) logger.warn("Reset: failed resetting customer stats", { error: custErr.message });

    // D. Reset coupon usage
    const { error: couponErr } = await supabase
      .from("coupons")
      .update({ used_count: 0 })
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (couponErr) logger.warn("Reset: failed resetting coupon usage", { error: couponErr.message });

    // E. Reset demoStore in memory if present
    demoStore.reset();

    logger.info("Admin reset store data executed cleanly");

    return NextResponse.json({
      ok: true,
      message: "All test orders, revenue, and analytics reset to zero.",
    });
  } catch (e) {
    logger.error("Reset store data exception", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error during reset" },
      { status: 500 }
    );
  }
}
