/**
 * Server-side checkout helpers — coupon validation, inventory check,
 * order number generation, and order creation in Supabase.
 *
 * All functions take a service-role client (bypass RLS) — only call
 * from trusted server contexts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { CartLine, Address } from "./types";
import { calculateShipping, calculateTax } from "./types";
import { logger } from "@/lib/logger";

type ServiceClient = SupabaseClient<Database>;

export type CouponResult =
  | { ok: true; coupon: Database["public"]["Tables"]["coupons"]["Row"]; discount: number }
  | { ok: false; reason: string };

/** Validate a coupon code against the database and cart subtotal. */
export async function validateCoupon(
  supabase: ServiceClient,
  code: string | undefined,
  subtotal: number,
): Promise<CouponResult> {
  if (!code) return { ok: false, reason: "no_code" };

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (error || !coupon) return { ok: false, reason: "invalid" };

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { ok: false, reason: "not_started" };
  }
  if (coupon.ends_at && new Date(coupon.ends_at) < now) {
    return { ok: false, reason: "expired" };
  }
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return { ok: false, reason: "max_uses_reached" };
  }
  if (coupon.min_subtotal && subtotal < Number(coupon.min_subtotal)) {
    return { ok: false, reason: "min_subtotal_not_met" };
  }

  let discount = 0;
  if (coupon.type === "percent") {
    discount = (subtotal * Number(coupon.value)) / 100;
  } else if (coupon.type === "fixed") {
    discount = Number(coupon.value);
  } else if (coupon.type === "shipping") {
    discount = 0; // applied at shipping calc time
  }

  return { ok: true, coupon, discount: Math.round(discount * 100) / 100 };
}

export type InventoryCheck = {
  ok: boolean;
  failures: { productId: string; name: string; requested: number; available: number }[];
};

/** Verify all cart lines have sufficient inventory. */
export async function checkInventory(
  supabase: ServiceClient,
  lines: CartLine[],
): Promise<InventoryCheck> {
  const productIds = lines.map((l) => l.productId);
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, inventory, status")
    .in("id", productIds);

  if (error || !products) {
    return {
      ok: false,
      failures: lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        requested: l.quantity,
        available: 0,
      })),
    };
  }

  const invMap = new Map(products.map((p) => [p.id, p]));
  const failures: InventoryCheck["failures"] = [];

  for (const line of lines) {
    const product = invMap.get(line.productId);
    if (!product || product.status !== "active") {
      failures.push({
        productId: line.productId,
        name: line.name,
        requested: line.quantity,
        available: 0,
      });
      continue;
    }
    if (product.inventory < line.quantity) {
      failures.push({
        productId: line.productId,
        name: line.name,
        requested: line.quantity,
        available: product.inventory,
      });
    }
  }

  return { ok: failures.length === 0, failures };
}

/** Generate a unique order number: MEME-YYMMDD-NNNNNN. */
async function generateOrderNumber(supabase: ServiceClient): Promise<string> {
  // Try the DB function first
  const { data, error } = await supabase.rpc("generate_order_number");
  if (!error && data) return data as string;

  // Fallback: timestamp + random
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return `MEME-${yy}${mm}${dd}-${rand}`;
}

export type CreateOrderInput = {
  email: string;
  lines: CartLine[];
  shipping_address: Address;
  shipping_method: string;
  coupon_code?: string;
  customer_note?: string;
  customer_id?: string;
  payment_intent_id?: string;
};

export type CreatedOrder = {
  id: string;
  order_number: string;
  total: number;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  currency: string;
};

/**
 * Create the order, order_items, decrement inventory, increment coupon usage.
 * All in a single logical transaction (best-effort — Supabase doesn't have
 * true multi-statement tx via the JS client, but order_items FK is cascade
 * so a partial failure will leave an orphaned order row that we can clean up).
 */
export async function createOrder(
  supabase: ServiceClient,
  input: CreateOrderInput,
): Promise<{ ok: true; order: CreatedOrder } | { ok: false; error: string }> {
  const subtotal = input.lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const couponResult = await validateCoupon(supabase, input.coupon_code, subtotal);

  let discountTotal = 0;
  let couponCode: string | null = null;
  if (couponResult.ok) {
    discountTotal = couponResult.discount;
    couponCode = couponResult.coupon.code;
  }

  const shippingTotal =
    couponResult.ok && couponResult.coupon.type === "shipping"
      ? 0
      : calculateShipping(subtotal, input.shipping_method);

  const taxableBase = Math.max(0, subtotal - discountTotal);
  const taxTotal = calculateTax(taxableBase, input.shipping_address.state);
  const total = Math.max(0, taxableBase + shippingTotal + taxTotal);

  const orderNumber = await generateOrderNumber(supabase);

  // 1. Insert order
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: input.customer_id ?? null,
      email: input.email,
      status: "pending",
      payment_status: "awaiting",
      fulfillment_status: "unfulfilled",
      subtotal,
      discount_total: discountTotal,
      shipping_total: shippingTotal,
      tax_total: taxTotal,
      total,
      currency: "EGP",
      coupon_code: couponCode,
      shipping_address: input.shipping_address,
      shipping_method: input.shipping_method,
      customer_note: input.customer_note,
      placed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orderErr || !order) {
    logger.error("order insert failed", { error: orderErr?.message });
    return { ok: false, error: orderErr?.message ?? "Order insert failed" };
  }

  // 2. Insert order items (snapshot prices)
  const itemPayload = input.lines.map((l) => ({
    order_id: order.id,
    product_id: l.productId,
    product_name: l.name,
    product_slug: l.slug,
    product_image: l.image,
    variant_color: l.color,
    variant_size: l.size,
    unit_price: l.price,
    quantity: l.quantity,
    total: l.price * l.quantity,
  }));
  const { error: itemsErr } = await supabase.from("order_items").insert(itemPayload);
  if (itemsErr) {
    logger.error("order_items insert failed", { orderId: order.id, error: itemsErr.message });
    // Rollback order
    await supabase.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "Failed to save line items" };
  }

  // 3. Decrement inventory for each product (atomic SQL would be better, but
  //    this is acceptable for low-volume — use a Postgres function for prod).
  for (const line of input.lines) {
    const { data: cur } = await supabase
      .from("products")
      .select("inventory")
      .eq("id", line.productId)
      .single();
    if (cur) {
      const newInv = Math.max(0, cur.inventory - line.quantity);
      await supabase.from("products").update({ inventory: newInv }).eq("id", line.productId);
    }
  }

  // 4. Increment coupon usage
  if (couponResult.ok) {
    await supabase
      .from("coupons")
      .update({ used_count: (couponResult.coupon.used_count ?? 0) + 1 })
      .eq("id", couponResult.coupon.id);
  }

  // 5. Update customer stats if logged in
  if (input.customer_id) {
    const { data: cust } = await supabase
      .from("customers")
      .select("total_orders, total_spent")
      .eq("id", input.customer_id)
      .single();
    if (cust) {
      await supabase
        .from("customers")
        .update({
          total_orders: (cust.total_orders ?? 0) + 1,
          total_spent: Number(cust.total_spent ?? 0) + total,
          last_order_at: new Date().toISOString(),
        })
        .eq("id", input.customer_id);
    }
  }

  logger.info("order created", { orderId: order.id, orderNumber, total });

  return {
    ok: true,
    order: {
      id: order.id,
      order_number: orderNumber,
      total,
      subtotal,
      discount_total: discountTotal,
      shipping_total: shippingTotal,
      tax_total: taxTotal,
      currency: "EGP",
    },
  };
}
