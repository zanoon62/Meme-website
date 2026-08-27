import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { roleEnum } from "./enums";

/**
 * Replaces Supabase's internal `auth.users`. Password auth and OAuth
 * (Google, via `arctic`) both resolve to a row here.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // null for OAuth-only accounts
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // 'google'
    providerAccountId: text("provider_account_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_oauth_accounts_user").on(table.userId)],
);

/**
 * Opaque session tokens. Only a SHA-256 hash of the token is stored,
 * matching the Lucia-recommended pattern — the raw token lives only in
 * the httpOnly cookie.
 */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // hash of the session token
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const staffProfiles = pgTable("staff_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  role: roleEnum("role").default("staff"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** Email whitelist gating who is allowed to become staff via Google OAuth. */
export const adminAllowedEmails = pgTable("admin_allowed_emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
