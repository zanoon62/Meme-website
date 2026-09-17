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
