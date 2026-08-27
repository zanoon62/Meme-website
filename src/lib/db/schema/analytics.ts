import { bigserial, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { customers } from "./commerce";

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    eventType: text("event_type").notNull(), // 'page_view' | 'add_to_cart' | 'checkout' | 'purchase' | 'search'
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    sessionId: text("session_id"),
    payload: jsonb("payload").default({}),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_events_type").on(table.eventType),
    index("idx_events_created").on(table.createdAt),
    index("idx_events_product").on(table.entityId),
  ],
);
