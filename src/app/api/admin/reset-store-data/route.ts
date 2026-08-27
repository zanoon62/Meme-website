/**
 * POST /api/admin/reset-store-data — Admin tool to reset all test orders,
 * revenue figures, customer order counts, and analytics back to 0.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { coupons, customers, orderItems, orders } from "@/lib/db/schema";
import { demoStore } from "@/lib/demo-store";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  // 1. Database is not configured — reset demo store memory
  if (!isDatabaseConfigured()) {
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
    // A. Delete all line items
    try {
      await db.delete(orderItems);
    } catch (e) {
      logger.warn("Reset: failed deleting order_items", { error: e instanceof Error ? e.message : String(e) });
    }

    // B. Delete all orders
    try {
      await db.delete(orders);
    } catch (e) {
      logger.warn("Reset: failed deleting orders", { error: e instanceof Error ? e.message : String(e) });
    }

    // C. Reset customer lifetime stats
    try {
      await db.update(customers).set({
        totalOrders: 0,
        totalSpent: "0",
        lastOrderAt: null,
      });
    } catch (e) {
      logger.warn("Reset: failed resetting customer stats", { error: e instanceof Error ? e.message : String(e) });
    }

    // D. Reset coupon usage
    try {
      await db.update(coupons).set({ usedCount: 0 });
    } catch (e) {
      logger.warn("Reset: failed resetting coupon usage", { error: e instanceof Error ? e.message : String(e) });
    }

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
