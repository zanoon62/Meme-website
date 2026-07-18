/**
 * Product data adapter — single source of truth for reading & writing
 * the product catalog.
 *
 * - If Supabase env vars are configured, all reads/writes go to Supabase.
 * - If not, reads fall back to /data/products.ts (seed) and writes are
 *   persisted to localStorage via the existing Zustand store.
 *
 * Components should never call Supabase directly — always go through
 * these functions so the fallback behavior is transparent.
 */

import type { Product, ProductColor, ProductSize } from "@/components/providers/ui-provider";
import { products as seedProducts } from "@/data/products";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseProduct = Database["public"]["Tables"]["products"]["Row"];

/** Map a Supabase product row to the storefront Product type */
export function dbProductToStore(p: SupabaseProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle ?? "",
    description: p.description ?? "",
    price: Number(p.price),
    compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : undefined,
    currency: p.currency,
    category: p.category_name ?? "",
    collection: p.collection_name ?? "",
    colors: (p.colors as ProductColor[]) ?? [],
    sizes: (p.sizes as ProductSize[]) ?? [],
    images: [], // filled by product_images join — see fetchAllProducts
    badges: p.badges ?? [],
    rating: Number(p.rating),
    reviewCount: p.review_count,
    inventory: p.inventory,
    material: p.material ?? "",
    care: p.care ?? "",
    isNew: p.is_new,
    isBestSeller: p.is_best_seller,
    isTrending: p.is_trending,
    isLimited: p.is_limited,
    tags: p.tags ?? [],
  };
}

/** Map a storefront Product to a Supabase insert payload */
export function storeProductToDb(p: Partial<Product>) {
  return {
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle,
    description: p.description,
    price: p.price ? Number(p.price) : undefined,
    compare_at_price: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    currency: p.currency ?? "EGP",
    category_name: p.category,
    collection_name: p.collection,
    colors: p.colors ?? [],
    sizes: p.sizes ?? [],
    material: p.material,
    care: p.care,
    inventory: p.inventory ? Number(p.inventory) : 0,
    is_new: p.isNew ?? false,
    is_best_seller: p.isBestSeller ?? false,
    is_trending: p.isTrending ?? false,
    is_limited: p.isLimited ?? false,
    badges: p.badges ?? [],
    tags: p.tags ?? [],
    status: "active" as const,
    rating: p.rating ?? 5,
    review_count: p.reviewCount ?? 0,
  };
}

/**
 * Fetch all active products (with images).
 * Falls back to seed data when Supabase isn't configured.
 */
export async function fetchAllProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return seedProducts;
  }
  try {
    const supabase = createSupabaseBrowserClient();
    const [{ data: rows, error }, { data: images }] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("product_images")
        .select("product_id, url, sort_order, is_primary")
        .order("sort_order", { ascending: true }),
    ]);

    if (error || !rows) return seedProducts;

    const imageMap = new Map<string, string[]>();
    for (const img of images ?? []) {
      const arr = imageMap.get(img.product_id) ?? [];
      arr.push(img.url);
      imageMap.set(img.product_id, arr);
    }

    return rows.map((p) => ({
      ...dbProductToStore(p),
      images:
        imageMap.get(p.id) ??
        (p.compare_at_price
          ? [
              "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=85&auto=format&fit=crop",
            ]
          : []),
    }));
  } catch {
    return seedProducts;
  }
}

/**
 * Fetch a single product by slug.
 */
export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return seedProducts.find((p) => p.slug === slug) ?? null;
  }
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("status", "active")
      .single();
    if (error || !data) return null;

    const { data: images } = await supabase
      .from("product_images")
      .select("url")
      .eq("product_id", data.id)
      .order("sort_order", { ascending: true });

    return {
      ...dbProductToStore(data),
      images:
        images?.map((i) => i.url) ??
        (data.compare_at_price
          ? [
              "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=85&auto=format&fit=crop",
            ]
          : []),
    };
  } catch {
    return seedProducts.find((p) => p.slug === slug) ?? null;
  }
}

/**
 * Server-side fetch using the service client (bypasses RLS).
 * Used by admin pages to read all products including drafts.
 *
 * NOTE: This function lives in a separate server-only module to avoid
 * pulling `next/headers` into client bundles. See:
 *   src/lib/api/products-server.ts
 */
