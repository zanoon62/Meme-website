/**
 * GET /api/auth/session — returns the current customer's session + profile.
 *
 * Returns:
 *   200 { user, customer } — logged in
 *   200 { user: null } — not logged in
 */

import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { ensureCustomerForUser } from "@/lib/auth/identity";
import { db } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Never cache this anywhere (browser, service worker, an intermediate
// proxy) — a cached "not logged in" response served right after a login
// would make the account page look stuck/broken until the cache expires.
const NO_STORE_HEADERS = { "Cache-Control": "no-store, must-revalidate" };

export async function GET() {
  const { user } = await getCurrentSession();
  if (!user) return NextResponse.json({ user: null }, { headers: NO_STORE_HEADERS });

  let [customer] = await db.select().from(customers).where(eq(customers.userId, user.id)).limit(1);
  if (!customer) {
    customer = await ensureCustomerForUser(user.id, user.email);
  }

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.createdAt,
      },
      customer,
    },
    { headers: NO_STORE_HEADERS },
  );
}
