/**
 * GET /api/homepage — public edge-cached homepage configuration
 *
 * Edge cached with stale-while-revalidate to ensure fast, instant
 * delivery from CDN edge nodes with minimal Supabase DB egress.
 */

import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ config: null }, { status: 200 });
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("homepage_settings")
      .select("config")
      .eq("id", "main")
      .single();

    if (error || !data?.config) {
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
      { config: data.config },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
          "CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
          "Vercel-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
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
