/**
 * GET /api/account/orders — returns the current logged-in customer's own orders.
 *
 * Requires a valid Supabase session cookie.
 * Returns [] if not authenticated or Supabase is not configured.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const rl = limiters.public(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ orders: [], demo: true });
  }

  try {
    const serverClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupabaseServiceConfigured()) {
      return NextResponse.json({ orders: [] });
    }

    const serviceClient = createSupabaseServiceClient();

    // Look up the customer row
    const { data: customer } = await serviceClient
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ orders: [] });
    }

    // Fetch orders for this customer, with their line items
    const { data: orders, error } = await serviceClient
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        payment_status,
        fulfillment_status,
        total,
        currency,
        placed_at,
        shipped_at,
        delivered_at,
        tracking_number,
        tracking_url,
        order_items (
          id,
          product_name,
          product_slug,
          product_image,
          variant_color,
          variant_size,
          quantity,
          unit_price,
          total
        )
      `
      )
      .eq("customer_id", customer.id)
      .order("placed_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("account orders fetch failed", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: orders ?? [] });
  } catch (e) {
    logger.error("account orders exception", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
