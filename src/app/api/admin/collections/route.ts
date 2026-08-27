/**
 * GET  /api/admin/collections — list all collections
 * POST /api/admin/collections — create a collection (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { collections } from "@/lib/db/schema";
import { toSnakeCase, toSnakeCaseArray } from "@/lib/db/to-snake-case";
import { demoStore } from "@/lib/demo-store";
import { logger } from "@/lib/logger";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ collections: demoStore.listCollections() });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const rows = await db.select().from(collections).orderBy(asc(collections.sortOrder));
    if (!rows.length) {
      return NextResponse.json({ collections: demoStore.listCollections() });
    }
    return NextResponse.json({ collections: toSnakeCaseArray(rows) });
  } catch (e) {
    logger.error("collections GET failed, using fallback seed data", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ collections: demoStore.listCollections() });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    slug?: string;
    name?: string;
    tagline?: string;
    description?: string;
    image_url?: string;
    banner_url?: string;
    is_featured?: boolean;
    is_active?: boolean;
  };

  if (!body.slug || !body.name) {
    return NextResponse.json(
      { error: "Missing required fields: slug, name" },
      { status: 400 },
    );
  }

  // Demo mode — persist to in-memory store
  if (!isDatabaseConfigured()) {
    const col = demoStore.createCollection({
      slug: body.slug,
      name: body.name,
      tagline: body.tagline,
      description: body.description,
      cover_image: body.image_url,
      is_featured: body.is_featured,
    });
    return NextResponse.json({ collection: col }, { status: 201 });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const [row] = await db
      .insert(collections)
      .values({
        slug: body.slug,
        name: body.name,
        tagline: body.tagline ?? null,
        description: body.description ?? null,
        imageUrl: body.image_url ?? null,
        bannerUrl: body.banner_url ?? null,
        isFeatured: body.is_featured ?? false,
        isActive: body.is_active ?? true,
      })
      .returning();

    logger.info("collection created", { id: row.id, by: guard.userId });
    return NextResponse.json({ collection: toSnakeCase(row) }, { status: 201 });
  } catch (e) {
    logger.warn("collection create in DB failed, saving to demoStore fallback", {
      error: e instanceof Error ? e.message : String(e),
      slug: body.slug,
    });
    const col = demoStore.createCollection({
      slug: body.slug,
      name: body.name,
      tagline: body.tagline,
      description: body.description,
      cover_image: body.image_url,
      is_featured: body.is_featured,
    });
    return NextResponse.json({ collection: col }, { status: 201 });
  }
}
