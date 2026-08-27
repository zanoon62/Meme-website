/**
 * GET /api/products — public storefront product listing
 *
 * Returns active products only. Supports filtering by category,
 * collection, and search query.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { productImages, products } from "@/lib/db/schema";
import { products as seedProducts } from "@/data/products";
import { getProductFallbackImages } from "@/lib/product-fallback-images";
import type { Product } from "@/components/providers/ui-provider";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const collection = searchParams.get("collection");
  const q = searchParams.get("q");

  if (!isDatabaseConfigured()) {
    let filtered = [...seedProducts];
    if (category && category !== "all") {
      filtered = filtered.filter((p) => p.category === category);
    }
    if (collection) {
      filtered = filtered.filter(
        (p) => p.collection.toLowerCase().replace(/\s+/g, "-") === collection
      );
    }
    if (q) {
      const lc = q.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(lc) ||
          p.subtitle.toLowerCase().includes(lc) ||
          p.tags.some((t) => t.toLowerCase().includes(lc))
      );
    }
    return NextResponse.json({ products: filtered });
  }

  try {
    const conditions = [eq(products.status, "active")];
    if (category && category !== "all") conditions.push(eq(products.categoryName, category));
    if (collection) conditions.push(eq(products.collectionName, collection));
    if (q) {
      conditions.push(
        or(ilike(products.name, `%${q}%`), ilike(products.description, `%${q}%`))!,
      );
    }

    const [rows, images] = await Promise.all([
      db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.createdAt)),
      db
        .select({
          productId: productImages.productId,
          url: productImages.url,
          sortOrder: productImages.sortOrder,
        })
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

    const result: Product[] = rows.map((p) => {
      const productImageUrls = imageMap.get(p.id) ?? [];
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle ?? "",
        description: p.description ?? "",
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
        currency: p.currency ?? "EGP",
        category: p.categoryName ?? "",
        collection: p.collectionName ?? "",
        colors: (p.colors as Product["colors"]) ?? [],
        sizes: (p.sizes as Product["sizes"]) ?? [],
        images: productImageUrls.length ? productImageUrls : getProductFallbackImages(p.slug, p.name),
        badges: p.badges ?? [],
        rating: Number(p.rating ?? 5),
        reviewCount: p.reviewCount ?? 0,
        inventory: p.inventory ?? 0,
        material: p.material ?? "",
        care: p.care ?? "",
        isNew: p.isNew ?? false,
        isBestSeller: p.isBestSeller ?? false,
        isTrending: p.isTrending ?? false,
        isLimited: p.isLimited ?? false,
        tags: p.tags ?? [],
      };
    });

    return NextResponse.json(
      { products: result },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
