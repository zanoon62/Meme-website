/**
 * GET  /api/admin/coupons — list all coupons
 * POST /api/admin/coupons — create a coupon
 */

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { demoStore } from "@/lib/demo-store";

export async function GET() {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ coupons: demoStore.listCoupons() });
  }
  return NextResponse.json({ coupons: [] });
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

  if (!isSupabaseServiceConfigured()) {
    const cp = demoStore.createCoupon({
      code: body.code.toUpperCase(),
      type: body.type,
      value: Number(body.value),
      min_subtotal: body.min_subtotal,
      usage_limit: body.usage_limit,
    });
    return NextResponse.json({ coupon: cp }, { status: 201 });
  }

  return NextResponse.json({ success: true });
}
