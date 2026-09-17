/**
 * GET /api/collections — public storefront collection listing (active only)
 *
 * The admin's real Collections manager (/api/admin/collections) writes to
 * the same `collections` table, but nothing on the storefront previously
 * read from it — /collection/[slug] only recognized two hardcoded seed
 * slugs, so a collection an admin created via the real admin UI 404'd (or
 * showed an empty grid) whenever a homepage link pointed at it. This route,
 * plus /api/collections/[slug], are what /collection/[slug] now reads from.
 */

import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { collections } from "@/lib/db/schema";
import { toSnakeCaseArray } from "@/lib/db/to-snake-case";

export const runtime = "nodejs";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ collections: [] });
  }

  try {
    const rows = await db
      .select()
      .from(collections)
      .where(eq(collections.isActive, true))
      .orderBy(asc(collections.sortOrder));

    return NextResponse.json(
      { collections: toSnakeCaseArray(rows) },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 },
    );
  }
}
