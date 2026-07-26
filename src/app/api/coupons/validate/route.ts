/**
 * POST /api/coupons/validate — validate a coupon code against a cart subtotal.
 *
 * Body: { code: string, subtotal: number }
 * Returns: { ok: true, discount, type, value } | { ok: false, reason }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { limiters } from "@/lib/rate-limit";

const Schema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().nonnegative().default(0),
});

export async function POST(req: NextRequest) {
  const rl = limiters.public(req);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
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

  const supabase = await createSupabaseServerClient();
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", parsed.data.code.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error || !coupon) {
    return NextResponse.json({ ok: false, reason: "invalid" });
  }

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return NextResponse.json({ ok: false, reason: "not_started" });
  }
  if (coupon.ends_at && new Date(coupon.ends_at) < now) {
    return NextResponse.json({ ok: false, reason: "expired" });
  }
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ ok: false, reason: "max_uses_reached" });
  }
  if (coupon.min_subtotal && parsed.data.subtotal < Number(coupon.min_subtotal)) {
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
