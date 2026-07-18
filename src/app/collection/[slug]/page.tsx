/**
 * Server component — validates slug against the seed catalog and returns
 * a real 404 (HTTP 404 status) for unknown collection slugs before
 * rendering the interactive client component.
 */

import { notFound } from "next/navigation";
import { collections } from "@/data/products";
import CollectionPageClient from "./collection-client";

// Pre-render only known slugs at build time. Unknown slugs return 404.
// In production with Supabase, new collections added via admin will be picked
// up on the next revalidate cycle (ISR).
export const dynamicParams = false;
export const revalidate = 60; // seconds

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exists = collections.some((c) => c.slug === slug);
  if (!exists) notFound();
  return <CollectionPageClient slug={slug} />;
}
