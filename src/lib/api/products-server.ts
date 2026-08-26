import { unstable_cache } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { products as seedProducts } from "@/data/products";
import type { Product } from "@/components/providers/ui-provider";
import { dbProductToStore } from "@/lib/api/products";

export async function fetchAllProductsServer(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return seedProducts;
  }
  try {
    const supabase = createSupabaseServiceClient();
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

    if (error || !rows) {
      console.error("fetchAllProductsServer error:", error);
      return seedProducts;
    }

    const imageMap = new Map<string, string[]>();
    for (const img of images ?? []) {
      const arr = imageMap.get(img.product_id) ?? [];
      arr.push(img.url);
      imageMap.set(img.product_id, arr);
    }

    return rows.map((p) => ({
      ...dbProductToStore(p),
      images: imageMap.get(p.id) ?? [],
    }));
  } catch (err) {
    console.error("fetchAllProductsServer exception:", err);
    return seedProducts;
  }
}

export const getCachedProductsServer = unstable_cache(
  async () => fetchAllProductsServer(),
  ["all-products"],
  { revalidate: 60, tags: ["products"] }
);
