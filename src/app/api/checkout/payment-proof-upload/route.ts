/**
 * POST /api/checkout/payment-proof-upload — server-mediated upload for the
 * InstaPay/Vodafone Cash transfer screenshot a customer attaches during
 * checkout.
 *
 * Unauthenticated by design (guest checkout has no session yet) — abuse is
 * bounded by the same per-IP checkout rate limiter as order creation itself,
 * plus file type/size validation, same pattern as /api/returns/image-upload.
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadBuffer, isStorageConfigured } from "@/lib/storage/client";
import { limiters } from "@/lib/rate-limit";

export const runtime = "nodejs";

const BUCKET = "payment-proofs";
const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 85;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(req: NextRequest) {
  const rl = await limiters.checkout(req);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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
      return NextResponse.json({ error: "File too large (max 8 MB)" }, { status: 413 });
    }

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/heic"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    let processedBuffer: Buffer;
    let contentType = "image/webp";

    try {
      const sharp = (await import("sharp")).default;
      processedBuffer = await sharp(rawBuffer)
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toBuffer();
    } catch {
      processedBuffer = rawBuffer;
      contentType = file.type;
    }

    const ext = contentType === "image/webp" ? "webp" : file.type.split("/")[1] || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const url = await uploadBuffer(BUCKET, path, processedBuffer, contentType);

    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
