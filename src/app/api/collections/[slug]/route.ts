/**
 * GET /api/collections/[slug] — public single-collection lookup, used by
 * /collection/[slug] to render the real DB-backed collection instead of
 * the old hardcoded 2-slug seed list.
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { collections } from "@/lib/db/schema";
import { toSnakeCase } from "@/lib/db/to-snake-case";

export const runtime = "nodejs";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ collection: null }, { status: 404 });
  }

  try {
    const [row] = await db.select().from(collections).where(eq(collections.slug, slug)).limit(1);
    if (!row || !row.isActive) {
      return NextResponse.json({ collection: null }, { status: 404 });
    }
    return NextResponse.json(
      { collection: toSnakeCase(row) },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 },
    );
  }
}
