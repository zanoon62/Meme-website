import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, oauthAccounts, customers } from "@/lib/db/schema";
import type { GoogleUser } from "@/lib/auth/google-oauth";

/**
 * Resolves a Google login to a `users` row: links by existing
 * oauth_accounts(provider, provider_account_id) first, falls back to
 * matching by email (e.g. an account that previously signed up with a
 * password), otherwise creates a new user. Always ensures an
 * oauth_accounts link exists afterward.
 */
export async function findOrCreateUserFromGoogle(googleUser: GoogleUser) {
  const email = googleUser.email.toLowerCase().trim();

  const [existingLink] = await db
    .select({ userId: oauthAccounts.userId })
    .from(oauthAccounts)
    .where(and(eq(oauthAccounts.provider, "google"), eq(oauthAccounts.providerAccountId, googleUser.sub)))
    .limit(1);

  if (existingLink) {
    const [user] = await db.select().from(users).where(eq(users.id, existingLink.userId)).limit(1);
    if (user) return user;
  }

  const [byEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  const user =
    byEmail ??
    (
      await db
        .insert(users)
        .values({ email, emailVerifiedAt: googleUser.email_verified ? new Date() : null })
        .returning()
    )[0];

  await db
    .insert(oauthAccounts)
    .values({ userId: user.id, provider: "google", providerAccountId: googleUser.sub })
    .onConflictDoNothing();

  return user;
}

/** Parses Google's `name`/`given_name`/`family_name` into first/last name. */
export function parseGoogleName(googleUser: GoogleUser): { firstName: string | null; lastName: string | null } {
  if (googleUser.given_name || googleUser.family_name) {
    return { firstName: googleUser.given_name ?? null, lastName: googleUser.family_name ?? null };
  }
  const full = (googleUser.name ?? "").trim();
  if (!full) return { firstName: null, lastName: null };
  const parts = full.split(" ");
  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

/** Ensures a `customers` row exists for this user, creating one if needed. */
export async function ensureCustomerForUser(
  userId: string,
  email: string,
  extra?: { firstName?: string | null; lastName?: string | null; acceptsMarketing?: boolean },
) {
  const [existing] = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1);
  if (existing) {
    if (!existing.firstName && extra?.firstName) {
      const [updated] = await db
        .update(customers)
        .set({ firstName: extra.firstName, lastName: extra.lastName ?? null })
        .where(eq(customers.id, existing.id))
        .returning();
      return updated;
    }
    return existing;
  }

  const [created] = await db
    .insert(customers)
    .values({
      userId,
      email,
      firstName: extra?.firstName ?? null,
      lastName: extra?.lastName ?? null,
      acceptsMarketing: extra?.acceptsMarketing ?? false,
    })
    .returning();
  return created;
}
