import { unstable_cache } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseStaticClient } from "@/lib/supabase/server";
import { products as seedProducts } from "@/data/products";
import type { Product } from "@/components/providers/ui-provider";
import { dbProductToStore } from "@/lib/api/products";

export async function fetchAllProductsServer(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return seedProducts;
  }
  
  const supabase = createSupabaseStaticClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(url, sort_order)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error fetching products:", error);
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  if (!data) return [];

  return data.map((p) => {
    const { product_images, ...product } = p as typeof p & {
      product_images: Array<{ url: string; sort_order: number }>;
    };
    const images = [...(product_images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => img.url);
    return {
      ...dbProductToStore(product),
      images: images.length
        ? images
        : product.compare_at_price
          ? ["https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=85&auto=format&fit=crop"]
          : [],
    };
  });
}

export const getCachedProductsServer = unstable_cache(
  async () => fetchAllProductsServer(),
  ["all-products"],
  { revalidate: 60, tags: ["products"] }
);
