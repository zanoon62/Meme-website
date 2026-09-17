/**
 * PATCH  /api/admin/reviews/[id] — update review (publish/unpublish/respond)
 * DELETE /api/admin/reviews/[id] — permanently remove a review (spam/abuse)
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { reviews } from "@/lib/db/schema";
import { toSnakeCase } from "@/lib/db/to-snake-case";
import { demoStore } from "@/lib/demo-store";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (!isDatabaseConfigured()) {
    const updated = demoStore.updateReview(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    return NextResponse.json({ review: updated, success: true });
  }

  try {
    const patch: Record<string, unknown> = {};
    if (body.is_published !== undefined) patch.isPublished = body.is_published;
    if (body.is_verified !== undefined) patch.isVerified = body.is_verified;
    if (body.rating !== undefined) patch.rating = body.rating;
    if (body.title !== undefined) patch.title = body.title;
    if (body.body !== undefined) patch.body = body.body;
    if (body.public_response !== undefined) {
      patch.response = body.public_response;
      patch.responseAt = new Date();
    }

    const [row] = await db.update(reviews).set(patch).where(eq(reviews.id, id)).returning();
    if (!row) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    return NextResponse.json({ review: toSnakeCase(row), success: true });
  } catch (e) {
    logger.error("admin review PATCH failed", { error: e instanceof Error ? e.message : String(e), id });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const { id } = await params;

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, demo: true });
  }

  try {
    const [row] = await db.delete(reviews).where(eq(reviews.id, id)).returning({ id: reviews.id });
    if (!row) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    logger.info("admin review deleted", { id, by: guard.userId });
    return NextResponse.json({ success: true });
  } catch (e) {
    logger.error("admin review DELETE failed", { error: e instanceof Error ? e.message : String(e), id });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
