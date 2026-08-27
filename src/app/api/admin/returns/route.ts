/**
 * GET  /api/admin/returns        — list all return requests (admin only)
 * PATCH /api/admin/returns       — batch-update (not used, here for completeness)
 */

import { NextRequest, NextResponse } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { returns } from "@/lib/db/schema";
import { toSnakeCaseArray } from "@/lib/db/to-snake-case";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

type ReturnStatus = "pending" | "reviewing" | "approved" | "rejected" | "refunded";

export async function GET(req: NextRequest) {
  const rl = await limiters.admin(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Demo mode — no database configured, so there's no returns table to query.
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ returns: [], total: 0 });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

  try {
    const whereClause =
      status && status !== "all" ? eq(returns.status, status as ReturnStatus) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(returns)
        .where(whereClause)
        .orderBy(desc(returns.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(returns).where(whereClause),
    ]);

    return NextResponse.json({
      returns: toSnakeCaseArray(rows),
      total: countRows[0]?.value ?? 0,
    });
  } catch (e) {
    logger.error("admin returns GET failed", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
