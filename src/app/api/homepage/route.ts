/**
 * GET /api/homepage — public edge-cached homepage configuration
 *
 * Edge cached with stale-while-revalidate to ensure fast, instant
 * delivery from CDN edge nodes with minimal database egress.
 */

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isDatabaseConfigured } from "@/lib/db/config";
import { db } from "@/lib/db/client";
import { homepageSettings } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ config: null }, { status: 200 });
  }

  try {
    const [row] = await db
      .select({ config: homepageSettings.config })
      .from(homepageSettings)
      .where(eq(homepageSettings.id, "main"))
      .limit(1);

    if (!row?.config) {
      return NextResponse.json(
        { config: null },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    return NextResponse.json(
      { config: row.config },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
