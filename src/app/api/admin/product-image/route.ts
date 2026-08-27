import { NextRequest, NextResponse } from "next/server";
import { uploadBuffer, isStorageConfigured } from "@/lib/storage/client";
import { requireAdmin } from "@/lib/auth/admin-guard";

export const runtime = "nodejs";

const BUCKET = "products";
const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 85;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/admin/product-image
 * Accepts multipart/form-data upload with field "file".
 * Resizes, converts to WebP via sharp, and uploads to MinIO.
 * Returns: { url: string }
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "Object storage not configured" }, { status: 503 });
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
    let contentType = "image/webp";

    try {
      const sharp = (await import("sharp")).default;
      processedBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toBuffer();
    } catch {
      console.warn("sharp processing failed or unavailable, uploading raw buffer");
      processedBuffer = rawBuffer;
      ext = file.type.split("/")[1] || "jpg";
      contentType = file.type;
    }

    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 7);
    const path = `${timestamp}-${rand}.${ext}`;

    const url = await uploadBuffer(BUCKET, path, processedBuffer, contentType);

    return NextResponse.json({ url });
  } catch (e) {
    console.error("POST /api/admin/product-image failed:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
