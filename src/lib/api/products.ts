/**
 * Product data adapter shared between the client store and admin routes.
 *
 * `dbProductToStore`/`storeProductToDb` convert between the storefront
 * `Product` shape and the snake_case row shape returned by our API routes
 * (see src/lib/db/to-snake-case.ts — API routes convert Drizzle's camelCase
 * rows back to snake_case so this mapper, and the rest of the frontend,
 * didn't need to change during the Supabase -> Postgres migration).
 */

import type { Product, ProductColor, ProductSize } from "@/components/providers/ui-provider";

/** A product row as returned by the API (snake_case, matching DB column names). */
export interface ApiProductRow {
  id: string;
  slug: string;
  name: string;
  subtitle?: string | null;
  description?: string | null;
  price: number | string;
  compare_at_price?: number | string | null;
  currency?: string | null;
  category_name?: string | null;
  collection_name?: string | null;
  colors?: unknown;
  sizes?: unknown;
  badges?: string[] | null;
  rating?: number | string | null;
  review_count?: number | null;
  inventory?: number | null;
  material?: string | null;
  care?: string | null;
  is_new?: boolean | null;
  is_best_seller?: boolean | null;
  is_trending?: boolean | null;
  is_limited?: boolean | null;
  tags?: string[] | null;
}

/** Map an API product row to the storefront Product type */
export function dbProductToStore(p: ApiProductRow): Product {
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
    colors: (p.colors as ProductColor[]) ?? [],
    sizes: (p.sizes as ProductSize[]) ?? [],
    images: [], // filled by product_images join — see the API route response
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
}

/** Map a storefront Product to an API insert/update payload (snake_case) */
export function storeProductToDb(p: Partial<Product>) {
  return {
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle,
    description: p.description,
    price: p.price !== undefined && p.price !== null ? Number(p.price) : undefined,
    compare_at_price: p.compareAtPrice !== undefined && p.compareAtPrice !== null ? Number(p.compareAtPrice) : null,
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
