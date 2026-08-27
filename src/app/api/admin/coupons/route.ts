/**
 * GET  /api/admin/coupons — list all coupons
 * POST /api/admin/coupons — create a coupon
 */

import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { coupons } from "@/lib/db/schema";
import { toSnakeCase, toSnakeCaseArray } from "@/lib/db/to-snake-case";
import { demoStore } from "@/lib/demo-store";
import { logger } from "@/lib/logger";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ coupons: demoStore.listCoupons() });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    return NextResponse.json({ coupons: toSnakeCaseArray(rows) });
  } catch (e) {
    logger.error("coupons GET failed", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ coupons: [] });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    code?: string;
    type?: "percent" | "fixed" | "shipping";
    value?: number;
    min_subtotal?: number;
    usage_limit?: number;
  };

  if (!body.code || !body.type || body.value === undefined) {
    return NextResponse.json(
      { error: "Missing required fields: code, type, value" },
      { status: 400 },
    );
  }

  if (!isDatabaseConfigured()) {
    const cp = demoStore.createCoupon({
      code: body.code.toUpperCase(),
      type: body.type,
      value: Number(body.value),
      min_subtotal: body.min_subtotal,
      usage_limit: body.usage_limit,
    });
    return NextResponse.json({ coupon: cp }, { status: 201 });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const [row] = await db
      .insert(coupons)
      .values({
        code: body.code.toUpperCase(),
        type: body.type,
        value: Number(body.value).toFixed(2),
        minSubtotal: (Number(body.min_subtotal) || 0).toFixed(2),
        maxUses: body.usage_limit ?? null,
      })
      .returning();

    logger.info("coupon created", { id: row.id, code: row.code, by: guard.userId });
    return NextResponse.json({ coupon: toSnakeCase(row) }, { status: 201 });
  } catch (e) {
    logger.warn("coupon create failed", {
      error: e instanceof Error ? e.message : String(e),
      code: body.code,
    });
    const cp = demoStore.createCoupon({
      code: body.code.toUpperCase(),
      type: body.type,
      value: Number(body.value),
      min_subtotal: body.min_subtotal,
      usage_limit: body.usage_limit,
    });
    return NextResponse.json({ coupon: cp }, { status: 201 });
  }
}
