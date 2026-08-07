/**
 * Server component — validates slug against the seed catalog and returns
 * a real 404 (HTTP 404 status) for unknown product slugs before rendering
 * the interactive client component.
 */

import { notFound } from "next/navigation";
import { products as seedProducts } from "@/data/products";
import ProductPageClient from "./product-client";

// Allow new products created at runtime to render dynamically
export const dynamicParams = true;
export const revalidate = 300; // 5 minutes — products don't change every minute; reduces function invocations on free tier

export function generateStaticParams() {
  return seedProducts.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductPageClient slug={slug} />;
}
