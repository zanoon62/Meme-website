/**
 * Customer-facing auth guard — resolves the current session to a
 * `customers.id`. This is the ONLY sanctioned way account-scoped routes
 * should determine "whose data is this" — never trust a client-supplied
 * customer id. Replaces the RLS policies that used to enforce
 * `customer_id in (select id from customers where auth_user_id = auth.uid())`
 * at the database layer; there is no RLS anymore, so this check must be
 * applied at every call site that touches customer-owned data.
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";

type GuardResult =
  | { ok: true; userId: string; customerId: string; email: string }
  | { ok: false; error: NextResponse };

export async function requireCustomerSession(): Promise<GuardResult> {
  const { user } = await getCurrentSession();

  if (!user) {
    return {
      ok: false,
      error: NextResponse.json({ error: "Unauthorized — no session." }, { status: 401 }),
    };
  }

  const [customer] = await db.select().from(customers).where(eq(customers.userId, user.id)).limit(1);

  if (!customer) {
    return {
      ok: false,
      error: NextResponse.json({ error: "No customer profile for this account." }, { status: 404 }),
    };
  }

  return { ok: true, userId: user.id, customerId: customer.id, email: customer.email };
}
