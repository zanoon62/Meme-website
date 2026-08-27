/**
 * GET  /api/admin/products — list all products (incl. drafts) for admin
 * POST /api/admin/products — create a new product
 *
 * Secured: caller must be authenticated staff/admin (see requireAdmin).
 * In demo mode (DB not configured), GET returns seed data so the
 * admin panel is still explorable; writes are blocked.
 */

import { NextRequest, NextResponse } from "next/server";
import { asc, desc } from "drizzle-orm";
import { requireAdmin, requireAdminRole } from "@/lib/auth/admin-guard";
import { storeProductToDb } from "@/lib/api/products";
import { limiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { products as seedProducts } from "@/data/products";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { products, productImages } from "@/lib/db/schema";
import { toSnakeCase } from "@/lib/db/to-snake-case";

export async function GET(req: NextRequest) {
  const rl = await limiters.admin(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  // Demo mode: return seed products so admin panel is explorable without DB
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      products: seedProducts.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        description: p.description,
        price: p.price,
        compare_at_price: p.compareAtPrice ?? null,
        currency: p.currency,
        category_name: p.category,
        collection_name: p.collection,
        inventory: p.inventory,
        status: "active",
        images: p.images,
        is_featured: p.isLimited,
        created_at: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
      })),
      demo: true,
    });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const [rows, images] = await Promise.all([
      db.select().from(products).orderBy(desc(products.createdAt)),
      db
        .select({ productId: productImages.productId, url: productImages.url })
        .from(productImages)
        .orderBy(asc(productImages.sortOrder)),
    ]);

    const imageMap = new Map<string, string[]>();
    for (const img of images) {
      if (!img.productId) continue;
      const arr = imageMap.get(img.productId) ?? [];
      arr.push(img.url);
      imageMap.set(img.productId, arr);
    }

    return NextResponse.json({
      products: rows.map((p) => ({
        ...toSnakeCase(p),
        images: imageMap.get(p.id) ?? [],
      })),
    });
  } catch (e) {
    logger.error("admin products GET exception", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const rl = await limiters.admin(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const body = await req.json();

    const payload = storeProductToDb(body);

    // Auto-generate slug from name if not provided
    if (!payload.slug && payload.name) {
      payload.slug = payload.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    }

    if (!payload.slug || !payload.name || payload.price === undefined || isNaN(payload.price)) {
      return NextResponse.json(
        { error: "Missing required fields: slug, name, price" },
        { status: 400 },
      );
    }

    type ProductRow = typeof products.$inferSelect;
    let row: ProductRow;
    try {
      [row] = await db
        .insert(products)
        .values({
          slug: payload.slug,
          name: payload.name,
          subtitle: payload.subtitle,
          description: payload.description,
          price: String(payload.price),
          compareAtPrice: payload.compare_at_price != null ? String(payload.compare_at_price) : null,
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
          rating: payload.rating != null ? String(payload.rating) : undefined,
          reviewCount: payload.review_count,
        })
        .returning();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      logger.warn("admin product create failed", { error: message, slug: payload.slug });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Insert images if provided
    const insertedImages: string[] = [];
    if (Array.isArray(body.images) && body.images.length > 0) {
      const validImages = body.images.filter((u: unknown) => typeof u === "string" && u.trim().length > 0);
      if (validImages.length > 0) {
        try {
          await db.insert(productImages).values(
            validImages.map((url: string, i: number) => ({
              productId: row.id,
              url: url.trim(),
              sortOrder: i,
              isPrimary: i === 0,
              alt: body.name || "",
            })),
          );
          insertedImages.push(...validImages);
        } catch (e) {
          logger.warn("product image insert failed", {
            productId: row.id,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    }

    logger.info("product created", { productId: row.id, slug: payload.slug, by: guard.userId });

    // Purge cached products immediately
    try {
      const { revalidateTag, revalidatePath } = await import("next/cache");
      (revalidateTag as any)("products");
      revalidatePath("/", "page");
      revalidatePath("/shop", "page");
    } catch {}

    return NextResponse.json({ product: { ...toSnakeCase(row), images: insertedImages } }, { status: 201 });
  } catch (e) {
    logger.error("admin product create exception", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// DELETE requires admin role (not just staff)
export async function DELETE(req: NextRequest) {
  const guard = await requireAdminRole();
  if (!guard.ok) return guard.error;
  // (this route is handled by [id]/route.ts; this is a safety net)
  return NextResponse.json({ error: "Use /api/admin/products/[id]" }, { status: 400 });
}
