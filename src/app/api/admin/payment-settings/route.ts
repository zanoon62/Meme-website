/**
 * GET  /api/admin/payment-settings — admin read (same data as the public
 *      route, but always fresh — never Nginx-cached — for the settings UI)
 * POST /api/admin/payment-settings — upsert Vodafone Cash / InstaPay details
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { paymentSettings } from "@/lib/db/schema";
import { isDatabaseConfigured } from "@/lib/db/config";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ config: null }, { status: 200 });
  }
  try {
    const [row] = await db
      .select({ config: paymentSettings.config })
      .from(paymentSettings)
      .where(eq(paymentSettings.id, "main"))
      .limit(1);
    return NextResponse.json({ config: row?.config ?? null });
  } catch (e) {
    logger.error("GET /api/admin/payment-settings failed", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, fallback: true });
  }
  try {
    const body = await req.json();
    const config = body?.config;
    if (!config || typeof config !== "object") {
      return NextResponse.json({ error: "config is required" }, { status: 400 });
    }

    await db
      .insert(paymentSettings)
      .values({ id: "main", config, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: paymentSettings.id,
        set: { config, updatedAt: new Date() },
      });

    logger.info("payment settings updated", { by: guard.userId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("POST /api/admin/payment-settings failed", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
