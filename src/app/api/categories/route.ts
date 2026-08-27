/**
 * GET /api/categories — public endpoint to list active categories for storefront
 */

import { NextResponse } from "next/server";
import { asc, eq, isNull, or } from "drizzle-orm";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { toSnakeCaseArray } from "@/lib/db/to-snake-case";
import { demoStore } from "@/lib/demo-store";

const CACHE_HEADERS = {
  // Categories change infrequently — cache for 5 minutes at the reverse
  // proxy, serve stale for up to 1 hour while revalidating in the
  // background (Nginx proxy_cache honors this on the VPS, same as Vercel's
  // edge cache did before — see docs/VPS_DEPLOYMENT.md).
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
} as const;

export async function GET() {
  if (!isDatabaseConfigured()) {
    const list = demoStore.listCategories().filter((c) => c.is_active !== false);
    return NextResponse.json({ categories: list }, { headers: CACHE_HEADERS });
  }

  try {
    const rows = await db
      .select()
      .from(categories)
      .where(or(eq(categories.isActive, true), isNull(categories.isActive)))
      .orderBy(asc(categories.sortOrder));

    return NextResponse.json({ categories: toSnakeCaseArray(rows) }, { headers: CACHE_HEADERS });
  } catch {
    const list = demoStore.listCategories().filter((c) => c.is_active !== false);
    return NextResponse.json({ categories: list }, { headers: CACHE_HEADERS });
  }
}
