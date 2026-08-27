/**
 * GET /api/admin/customers — list all customers (admin only)
 * Supports ?q= query param for search (email, first_name, last_name)
 */

import { NextRequest, NextResponse } from "next/server";
import { count, desc, ilike, or } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { toSnakeCaseArray } from "@/lib/db/to-snake-case";
import { demoStore } from "@/lib/demo-store";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const rl = await limiters.admin(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  if (!isDatabaseConfigured()) {
    const list = demoStore.searchCustomers(q);
    return NextResponse.json({ customers: list, total: list.length });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    const whereClause = q
      ? or(
          ilike(customers.email, `%${q}%`),
          ilike(customers.firstName, `%${q}%`),
          ilike(customers.lastName, `%${q}%`),
        )
      : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(customers)
        .where(whereClause)
        .orderBy(desc(customers.createdAt))
        .limit(limit),
      db.select({ value: count() }).from(customers).where(whereClause),
    ]);

    const total = countRows[0]?.value ?? 0;
    return NextResponse.json({ customers: toSnakeCaseArray(rows), total });
  } catch (e) {
    logger.error("admin customers GET exception", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
