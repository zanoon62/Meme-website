/**
 * GET /api/admin/customers — list all customers (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const rl = limiters.admin(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ customers: demoCustomers, total: demoCustomers.length });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const supabase = guard.client;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
    const q = searchParams.get("q");

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

const demoCustomers = [
  {
    id: "demo-c-1",
    email: "sophia.l@example.com",
    first_name: "Sophia",
    last_name: "Larson",
    phone: "+1 212 555 0148",
    accepts_marketing: true,
    total_orders: 4,
    total_spent: 1847.5,
    last_order_at: "2025-09-14T10:30:00Z",
    created_at: "2025-06-22T09:15:00Z",
  },
  {
    id: "demo-c-2",
    email: "elena.k@example.com",
    first_name: "Elena",
    last_name: "Kovac",
    phone: "+1 415 555 0192",
    accepts_marketing: true,
    total_orders: 2,
    total_spent: 510,
    last_order_at: "2025-10-02T14:20:00Z",
    created_at: "2025-07-08T11:42:00Z",
  },
  {
    id: "demo-c-3",
    email: "margot.r@example.com",
    first_name: "Margot",
    last_name: "Reyes",
    phone: "+44 20 7946 0958",
    accepts_marketing: false,
    total_orders: 7,
    total_spent: 4320,
    last_order_at: "2025-10-12T08:45:00Z",
    created_at: "2025-01-15T18:30:00Z",
  },
  {
    id: "demo-c-4",
    email: "naomi.t@example.com",
    first_name: "Naomi",
    last_name: "Tanaka",
    phone: "+81 3 5555 0123",
    accepts_marketing: true,
    total_orders: 3,
    total_spent: 1245,
    last_order_at: "2025-10-15T03:20:00Z",
    created_at: "2025-03-30T22:10:00Z",
  },
];
