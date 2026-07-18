/**
 * GET /sitemap.xml — dynamic sitemap listing all products, collections, categories.
 *
 * Cached at the edge for 1 hour. Re-validates on each request once the cache
 * expires. For very large catalogs, switch to incremental static regeneration
 * or a static sitemap generated at build time.
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { products as seedProducts, collections, categories } from "@/data/products";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://meme.example.com";

export const revalidate = 3600; // 1 hour

export async function GET() {
  const urls: { loc: string; lastmod?: string; changefreq: string; priority: number }[] = [
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: 1.0 },
    { loc: `${SITE_URL}/shop`, changefreq: "daily", priority: 0.9 },
    { loc: `${SITE_URL}/wishlist`, changefreq: "weekly", priority: 0.3 },
    { loc: `${SITE_URL}/account`, changefreq: "weekly", priority: 0.3 },
  ];

  // Static categories & collections
  for (const cat of categories) {
    if (cat.slug === "all") continue;
    urls.push({
      loc: `${SITE_URL}/shop?category=${encodeURIComponent(cat.slug)}`,
      changefreq: "weekly",
      priority: 0.7,
    });
  }
  for (const col of collections) {
    urls.push({
      loc: `${SITE_URL}/collection/${col.slug}`,
      changefreq: "weekly",
      priority: 0.7,
    });
  }

  // Dynamic products
  let productSlugs: { slug: string; updated_at?: string }[] = seedProducts.map((p) => ({
    slug: p.slug,
  }));
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase
        .from("products")
        .select("slug, updated_at")
        .eq("status", "active");
      if (data && data.length > 0) productSlugs = data;
    } catch {
      // fall back to seed
    }
  }
  for (const p of productSlugs) {
    urls.push({
      loc: `${SITE_URL}/product/${p.slug}`,
      lastmod: p.updated_at,
      changefreq: "weekly",
      priority: 0.8,
    });
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod.split("T")[0]}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
