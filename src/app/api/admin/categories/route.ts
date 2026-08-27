/**
 * GET    /api/admin/categories        — list all categories
 * POST   /api/admin/categories        — create a category
 * PATCH  /api/admin/categories?id=   — update a category
 * DELETE /api/admin/categories?id=   — delete a category
 */

import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { toSnakeCase, toSnakeCaseArray } from "@/lib/db/to-snake-case";
import { demoStore } from "@/lib/demo-store";
import { logger } from "@/lib/logger";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ categories: demoStore.listCategories() });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    return NextResponse.json({ categories: toSnakeCaseArray(rows) });
  } catch (e) {
    logger.error("categories GET failed", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ categories: [] });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    slug?: string;
    name?: string;
    description?: string;
    image_url?: string;
    sort_order?: number;
    is_active?: boolean;
  };

  if (!body.slug || !body.name) {
    return NextResponse.json({ error: "Missing required fields: slug, name" }, { status: 400 });
  }

  if (!isDatabaseConfigured()) {
    const cat = demoStore.createCategory({
      slug: body.slug,
      name: body.name,
      description: body.description,
      image_url: body.image_url,
    });
    return NextResponse.json({ category: cat }, { status: 201 });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const [row] = await db
      .insert(categories)
      .values({
        slug: body.slug,
        name: body.name,
        description: body.description ?? null,
        imageUrl: body.image_url ?? null,
        sortOrder: body.sort_order ?? 0,
        isActive: body.is_active ?? true,
      })
      .returning();

    logger.info("category created", { id: row.id, by: guard.userId });
    return NextResponse.json({ category: toSnakeCase(row) }, { status: 201 });
  } catch (e) {
    logger.warn("category create failed", { error: e instanceof Error ? e.message : String(e), slug: body.slug });
    const cat = demoStore.createCategory({
      slug: body.slug,
      name: body.name,
      description: body.description,
      image_url: body.image_url,
    });
    return NextResponse.json({ category: cat }, { status: 201 });
  }
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const body = (await req.json()) as {
    slug?: string;
    name?: string;
    description?: string;
    is_active?: boolean;
  };

  if (!isDatabaseConfigured()) {
    // demo mode: just return success (no persistent store for updates)
    return NextResponse.json({ ok: true });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    const [row] = await db
      .update(categories)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.is_active !== undefined && { isActive: body.is_active }),
      })
      .where(eq(categories.id, id))
      .returning();

    logger.info("category updated", { id, by: guard.userId });
    return NextResponse.json({ category: toSnakeCase(row) });
  } catch (e) {
    logger.error("category update failed", { error: e instanceof Error ? e.message : String(e), id });
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (!isDatabaseConfigured()) {
    // demo mode: just acknowledge
    return NextResponse.json({ ok: true });
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  try {
    await db.delete(categories).where(eq(categories.id, id));
    logger.info("category deleted", { id, by: guard.userId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("category delete failed", { error: e instanceof Error ? e.message : String(e), id });
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
