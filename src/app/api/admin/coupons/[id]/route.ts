import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { coupons } from "@/lib/db/schema";
import { toSnakeCase } from "@/lib/db/to-snake-case";
import { demoStore } from "@/lib/demo-store";
import { logger } from "@/lib/logger";

/** snake_case body key -> camelCase Drizzle column key, for the `coupons` table. */
function toCamelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

// numeric columns that must be sent to Postgres as decimal strings
const NUMERIC_KEYS = new Set(["value", "minSubtotal"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (!isDatabaseConfigured()) {
    const updated = demoStore.updateCoupon(id, body);
    return NextResponse.json({ coupon: updated });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    const camelKey = toCamelKey(key);
    update[camelKey] =
      NUMERIC_KEYS.has(camelKey) && value !== null && value !== undefined
        ? Number(value).toFixed(2)
        : value;
  }

  try {
    const [row] = await db.update(coupons).set(update).where(eq(coupons.id, id)).returning();

    if (!row) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 500 });
    }

    return NextResponse.json({ coupon: toSnakeCase(row) });
  } catch (e) {
    logger.error("coupon update failed", { id, error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isDatabaseConfigured()) {
    demoStore.deleteCoupon(id);
    return NextResponse.json({ success: true });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    await db.delete(coupons).where(eq(coupons.id, id));
    return NextResponse.json({ success: true });
  } catch (e) {
    logger.error("coupon delete failed", { id, error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
