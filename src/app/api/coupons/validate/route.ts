/**
 * POST /api/coupons/validate — validate a coupon code against a cart subtotal.
 *
 * Body: { code: string, subtotal: number }
 * Returns: { ok: true, discount, type, value } | { ok: false, reason }
 *
 * Read-only: does NOT increment used_count — that happens at order
 * completion time in the checkout flow.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { coupons } from "@/lib/db/schema";
import { limiters } from "@/lib/rate-limit";

const Schema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().nonnegative().default(0),
});

export async function POST(req: NextRequest) {
  const rl = await limiters.public(req);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!isDatabaseConfigured()) {
    // Demo: accept ATELIER10 as 10% off
    if (parsed.data.code.toUpperCase() === "ATELIER10") {
      return NextResponse.json({
        ok: true,
        discount: Math.round(parsed.data.subtotal * 0.1 * 100) / 100,
        type: "percent",
        value: 10,
      });
    }
    return NextResponse.json({ ok: false, reason: "invalid" });
  }

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.code, parsed.data.code.toUpperCase()), eq(coupons.isActive, true)))
    .limit(1);

  if (!coupon) {
    return NextResponse.json({ ok: false, reason: "invalid" });
  }

  const now = new Date();
  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    return NextResponse.json({ ok: false, reason: "not_started" });
  }
  if (coupon.endsAt && new Date(coupon.endsAt) < now) {
    return NextResponse.json({ ok: false, reason: "expired" });
  }
  if (coupon.maxUses && (coupon.usedCount ?? 0) >= coupon.maxUses) {
    return NextResponse.json({ ok: false, reason: "max_uses_reached" });
  }
  if (coupon.minSubtotal && parsed.data.subtotal < Number(coupon.minSubtotal)) {
    return NextResponse.json({ ok: false, reason: "min_subtotal_not_met" });
  }

  let discount = 0;
  if (coupon.type === "percent") {
    discount = (parsed.data.subtotal * Number(coupon.value)) / 100;
  } else if (coupon.type === "fixed") {
    discount = Number(coupon.value);
  }

  return NextResponse.json({
    ok: true,
    discount: Math.round(discount * 100) / 100,
    type: coupon.type,
    value: Number(coupon.value),
    free_shipping: coupon.type === "shipping",
  });
}
