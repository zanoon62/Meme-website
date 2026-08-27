/**
 * PATCH /api/admin/returns/[id] — update return status + admin note
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { returns } from "@/lib/db/schema";
import { toSnakeCase } from "@/lib/db/to-snake-case";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const UpdateReturnSchema = z.object({
  status: z.enum(["pending", "reviewing", "approved", "rejected", "refunded"]).optional(),
  admin_note: z.string().max(1000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = await limiters.admin(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Demo mode — no database configured, so there's no returns table to update.
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Not available in demo mode" }, { status: 503 });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateReturnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const update: { status?: typeof parsed.data.status; adminNote?: string } = {};
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.admin_note !== undefined) update.adminNote = parsed.data.admin_note;

  try {
    const [updated] = await db.update(returns).set(update).where(eq(returns.id, id)).returning();

    if (!updated) {
      logger.error("admin return PATCH failed", { id, error: "not found" });
      return NextResponse.json({ error: "Return not found" }, { status: 500 });
    }

    logger.info("return updated", { id, status: parsed.data.status });
    return NextResponse.json({ ok: true, return: toSnakeCase(updated) });
  } catch (e) {
    logger.error("admin return PATCH failed", { id, error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
