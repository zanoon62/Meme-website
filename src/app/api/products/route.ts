/**
 * GET /api/products — public storefront product listing
 *
 * Returns active products only. Supports filtering by category,
 * collection, and search query.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseStaticClient } from "@/lib/supabase/server";
import { products as seedProducts } from "@/data/products";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const collection = searchParams.get("collection");
  const q = searchParams.get("q");

  if (!isSupabaseConfigured()) {
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
    const supabase = createSupabaseStaticClient();
    let query = supabase
      .from("products")
      .select("*, product_images(url, sort_order)")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category_name", category);
    }
    if (collection) {
      query = query.eq("collection_name", collection);
    }
    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const products = (data ?? []).map((row) => {
      const { product_images, ...p } = row as typeof row & {
        product_images: Array<{ url: string; sort_order: number }>;
      };
      const images = [...(product_images ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((img) => img.url);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle ?? "",
        description: p.description ?? "",
        price: Number(p.price),
        compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : undefined,
        currency: p.currency ?? "EGP",
        category: p.category_name ?? "",
        collection: p.collection_name ?? "",
        colors: p.colors ?? [],
        sizes: p.sizes ?? [],
        images,
        badges: p.badges ?? [],
        rating: Number(p.rating ?? 5),
        reviewCount: p.review_count ?? 0,
        inventory: p.inventory ?? 0,
        material: p.material ?? "",
        care: p.care ?? "",
        isNew: p.is_new ?? false,
        isBestSeller: p.is_best_seller ?? false,
        isTrending: p.is_trending ?? false,
        isLimited: p.is_limited ?? false,
        tags: p.tags ?? [],
      };
    });

    return NextResponse.json({ products }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        "CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        "Vercel-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
