/**
 * Checkout validation & order-shape types.
 * Shared between /api/checkout, /api/stripe/webhook, and client.
 */
import { z } from "zod";

export const AddressSchema = z.object({
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  email: z.string().email().optional(),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postal_code: z.string().min(1).max(20),
  country: z.string().min(2).max(2),
  phone: z.string().max(40).optional(),
});

export const CartLineSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  image: z.string().optional(),
  color: z.string(),
  size: z.string(),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive().max(99),
});

export const CheckoutPayloadSchema = z.object({
  email: z.string().email(),
  shipping_address: AddressSchema,
  billing_address: AddressSchema.optional(),
  shipping_method: z.enum(["standard", "express", "overnight"]).default("standard"),
  coupon_code: z.string().max(50).optional(),
  lines: z.array(CartLineSchema).min(1),
  customer_note: z.string().max(1000).optional(),
  payment_intent_id: z.string().optional(),
});

export type CheckoutPayload = z.infer<typeof CheckoutPayloadSchema>;
export type CartLine = z.infer<typeof CartLineSchema>;
export type Address = z.infer<typeof AddressSchema>;

/** Tax & shipping rules — replace with TaxJar/Avalara + carrier APIs in real prod. */
export function calculateShipping(subtotal: number, method: string): number {
  if (subtotal >= 250 && method === "standard") return 0;
  if (method === "express") return 24;
  if (method === "overnight") return 48;
  return 8; // standard
}

export function calculateTax(subtotal: number, state?: string): number {
  // Flat fallback — real prod should call TaxJar/Avalara based on nexus
  const rates: Record<string, number> = {
    NY: 0.08875,
    CA: 0.0925,
    TX: 0.0825,
    FL: 0.07,
    IL: 0.0625,
  };
  const rate = (state && rates[state] ? rates[state] : 0.08) as number;
  return Math.round(subtotal * rate * 100) / 100;
}
