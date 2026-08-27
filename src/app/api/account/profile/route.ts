/**
 * PATCH /api/account/profile — update the logged-in customer's profile data.
 *
 * Body: { first_name?, last_name?, phone?, accepts_marketing? }
 * Requires a valid session cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireCustomerSession } from "@/lib/auth/customer-guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { toSnakeCase } from "@/lib/db/to-snake-case";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const UpdateSchema = z.object({
  first_name: z.string().max(80).optional(),
  last_name: z.string().max(80).optional(),
  phone: z.string().max(30).optional().nullable(),
  accepts_marketing: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const rl = await limiters.public(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const guard = await requireCustomerSession();
  if (!guard.ok) return guard.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  type CustomerUpdate = {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    acceptsMarketing?: boolean;
  };
  const updatePayload: CustomerUpdate = {};
  if (parsed.data.first_name !== undefined) updatePayload.firstName = parsed.data.first_name;
  if (parsed.data.last_name !== undefined) updatePayload.lastName = parsed.data.last_name;
  if (parsed.data.phone !== undefined) updatePayload.phone = parsed.data.phone;
  if (parsed.data.accepts_marketing !== undefined)
    updatePayload.acceptsMarketing = parsed.data.accepts_marketing;

  try {
    const [updated] = await db
      .update(customers)
      .set(updatePayload)
      .where(eq(customers.id, guard.customerId))
      .returning();

    logger.info("customer profile updated", { customerId: guard.customerId });
    return NextResponse.json({ ok: true, customer: toSnakeCase(updated) });
  } catch (e) {
    logger.error("profile update failed", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
