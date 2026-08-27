import { NextRequest, NextResponse } from "next/server";
import { uploadBuffer, deleteObject, isStorageConfigured } from "@/lib/storage/client";
import { requireAdmin } from "@/lib/auth/admin-guard";

export const runtime = "nodejs";

const BUCKET = "homepage";
const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 82;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB raw input limit

/**
 * POST /api/admin/homepage-image
 * Accepts a multipart/form-data upload with field "file".
 * Resizes to ≤1920px, converts to WebP, and uploads to MinIO.
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
      return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 });
    }

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    let processedBuffer: Buffer;

    try {
      const sharp = (await import("sharp")).default;
      processedBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toBuffer();
    } catch {
      console.warn("sharp not available, uploading raw file");
      processedBuffer = rawBuffer;
    }

    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 7);
    const path = `${timestamp}-${rand}.webp`;

    const url = await uploadBuffer(BUCKET, path, processedBuffer, "image/webp");

    return NextResponse.json({ url });
  } catch (e) {
    console.error("POST /api/admin/homepage-image failed:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/homepage-image
 * Deletes a previously uploaded image by its storage path (relative to the bucket).
 * Body: { path: string }
 */
export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.error;

  if (!isStorageConfigured()) {
    return NextResponse.json({ ok: true });
  }
  try {
    const { path } = await req.json();
    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }
    await deleteObject(BUCKET, path);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/homepage-image failed:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
