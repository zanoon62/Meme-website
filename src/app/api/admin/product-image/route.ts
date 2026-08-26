import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/auth/admin-guard";

export const runtime = "nodejs";

const BUCKET = "homepage-images"; // Use existing public bucket or fallbacks
const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 85;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/admin/product-image
 * Accepts multipart/form-data upload with field "file".
 * Resizes, converts to WebP via sharp, and uploads to Supabase Storage.
 * Returns: { url: string }
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
    }

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    let processedBuffer: Buffer;
    let ext = "webp";

    try {
      const sharp = (await import("sharp")).default;
      processedBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toBuffer();
    } catch {
      console.warn("sharp processing failed or unavailable, uploading raw buffer");
      processedBuffer = rawBuffer;
      ext = file.type.split("/")[1] || "jpg";
    }

    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 7);
    const path = `products/${timestamp}-${rand}.${ext}`;

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, processedBuffer, {
        contentType: ext === "webp" ? "image/webp" : file.type,
        cacheControl: "public, max-age=31536000, immutable",
        upsert: false,
      });

    if (error) {
      console.error("Product image upload to storage failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e) {
    console.error("POST /api/admin/product-image failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
