import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  couponTypeEnum,
  fulfillmentStatusEnum,
  orderStatusEnum,
  paymentStatusEnum,
  returnStatusEnum,
} from "./enums";
import { products } from "./catalog";
import { users } from "./auth";

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  acceptsMarketing: boolean("accepts_marketing").default(false),
  tags: text("tags").array().default([]),
  notes: text("notes"),
  totalOrders: integer("total_orders").default(0),
  totalSpent: numeric("total_spent", { precision: 10, scale: 2 }).default("0"),
  lastOrderAt: timestamp("last_order_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    type: text("type").default("shipping"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    company: text("company"),
    address1: text("address1").notNull(),
    address2: text("address2"),
    city: text("city").notNull(),
    state: text("state"),
    postalCode: text("postal_code"),
    country: text("country").notNull(),
    phone: text("phone"),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_addresses_customer").on(table.customerId)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull().unique(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    status: orderStatusEnum("status").default("pending"),
    paymentStatus: paymentStatusEnum("payment_status").default("awaiting"),
    fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status").default("unfulfilled"),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
    discountTotal: numeric("discount_total", { precision: 10, scale: 2 }).default("0"),
    shippingTotal: numeric("shipping_total", { precision: 10, scale: 2 }).default("0"),
    taxTotal: numeric("tax_total", { precision: 10, scale: 2 }).default("0"),
    total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
    currency: text("currency").default("USD"),
    couponCode: text("coupon_code"),
    shippingAddress: jsonb("shipping_address"),
    billingAddress: jsonb("billing_address"),
    shippingMethod: text("shipping_method"),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),
    customerNote: text("customer_note"),
    staffNote: text("staff_note"),
    paymentIntentId: text("payment_intent_id"),
    paymentMethod: text("payment_method"),
    placedAt: timestamp("placed_at", { withTimezone: true }).defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_orders_customer").on(table.customerId),
    index("idx_orders_status").on(table.status),
    index("idx_orders_payment_status").on(table.paymentStatus),
    index("idx_orders_order_number").on(table.orderNumber),
    index("idx_orders_payment_intent").on(table.paymentIntentId),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    productSlug: text("product_slug"),
    productImage: text("product_image"),
    variantColor: text("variant_color"),
    variantSize: text("variant_size"),
    sku: text("sku"),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_order_items_order").on(table.orderId),
    index("idx_order_items_product").on(table.productId),
  ],
);

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  description: text("description"),
  type: couponTypeEnum("type").notNull(),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  minSubtotal: numeric("min_subtotal", { precision: 10, scale: 2 }).default("0"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }).defaultNow(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true),
  appliesTo: text("applies_to"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const wishlists = pgTable(
  "wishlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_wishlists_customer").on(table.customerId)],
);

export const returns = pgTable(
  "returns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    orderNumber: text("order_number").notNull(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerEmail: text("customer_email").notNull(),
    reason: text("reason").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    status: returnStatusEnum("status").notNull().default("pending"),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("returns_status_idx").on(table.status),
    index("returns_customer_id_idx").on(table.customerId),
    index("returns_order_number_idx").on(table.orderNumber),
    index("returns_created_at_idx").on(table.createdAt),
  ],
);
