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
    const userEmail = user.email;

    // Look up the customer row by auth_user_id or email
    let { data: customer } = await serviceClient
      .from("customers")
      .select("id, email")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!customer && userEmail) {
      const { data: custByEmail } = await serviceClient
        .from("customers")
        .select("id, email")
        .ilike("email", userEmail)
        .maybeSingle();
      customer = custByEmail;
    }

    // Build order fetch query: match customer_id OR email
    let query = serviceClient.from("orders").select(
      `
      id,
      order_number,
      status,
      payment_status,
      fulfillment_status,
      subtotal,
      discount_total,
      shipping_total,
      tax_total,
      total,
      currency,
      shipping_address,
      shipping_method,
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
    );

    if (customer && userEmail) {
      query = query.or(`customer_id.eq.${customer.id},email.ilike.${userEmail}`);
    } else if (customer) {
      query = query.eq("customer_id", customer.id);
    } else if (userEmail) {
      query = query.ilike("email", userEmail);
    } else {
      return NextResponse.json({ orders: [] });
    }

    const { data: orders, error } = await query
      .order("placed_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("account orders fetch failed", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Backfill customer_id on unlinked orders matching this customer
    if (customer && orders && orders.length > 0) {
      const unlinkedIds = orders.filter((o: any) => !o.customer_id).map((o: any) => o.id);
      if (unlinkedIds.length > 0) {
        serviceClient
          .from("orders")
          .update({ customer_id: customer.id })
          .in("id", unlinkedIds)
          .then(({ error: updateErr }) => {
            if (updateErr) logger.warn("Failed to backfill customer_id on orders", { error: updateErr.message });
          });
      }
    }

    return NextResponse.json({ orders: orders ?? [] });
  } catch (e) {
    logger.error("account orders exception", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
