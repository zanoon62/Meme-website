/**
 * GET  /api/admin/reviews — list all reviews
 * POST /api/admin/reviews/[id] — handled by dynamic route (PATCH)
 */

import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { reviews, products } from "@/lib/db/schema";
import { toSnakeCaseArray } from "@/lib/db/to-snake-case";
import { demoStore } from "@/lib/demo-store";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("product_id");
  const status = searchParams.get("status"); // published | unpublished | all

  if (!isDatabaseConfigured()) {
    let list = demoStore.listReviews();
    if (productId) {
      list = list.filter((r) => r.product_id === productId);
    }
    if (status === "published") {
      list = list.filter((r) => r.is_published);
    } else if (status === "unpublished") {
      list = list.filter((r) => !r.is_published);
    }
    return NextResponse.json({ reviews: list, total: list.length });
  }

  try {
    const conditions: SQL[] = [];
    if (productId) conditions.push(eq(reviews.productId, productId));
    if (status === "published") conditions.push(eq(reviews.isPublished, true));
    else if (status === "unpublished") conditions.push(eq(reviews.isPublished, false));

    const rows = await db
      .select({
        id: reviews.id,
        productId: reviews.productId,
        productName: products.name,
        customerName: reviews.author,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        isPublished: reviews.isPublished,
        isVerified: reviews.isVerified,
        publicResponse: reviews.response,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .leftJoin(products, eq(reviews.productId, products.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(reviews.createdAt));

    return NextResponse.json({ reviews: toSnakeCaseArray(rows), total: rows.length });
  } catch (e) {
    logger.error("admin reviews GET failed", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ reviews: [], total: 0 });
  }
}
