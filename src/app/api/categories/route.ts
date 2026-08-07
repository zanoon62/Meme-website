/**
 * GET /api/categories — public endpoint to list active categories for storefront
 */

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { demoStore } from "@/lib/demo-store";

const CACHE_HEADERS = {
  // Categories change infrequently — cache for 5 minutes at the edge,
  // serve stale for up to 1 hour while revalidating in the background.
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
  "CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
  "Vercel-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
} as const;

export async function GET() {
  if (!isSupabaseConfigured()) {
    const list = demoStore.listCategories().filter((c) => c.is_active !== false);
    return NextResponse.json({ categories: list }, { headers: CACHE_HEADERS });
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .or("is_active.eq.true,is_active.is.null")
      .order("sort_order", { ascending: true });

    if (error || !data) {
      const list = demoStore.listCategories().filter((c) => c.is_active !== false);
      return NextResponse.json({ categories: list }, { headers: CACHE_HEADERS });
    }

    return NextResponse.json({ categories: data }, { headers: CACHE_HEADERS });
  } catch {
    const list = demoStore.listCategories().filter((c) => c.is_active !== false);
    return NextResponse.json({ categories: list }, { headers: CACHE_HEADERS });
  }
}
