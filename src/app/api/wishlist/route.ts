/**
 * GET    /api/wishlist        — list current user's wishlist
 * POST   /api/wishlist        — add a product to wishlist
 * DELETE /api/wishlist?id=... — remove a product from wishlist
 *
 * All routes require a logged-in customer. Guests get 401.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { requireCustomerSession } from "@/lib/auth/customer-guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { productImages, products, wishlists } from "@/lib/db/schema";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const rl = await limiters.public(req);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Demo mode: no auth — return empty wishlist so client doesn't crash
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ items: [], demo: true });
  }

  const guard = await requireCustomerSession();
  if (!guard.ok) return guard.error;

  try {
    const rows = await db
      .select({
        productId: wishlists.productId,
        createdAt: wishlists.createdAt,
        product: {
          id: products.id,
          slug: products.slug,
          name: products.name,
          price: products.price,
        },
      })
      .from(wishlists)
      .leftJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.customerId, guard.customerId))
      .orderBy(desc(wishlists.createdAt));

    const productIds = rows.map((r) => r.product?.id).filter((id): id is string => Boolean(id));

    const imagesByProduct = new Map<string, { url: string }[]>();
    if (productIds.length > 0) {
      const images = await db
        .select({ productId: productImages.productId, url: productImages.url })
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
        .orderBy(asc(productImages.sortOrder));

      for (const img of images) {
        if (!img.productId) continue;
        const list = imagesByProduct.get(img.productId) ?? [];
        list.push({ url: img.url });
        imagesByProduct.set(img.productId, list);
      }
    }

    const items = rows.map((r) => ({
      product_id: r.productId,
      created_at: r.createdAt,
      products: r.product?.id
        ? {
            id: r.product.id,
            slug: r.product.slug,
            name: r.product.name,
            price: r.product.price,
            images: imagesByProduct.get(r.product.id) ?? [],
          }
        : null,
    }));

    return NextResponse.json({ items });
  } catch (e) {
    logger.error("wishlist fetch failed", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

const AddSchema = z.object({ product_id: z.string().uuid() });

export async function POST(req: NextRequest) {
  const rl = await limiters.public(req);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guard = await requireCustomerSession();
  if (!guard.ok) return guard.error;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    // No DB-level unique constraint on (customer_id, product_id) to rely on
    // via onConflict — check first so a repeat add is a graceful no-op, and
    // still catch a unique-violation as a fallback in case of a race or a
    // constraint added out-of-band.
    const [existing] = await db
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(and(eq(wishlists.customerId, guard.customerId), eq(wishlists.productId, parsed.data.product_id)))
      .limit(1);

    if (!existing) {
      await db.insert(wishlists).values({
        customerId: guard.customerId,
        productId: parsed.data.product_id,
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "23505") {
      return NextResponse.json({ ok: true }, { status: 201 });
    }
    logger.warn("wishlist add failed", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guard = await requireCustomerSession();
  if (!guard.ok) return guard.error;

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("id");
  if (!productId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await db
      .delete(wishlists)
      .where(and(eq(wishlists.customerId, guard.customerId), eq(wishlists.productId, productId)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
