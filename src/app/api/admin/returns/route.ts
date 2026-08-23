/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET  /api/admin/returns        — list all return requests (admin only)
 * PATCH /api/admin/returns       — batch-update (not used, here for completeness)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const rl = limiters.admin(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const supabase = guard.client;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

  type ReturnStatus = "pending" | "reviewing" | "approved" | "rejected" | "refunded";

  let query = (supabase as any)
    .from("returns")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== "all") {
    query = query.eq("status", status as ReturnStatus);
  }

  const { data: returns, error, count } = await query;

  if (error) {
    logger.error("admin returns GET failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    returns: returns ?? [],
    total: count ?? 0,
  });
}
