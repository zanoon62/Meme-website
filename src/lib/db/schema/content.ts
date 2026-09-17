import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Singleton row (id='main') holding the admin-configurable homepage section tree. */
export const homepageSettings = pgTable("homepage_settings", {
  id: text("id").primaryKey().default("main"),
  config: jsonb("config").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/**
 * Singleton row (id='main') holding admin-managed payment/transfer settings —
 * the Vodafone Cash & InstaPay receiver details shown to customers at
 * checkout. Previously lived only in a localStorage Zustand store, which
 * meant a different admin/browser/device never saw the same numbers and the
 * checkout page (a different browser entirely, for the customer) never saw
 * admin edits at all. A DB-backed singleton, read the same way as
 * homepage_settings, fixes both.
 */
export const paymentSettings = pgTable("payment_settings", {
  id: text("id").primaryKey().default("main"),
  config: jsonb("config").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/**
 * Singleton row (id='main') holding the store's public profile — name,
 * tagline, contact email/phone, Instagram, address. Same story as
 * payment_settings: this used to be a localStorage-only Zustand store, so
 * an admin's edit never reached the footer/checkout in any other
 * browser/device.
 */
export const storeSettings = pgTable("store_settings", {
  id: text("id").primaryKey().default("main"),
  config: jsonb("config").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/**
 * Singleton row (id='main') holding the admin-managed shipping zones
 * (name/cost/estimated days/COD availability per Egyptian region). Same
 * localStorage-only bug as above — checkout in a different browser/device
 * never saw an admin's rate change.
 */
export const shippingSettings = pgTable("shipping_settings", {
  id: text("id").primaryKey().default("main"),
  config: jsonb("config").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
