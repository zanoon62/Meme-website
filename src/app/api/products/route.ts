/**
 * GET /api/products — public storefront product listing
 *
 * Returns active products only. Supports filtering by category,
 * collection, and search query.
 */

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { products as seedProducts } from "@/data/products";

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
    const supabase = createSupabaseBrowserClient();
    let query = supabase
      .from("products")
      .select("*")
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

    // Fetch images for these products
    const ids = (data ?? []).map((p) => p.id);
    const { data: images } = await supabase
      .from("product_images")
      .select("product_id, url, sort_order")
      .in("product_id", ids)
      .order("sort_order", { ascending: true });

    const imageMap = new Map<string, string[]>();
    for (const img of images ?? []) {
      const arr = imageMap.get(img.product_id) ?? [];
      arr.push(img.url);
      imageMap.set(img.product_id, arr);
    }

    const products = (data ?? []).map((p) => ({
      ...p,
      images: imageMap.get(p.id) ?? [],
    }));

    return NextResponse.json({ products });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
