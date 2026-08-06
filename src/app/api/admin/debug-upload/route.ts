import { NextResponse } from "next/server";
import { isSupabaseConfigured, isSupabaseServiceConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

/**
 * GET /api/admin/debug-upload
 * Returns diagnostic information to debug image upload failures.
 * Does NOT expose any secrets — only boolean flags and error messages.
 */
export async function GET() {
  const supabaseConfigured = isSupabaseConfigured();
  const serviceConfigured = isSupabaseServiceConfigured();

  const result: Record<string, unknown> = {
    supabaseConfigured,
    serviceRoleConfigured: serviceConfigured,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 40) + "..."
      : "NOT SET",
    serviceKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: process.env.NODE_ENV,
  };

  // If Supabase is configured, try a real bucket check
  if (serviceConfigured) {
    try {
      const { createSupabaseServiceClient } = await import("@/lib/supabase/server");
      const supabase = createSupabaseServiceClient();

      // Try to list files in homepage-images bucket (will fail if bucket doesn't exist)
      const { data, error } = await supabase.storage
        .from("homepage-images")
        .list("homepage", { limit: 1 });

      result.bucketCheck = error
        ? { ok: false, error: error.message }
        : { ok: true, fileCount: data?.length ?? 0 };
    } catch (e: unknown) {
      result.bucketCheck = {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }

    // Try sharp import
    try {
      await import("sharp");
      result.sharpAvailable = true;
    } catch {
      result.sharpAvailable = false;
      result.sharpNote = "sharp not available — will upload raw (still works)";
    }
  }

  return NextResponse.json(result);
}
