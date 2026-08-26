import { unstable_cache } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseStaticClient } from "@/lib/supabase/server";
import { products as seedProducts } from "@/data/products";
import type { Product } from "@/components/providers/ui-provider";
import { dbProductToStore } from "@/lib/api/products";
import { getProductFallbackImages } from "@/lib/product-fallback-images";

export async function fetchAllProductsServer(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return seedProducts;
  }
  
  try {
    const supabase = createSupabaseStaticClient();
    const [{ data: rows, error }, { data: images }] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("product_images")
        .select("product_id, url, sort_order")
        .order("sort_order", { ascending: true }),
    ]);

    if (error || !rows || rows.length === 0) {
      console.warn("Supabase products fetch failed or empty:", error?.message);
      return seedProducts;
    }

    const imageMap = new Map<string, string[]>();
    for (const img of images ?? []) {
      const arr = imageMap.get(img.product_id) ?? [];
      arr.push(img.url);
      imageMap.set(img.product_id, arr);
    }

    return rows.map((product) => {
      const productImages = imageMap.get(product.id) ?? [];
      return {
        ...dbProductToStore(product),
        images: productImages.length
          ? productImages
          : getProductFallbackImages(product.slug, product.name),
      };
    });
  } catch (err) {
    console.warn("Exception fetching products from Supabase, using seedProducts:", err);
    return seedProducts;
  }
}

export const getCachedProductsServer = unstable_cache(
  async () => fetchAllProductsServer(),
  ["all-products"],
  { revalidate: 60, tags: ["products"] }
);
