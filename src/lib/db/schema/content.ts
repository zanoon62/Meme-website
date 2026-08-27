import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Singleton row (id='main') holding the admin-configurable homepage section tree. */
export const homepageSettings = pgTable("homepage_settings", {
  id: text("id").primaryKey().default("main"),
  config: jsonb("config").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
