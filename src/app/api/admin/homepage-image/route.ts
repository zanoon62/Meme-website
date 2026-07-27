import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

const BUCKET = "homepage-images";
const MAX_DIMENSION = 1920; // max width/height before resize
const WEBP_QUALITY = 82;    // WebP quality (0-100) — ~200 KB at 1920px
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB raw input limit

/**
 * POST /api/admin/homepage-image
 * Accepts a multipart/form-data upload with field "file".
 * Resizes to ≤1920px, converts to WebP, and uploads to Supabase Storage
 * in the "homepage-images" bucket.
 * Returns: { url: string }
 */
export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 });
    }

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    // ── Convert + compress using sharp (server-side) ──────────────────
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    let processedBuffer: Buffer;
    let ext = "webp";

    try {
      // Dynamic import so the edge runtime doesn't try to load sharp
      const sharp = (await import("sharp")).default;
      processedBuffer = await sharp(rawBuffer)
        .rotate()                          // auto-rotate from EXIF
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: "inside",                   // preserve aspect ratio
          withoutEnlargement: true,        // never upscale
        })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toBuffer();
    } catch {
      // sharp not available — upload as-is (should not happen in Node runtime)
      console.warn("sharp not available, uploading raw file");
      processedBuffer = rawBuffer;
      ext = file.type.split("/")[1] || "jpg";
    }

    // ── Upload to Supabase Storage ─────────────────────────────────────
    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 7);
    const path = `homepage/${timestamp}-${rand}.${ext}`;

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, processedBuffer, {
        contentType: "image/webp",
        cacheControl: "public, max-age=31536000, immutable",
        upsert: false,
      });

    if (error) {
      console.error("Supabase Storage upload failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ── Build the public URL ───────────────────────────────────────────
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e) {
    console.error("POST /api/admin/homepage-image failed:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/homepage-image
 * Deletes a previously uploaded image by its storage path.
 * Body: { path: string }  — the path segment after the bucket root
 */
export async function DELETE(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }
  try {
    const { path } = await req.json();
    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }
    // Safety: only allow deletion within homepage/ prefix
    if (!path.startsWith("homepage/")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/homepage-image failed:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
