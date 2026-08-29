/**
 * POST /api/returns — Customer submits a return request
 * GET  /api/returns — Customer fetches their own return requests
 *
 * Requires a valid session. Validates that the order is within the 14-day
 * return window.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { orders, returns } from "@/lib/db/schema";
import { requireCustomerSession } from "@/lib/auth/customer-guard";
import { toSnakeCase, toSnakeCaseArray } from "@/lib/db/to-snake-case";
import { limiters } from "@/lib/rate-limit";
import { publishRealtimeEvent } from "@/lib/realtime/publish";
import { logger } from "@/lib/logger";

const RETURN_WINDOW_DAYS = 14;

const SubmitReturnSchema = z.object({
  order_number: z.string().min(1).max(100).trim().transform((v) => v.replace(/^#/, "")),
  reason: z.enum(["wrong_size", "wrong_item", "damaged", "not_as_described", "changed_mind", "other"]),
  description: z.string().max(2000).optional(),
  image_url: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const rl = await limiters.public(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const guard = await requireCustomerSession();
  if (!guard.ok) return guard.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SubmitReturnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const [order] = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber, createdAt: orders.createdAt })
    .from(orders)
    .where(eq(orders.orderNumber, parsed.data.order_number))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found. Please check the order number." }, { status: 404 });
  }

  const orderDate = order.createdAt ?? new Date();
  const diffDays = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays > RETURN_WINDOW_DAYS) {
    return NextResponse.json(
      {
        error: `Return window expired. Returns are only accepted within ${RETURN_WINDOW_DAYS} days of ordering. This order was placed ${Math.floor(diffDays)} days ago.`,
        code: "WINDOW_EXPIRED",
        days_elapsed: Math.floor(diffDays),
        window_days: RETURN_WINDOW_DAYS,
      },
      { status: 422 },
    );
  }

  const [existingReturn] = await db
    .select({ id: returns.id, status: returns.status })
    .from(returns)
    .where(eq(returns.orderNumber, parsed.data.order_number))
    .limit(1);

  if (existingReturn) {
    return NextResponse.json(
      {
        error: `A return request for order ${parsed.data.order_number} already exists (status: ${existingReturn.status}).`,
        code: "ALREADY_EXISTS",
      },
      { status: 409 },
    );
  }

  try {
    const [returnRecord] = await db
      .insert(returns)
      .values({
        orderId: order.id,
        orderNumber: parsed.data.order_number,
        customerId: guard.customerId,
        customerEmail: guard.email,
        reason: parsed.data.reason,
        description: parsed.data.description || null,
        imageUrl: parsed.data.image_url || null,
        status: "pending",
      })
      .returning();

    logger.info("return submitted", { returnId: returnRecord.id, orderNumber: parsed.data.order_number });
    publishRealtimeEvent("return.created", {
      returnId: returnRecord.id,
      orderNumber: parsed.data.order_number,
      customerId: guard.customerId,
      reason: parsed.data.reason,
    }).catch(() => {});
    return NextResponse.json({ ok: true, return: toSnakeCase(returnRecord) }, { status: 201 });
  } catch (e) {
    logger.error("return insert failed", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const rl = await limiters.public(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const guard = await requireCustomerSession();
  if (!guard.ok) return guard.error;

  const rows = await db
    .select()
    .from(returns)
    .where(and(eq(returns.customerId, guard.customerId)))
    .orderBy(desc(returns.createdAt));

  return NextResponse.json({ returns: toSnakeCaseArray(rows) });
}
