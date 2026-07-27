import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

/**
 * GET /api/admin/homepage
 * Returns the current homepage config from Supabase.
 */
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

    if (error) {
      return NextResponse.json({ config: null }, { status: 200 });
    }
    return NextResponse.json({ config: data?.config ?? null });
  } catch (e) {
    console.error("GET /api/admin/homepage failed:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/homepage
 * Upserts the homepage config to Supabase.
 * Body: { config: HomepageConfig }
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, fallback: true });
  }
  try {
    const body = await req.json();
    const config = body?.config;
    if (!config || typeof config !== "object") {
      return NextResponse.json({ error: "config is required" }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from("homepage_settings")
      .upsert({ id: "main", config, updated_at: new Date().toISOString() });

    if (error) {
      console.error("Upsert homepage_settings failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/admin/homepage failed:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
