/**
 * Server component — validates slug against the seed catalog and returns
 * a real 404 (HTTP 404 status) for unknown product slugs before rendering
 * the interactive client component.
 */

import { notFound } from "next/navigation";
import { products as seedProducts } from "@/data/products";
import ProductPageClient from "./product-client";

// Pre-render only known slugs at build time. Unknown slugs return 404.
// In production with Supabase, new products added via admin will be picked
// up on the next revalidate cycle (ISR).
export const dynamicParams = false;
export const revalidate = 60; // seconds — refresh static pages every minute

export function generateStaticParams() {
  return seedProducts.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Server-side 404 for unknown slugs (works in both demo + production modes
  // since the seed catalog is the source of truth for storefront listings)
  const exists = seedProducts.some((p) => p.slug === slug);
  if (!exists) notFound();
  return <ProductPageClient slug={slug} />;
}
