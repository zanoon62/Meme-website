import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { isStorageConfigured, getMinioClient } from "@/lib/storage/client";

export const runtime = "nodejs";

/**
 * GET /api/admin/debug-upload
 * Returns diagnostic information to debug image upload failures.
 * Does NOT expose any secrets — only boolean flags and error messages.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  const storageConfigured = isStorageConfigured();

  const result: Record<string, unknown> = {
    storageConfigured,
    minioEndpointSet: Boolean(process.env.MINIO_ENDPOINT),
    minioPublicUrlSet: Boolean(process.env.MINIO_PUBLIC_URL),
    nodeEnv: process.env.NODE_ENV,
  };

  if (storageConfigured) {
    try {
      const client = getMinioClient();
      const exists = await client.bucketExists("homepage");
      result.bucketCheck = { ok: true, homepageBucketExists: exists };
    } catch (e: unknown) {
      result.bucketCheck = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }

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
