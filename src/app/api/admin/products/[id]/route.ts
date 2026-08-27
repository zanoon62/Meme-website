/**
 * GET    /api/admin/products/[id] — get a single product (admin view)
 * PATCH  /api/admin/products/[id] — update a product
 * DELETE /api/admin/products/[id] — delete a product (admin role only)
 */

import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireAdmin, requireAdminRole } from "@/lib/auth/admin-guard";
import { storeProductToDb } from "@/lib/api/products";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db/client";
import { products, productImages } from "@/lib/db/schema";
import { toSnakeCase, toSnakeCaseArray } from "@/lib/db/to-snake-case";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;
  const { id } = await params;

  try {
    const [productRows, images] = await Promise.all([
      db.select().from(products).where(eq(products.id, id)).limit(1),
      db
        .select({
          url: productImages.url,
          alt: productImages.alt,
          sortOrder: productImages.sortOrder,
          isPrimary: productImages.isPrimary,
        })
        .from(productImages)
        .where(eq(productImages.productId, id))
        .orderBy(asc(productImages.sortOrder)),
    ]);

    const product = productRows[0];
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      product: { ...toSnakeCase(product), images: toSnakeCaseArray(images) },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 404 },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;
  const { id } = await params;
  const body = await req.json();

  const payload = storeProductToDb(body);

  const updateValues: Record<string, unknown> = {
    slug: payload.slug,
    name: payload.name,
    subtitle: payload.subtitle,
    description: payload.description,
    price: payload.price !== undefined ? String(payload.price) : undefined,
    compareAtPrice:
      payload.compare_at_price !== undefined
        ? payload.compare_at_price === null
          ? null
          : String(payload.compare_at_price)
        : undefined,
    currency: payload.currency,
    categoryName: payload.category_name,
    collectionName: payload.collection_name,
    colors: payload.colors,
    sizes: payload.sizes,
    material: payload.material,
    care: payload.care,
    inventory: payload.inventory,
    isNew: payload.is_new,
    isBestSeller: payload.is_best_seller,
    isTrending: payload.is_trending,
    isLimited: payload.is_limited,
    badges: payload.badges,
    tags: payload.tags,
    status: payload.status,
    rating: payload.rating !== undefined ? String(payload.rating) : undefined,
    reviewCount: payload.review_count,
  };
  // Strip undefined fields
  Object.keys(updateValues).forEach((k) => (updateValues[k] === undefined ? delete updateValues[k] : null));

  type ProductRow = typeof products.$inferSelect;
  let row: ProductRow | undefined;
  try {
    [row] = await db.update(products).set(updateValues).where(eq(products.id, id)).returning();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.warn("product update failed", { id, error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!row) {
    logger.warn("product update failed", { id, error: "Product not found" });
    return NextResponse.json({ error: "Product not found" }, { status: 400 });
  }

  // Replace images if provided
  if (body.images) {
    await db.transaction(async (tx) => {
      await tx.delete(productImages).where(eq(productImages.productId, id));
      if (body.images.length) {
        await tx.insert(productImages).values(
          body.images.map((url: string, i: number) => ({
            productId: id,
            url,
            sortOrder: i,
            isPrimary: i === 0,
            alt: body.name,
          })),
        );
      }
    });
  }

  logger.info("product updated", { id, by: guard.userId });
  try {
    const { revalidateTag, revalidatePath } = await import("next/cache");
    (revalidateTag as any)("products");
    revalidatePath("/", "page");
    revalidatePath("/shop", "page");
  } catch {}

  return NextResponse.json({ product: toSnakeCase(row) });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdminRole();
  if (!guard.ok) return guard.error;
  const { id } = await params;

  // Soft-delete via status=archived (preserves order_items foreign keys)
  try {
    await db.update(products).set({ status: "archived" }).where(eq(products.id, id));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.warn("product archive failed", { id, error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  logger.info("product archived", { id, by: guard.userId });
  try {
    const { revalidateTag, revalidatePath } = await import("next/cache");
    (revalidateTag as any)("products");
    revalidatePath("/", "page");
    revalidatePath("/shop", "page");
  } catch {}

  return NextResponse.json({ success: true });
}
