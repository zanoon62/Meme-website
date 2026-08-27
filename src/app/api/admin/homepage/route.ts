import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { homepageSettings } from "@/lib/db/schema";
import { isDatabaseConfigured } from "@/lib/db/config";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * GET /api/admin/homepage
 * Returns the current homepage config from Postgres.
 */
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ config: null }, { status: 200 });
  }
  try {
    const [row] = await db
      .select({ config: homepageSettings.config })
      .from(homepageSettings)
      .where(eq(homepageSettings.id, "main"))
      .limit(1);

    if (!row) {
      return NextResponse.json({ config: null }, { status: 200 });
    }
    return NextResponse.json({ config: row.config ?? null });
  } catch (e) {
    logger.error("GET /api/admin/homepage failed", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/homepage
 * Upserts the homepage config to Postgres.
 * Body: { config: HomepageConfig }
 */
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

    try {
      await db
        .insert(homepageSettings)
        .values({ id: "main", config, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: homepageSettings.id,
          set: { config, updatedAt: new Date() },
        });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      logger.error("Upsert homepage_settings failed", { error: message });
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("POST /api/admin/homepage failed", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
