/**
 * GET  /api/reviews?productId=...   — list published reviews for a product
 * POST /api/reviews                  — submit a new review (auth required)
 *
 * Reviews are submitted with is_published=false by default — admin must
 * approve them in the dashboard before they appear publicly.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { customers, reviews } from "@/lib/db/schema";
import { isDatabaseConfigured } from "@/lib/db/config";
import { toSnakeCase, toSnakeCaseArray } from "@/lib/db/to-snake-case";
import { getCurrentSession } from "@/lib/auth/session";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const rl = await limiters.public(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  // Demo mode OR missing productId — return empty review set
  if (!productId || !isDatabaseConfigured()) {
    return NextResponse.json({ reviews: [], avgRating: null, count: 0, demo: !isDatabaseConfigured() });
  }

  try {
    const rows = await db
      .select({
        id: reviews.id,
        author: reviews.author,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        isVerified: reviews.isVerified,
        createdAt: reviews.createdAt,
        response: reviews.response,
        responseAt: reviews.responseAt,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.isPublished, true)))
      .orderBy(desc(reviews.createdAt))
      .limit(100);

    const count = rows.length;
    const avgRating =
      count > 0 ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : null;

    return NextResponse.json({ reviews: toSnakeCaseArray(rows), avgRating, count });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

const CreateReviewSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  const rl = await limiters.public(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  // Auth check — only logged-in customers can review
  const { user } = await getCurrentSession();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to leave a review." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = CreateReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Find the customer row
  let customerId: string | null = null;
  let authorName = user.email ?? "Anonymous";
  const [cust] = await db
    .select({ id: customers.id, firstName: customers.firstName, lastName: customers.lastName })
    .from(customers)
    .where(eq(customers.userId, user.id))
    .limit(1);
  if (cust) {
    customerId = cust.id;
    const name = [cust.firstName, cust.lastName].filter(Boolean).join(" ");
    if (name) authorName = name;
  }

  try {
    const [row] = await db
      .insert(reviews)
      .values({
        productId: parsed.data.product_id,
        customerId,
        author: authorName,
        rating: parsed.data.rating,
        title: parsed.data.title,
        body: parsed.data.body,
        isPublished: false, // require admin approval
        isVerified: false,
      })
      .returning();

    return NextResponse.json({ ok: true, review: toSnakeCase(row) }, { status: 201 });
  } catch (e) {
    logger.warn("review insert failed", { error: e instanceof Error ? e.message : String(e), user: user.id });
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
