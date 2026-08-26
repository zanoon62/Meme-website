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
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error || !data) return seedProducts;

    const ids = data.map((p) => p.id);
    let images: Array<{ product_id: string; url: string; sort_order: number }> = [];
    if (ids.length > 0) {
      const { data: imgData } = await supabase
        .from("product_images")
        .select("product_id, url, sort_order")
        .in("product_id", ids)
        .order("sort_order", { ascending: true });
      images = (imgData as typeof images) ?? [];
    }

    const imageMap = new Map<string, string[]>();
    for (const img of images) {
      const arr = imageMap.get(img.product_id) ?? [];
      arr.push(img.url);
      imageMap.set(img.product_id, arr);
    }

    return data.map((p) => ({
      ...dbProductToStore(p),
      images: imageMap.get(p.id) ?? (p.compare_at_price ? ["https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=85&auto=format&fit=crop"] : []),
    }));
  } catch {
    return seedProducts;
  }
}

export const getCachedProductsServer = unstable_cache(
  async () => fetchAllProductsServer(),
  ["all-products"],
  { revalidate: 60, tags: ["products"] }
);
