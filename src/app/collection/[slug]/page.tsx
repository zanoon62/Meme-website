/**
 * Server component. Collections are admin-managed (real DB rows via
 * /api/admin/collections), so any slug could be valid at request time —
 * unlike the old version, this can't pre-validate against a hardcoded seed
 * list. dynamicParams stays implicitly true; CollectionPageClient does the
 * real existence check against /api/collections/[slug] and 404s client-side
 * (via notFound()) when the collection doesn't exist or isn't active.
 */

import CollectionPageClient from "./collection-client";

export const revalidate = 300;

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CollectionPageClient slug={slug} />;
}
