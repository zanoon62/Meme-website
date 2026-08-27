import { unstable_cache } from "next/cache";
import { asc, desc, eq } from "drizzle-orm";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { productImages, products } from "@/lib/db/schema";
import { products as seedProducts } from "@/data/products";
import type { Product } from "@/components/providers/ui-provider";
import { dbProductToStore, type ApiProductRow } from "@/lib/api/products";
import { toSnakeCase } from "@/lib/db/to-snake-case";
import { getProductFallbackImages } from "@/lib/product-fallback-images";

export async function fetchAllProductsServer(): Promise<Product[]> {
  if (!isDatabaseConfigured()) {
    return seedProducts;
  }

  try {
    const [rows, images] = await Promise.all([
      db.select().from(products).where(eq(products.status, "active")).orderBy(desc(products.createdAt)),
      db
        .select({
          productId: productImages.productId,
          url: productImages.url,
          sortOrder: productImages.sortOrder,
        })
        .from(productImages)
        .orderBy(asc(productImages.sortOrder)),
    ]);

    if (rows.length === 0) {
      return seedProducts;
    }

    const imageMap = new Map<string, string[]>();
    for (const img of images) {
      if (!img.productId) continue;
      const arr = imageMap.get(img.productId) ?? [];
      arr.push(img.url);
      imageMap.set(img.productId, arr);
    }

    return rows.map((product) => {
      const productImageUrls = imageMap.get(product.id) ?? [];
      return {
        ...dbProductToStore(toSnakeCase(product) as unknown as ApiProductRow),
        images: productImageUrls.length
          ? productImageUrls
          : getProductFallbackImages(product.slug, product.name),
      };
    });
  } catch (err) {
    console.warn("Postgres products fetch failed, using seedProducts:", err);
    return seedProducts;
  }
}

export const getCachedProductsServer = unstable_cache(
  async () => fetchAllProductsServer(),
  ["all-products"],
  { revalidate: 60, tags: ["products"] }
);
