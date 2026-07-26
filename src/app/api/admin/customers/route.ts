/**
 * GET /api/admin/customers — list all customers (admin only)
 * Supports ?q= query param for search (email, first_name, last_name)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { demoStore } from "@/lib/demo-store";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const rl = limiters.admin(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  if (!isSupabaseServiceConfigured()) {
    const customers = demoStore.searchCustomers(q);
    return NextResponse.json({ customers, total: customers.length });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const supabase = guard.client;
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    let query = supabase
      .from("customers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (q) {
      // Safe parameterized OR filter (no SQL injection — Supabase builder)
      query = query.or(
        `email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`,
      );
    }

    const { data, error, count } = await query;
    if (error) {
      logger.error("admin customers GET failed", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ customers: data ?? [], total: count ?? 0 });
  } catch (e) {
    logger.error("admin customers GET exception", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
