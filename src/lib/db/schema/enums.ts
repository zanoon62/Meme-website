import { pgEnum } from "drizzle-orm/pg-core";

export const productStatusEnum = pgEnum("product_status", ["draft", "active", "archived"]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "fulfilled",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "awaiting",
  "authorized",
  "paid",
  "partial_refund",
  "refunded",
  "failed",
]);

export const fulfillmentStatusEnum = pgEnum("fulfillment_status", [
  "unfulfilled",
  "partial",
  "fulfilled",
]);

export const couponTypeEnum = pgEnum("coupon_type", ["percent", "fixed", "shipping"]);

export const roleEnum = pgEnum("role", ["admin", "staff", "customer"]);

export const returnStatusEnum = pgEnum("return_status", [
  "pending",
  "reviewing",
  "approved",
  "rejected",
  "refunded",
]);
