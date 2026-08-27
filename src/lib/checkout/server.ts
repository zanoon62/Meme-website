/**
 * Server-side checkout helpers — coupon validation, inventory check,
 * order number generation, and order creation against Postgres.
 *
 * createOrder() runs as a single real Postgres transaction (order insert,
 * order_items insert, per-line inventory decrement, coupon usage increment,
 * customer stats update) — replacing the old best-effort Supabase-JS
 * version, which had no real multi-statement transaction and manually
 * rolled back the order row on item-insert failure, plus a manual
 * "if the RPC errors, fall back to a racy read-then-write" branch. A real
 * transaction makes both of those unnecessary: any failure rolls back
 * everything automatically.
 */

import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { coupons, customers, orderItems, orders, products } from "@/lib/db/schema";
import type { CartLine, Address } from "./types";
import { SHIPPING_ZONES, PAYMENT_METHODS, FREE_SHIPPING_THRESHOLD } from "@/lib/format";
import { logger } from "@/lib/logger";

type Coupon = typeof coupons.$inferSelect;

export type CouponResult = { ok: true; coupon: Coupon; discount: number } | { ok: false; reason: string };

/** Validate a coupon code against the database and cart subtotal. */
export async function validateCoupon(code: string | undefined, subtotal: number): Promise<CouponResult> {
  if (!code) return { ok: false, reason: "no_code" };

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(sql`${coupons.code} = ${code.toUpperCase()} and ${coupons.isActive} = true`)
    .limit(1);

  if (!coupon) return { ok: false, reason: "invalid" };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, reason: "not_started" };
  if (coupon.endsAt && coupon.endsAt < now) return { ok: false, reason: "expired" };
  if (coupon.maxUses && (coupon.usedCount ?? 0) >= coupon.maxUses) {
    return { ok: false, reason: "max_uses_reached" };
  }
  if (coupon.minSubtotal && subtotal < Number(coupon.minSubtotal)) {
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
export async function checkInventory(lines: CartLine[]): Promise<InventoryCheck> {
  const productIds = lines.map((l) => l.productId);
  const rows = await db
    .select({ id: products.id, name: products.name, inventory: products.inventory, status: products.status })
    .from(products)
    .where(inArray(products.id, productIds));

  const invMap = new Map(rows.map((p) => [p.id, p]));
  const failures: InventoryCheck["failures"] = [];

  for (const line of lines) {
    const product = invMap.get(line.productId);
    if (!product || product.status !== "active") {
      failures.push({ productId: line.productId, name: line.name, requested: line.quantity, available: 0 });
      continue;
    }
    if ((product.inventory ?? 0) < line.quantity) {
      failures.push({
        productId: line.productId,
        name: line.name,
        requested: line.quantity,
        available: product.inventory ?? 0,
      });
    }
  }

  return { ok: failures.length === 0, failures };
}

export type CreateOrderInput = {
  email: string;
  lines: CartLine[];
  shipping_address: Address;
  shipping_method: string;
  shipping_zone_id?: string;
  payment_method_id?: string;
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
  vat_total: number;
  payment_fee: number;
  tax_total: number;
  currency: string;
  shipping_zone_name: string;
  payment_method_name: string;
  coupon_code?: string;
};

/** Create the order, order_items, decrement inventory, increment coupon usage — as one transaction. */
export async function createOrder(
  input: CreateOrderInput,
): Promise<{ ok: true; order: CreatedOrder } | { ok: false; error: string }> {
  const subtotal = input.lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const couponResult = await validateCoupon(input.coupon_code, subtotal);

  let discountTotal = 0;
  let couponCode: string | undefined = undefined;
  if (couponResult.ok) {
    discountTotal = couponResult.discount;
    couponCode = couponResult.coupon.code;
  }

  const discountedSub = Math.max(0, subtotal - discountTotal);
  const vatTotal = 0; // VAT removed per store policy

  const zone = SHIPPING_ZONES.find((z) => z.id === input.shipping_zone_id) ?? SHIPPING_ZONES[0];
  const shippingTotal =
    subtotal >= FREE_SHIPPING_THRESHOLD || (couponResult.ok && couponResult.coupon.type === "shipping")
      ? 0
      : zone.cost;

  const method = PAYMENT_METHODS.find((m) => m.id === input.payment_method_id) ?? PAYMENT_METHODS[0];
  const paymentFee = (method.processingFee ?? 0) + Math.round(((method.feePercent ?? 0) / 100) * discountedSub);

  const total = discountedSub + shippingTotal + paymentFee;

  try {
    const { orderId, orderNumber } = await db.transaction(async (tx) => {
      const [{ orderNumber }] = await tx.execute<{ orderNumber: string }>(
        sql`select generate_order_number() as "orderNumber"`,
      );

      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerId: input.customer_id ?? null,
          email: input.email,
          status: "pending",
          paymentStatus: "awaiting",
          fulfillmentStatus: "unfulfilled",
          subtotal: subtotal.toFixed(2),
          discountTotal: discountTotal.toFixed(2),
          shippingTotal: shippingTotal.toFixed(2),
          taxTotal: "0",
          total: total.toFixed(2),
          currency: "EGP",
          couponCode: couponCode ?? null,
          shippingAddress: input.shipping_address,
          shippingMethod: input.shipping_method,
          customerNote: input.customer_note ?? null,
          paymentIntentId: input.payment_intent_id ?? null,
          placedAt: new Date(),
        })
        .returning();

      await tx.insert(orderItems).values(
        input.lines.map((l) => ({
          orderId: order.id,
          productId: l.productId,
          productName: l.name,
          productSlug: l.slug,
          productImage: l.image,
          variantColor: l.color,
          variantSize: l.size,
          unitPrice: l.price.toFixed(2),
          quantity: l.quantity,
          total: (l.price * l.quantity).toFixed(2),
        })),
      );

      for (const line of input.lines) {
        await tx.execute(
          sql`select decrement_inventory(${line.productId}::uuid, ${line.quantity}::int)`,
        );
      }

      if (couponResult.ok) {
        await tx
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(eq(coupons.id, couponResult.coupon.id));
      }

      if (input.customer_id) {
        await tx
          .update(customers)
          .set({
            totalOrders: sql`${customers.totalOrders} + 1`,
            totalSpent: sql`${customers.totalSpent} + ${total}`,
            lastOrderAt: new Date(),
          })
          .where(eq(customers.id, input.customer_id));
      }

      return { orderId: order.id, orderNumber: order.orderNumber };
    });

    logger.info("order created", { orderId, orderNumber, total });

    return {
      ok: true,
      order: {
        id: orderId,
        order_number: orderNumber,
        total,
        subtotal,
        discount_total: discountTotal,
        shipping_total: shippingTotal,
        vat_total: vatTotal,
        payment_fee: paymentFee,
        tax_total: 0,
        currency: "EGP",
        shipping_zone_name: zone.name,
        payment_method_name: method.name,
        coupon_code: couponCode,
      },
    };
  } catch (e) {
    logger.error("order creation transaction failed", { error: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: e instanceof Error ? e.message : "Order creation failed" };
  }
}
