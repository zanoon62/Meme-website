/**
 * GET  /api/admin/store-settings — admin read (always fresh, never cached)
 * POST /api/admin/store-settings — upsert the store profile
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { storeSettings } from "@/lib/db/schema";
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
      .select({ config: storeSettings.config })
      .from(storeSettings)
      .where(eq(storeSettings.id, "main"))
      .limit(1);
    return NextResponse.json({ config: row?.config ?? null });
  } catch (e) {
    logger.error("GET /api/admin/store-settings failed", {
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
      .insert(storeSettings)
      .values({ id: "main", config, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: storeSettings.id,
        set: { config, updatedAt: new Date() },
      });

    logger.info("store settings updated", { by: guard.userId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("POST /api/admin/store-settings failed", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
