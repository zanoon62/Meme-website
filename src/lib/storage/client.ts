import { Client as MinioClient } from "minio";

/**
 * Self-hosted S3-compatible object storage (MinIO), replacing Supabase
 * Storage. Buckets: `products`, `homepage`, `returns` — split into real
 * buckets instead of reusing the old "homepage-images bucket for
 * everything" quirk, since this is a clean slate.
 */

export function isStorageConfigured(): boolean {
  return Boolean(process.env.MINIO_ENDPOINT) && Boolean(process.env.MINIO_ACCESS_KEY) && Boolean(process.env.MINIO_SECRET_KEY);
}

declare global {
  // eslint-disable-next-line no-var
  var __memeMinioClient: MinioClient | undefined;
}

function createClient(): MinioClient {
  const endPoint = process.env.MINIO_ENDPOINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;
  if (!endPoint || !accessKey || !secretKey) {
    throw new Error("MinIO is not configured (MINIO_ENDPOINT/MINIO_ACCESS_KEY/MINIO_SECRET_KEY).");
  }
  return new MinioClient({
    endPoint,
    port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 9000,
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey,
    secretKey,
  });
}

export function getMinioClient(): MinioClient {
  if (!globalThis.__memeMinioClient) {
    globalThis.__memeMinioClient = createClient();
  }
  return globalThis.__memeMinioClient;
}

const PUBLIC_READ_POLICY = (bucket: string) =>
  JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });

/** Idempotent — creates the bucket and sets a public-read policy if missing. */
export async function ensureBucket(bucket: string): Promise<void> {
  const client = getMinioClient();
  const exists = await client.bucketExists(bucket).catch(() => false);
  if (!exists) {
    await client.makeBucket(bucket);
  }
  await client.setBucketPolicy(bucket, PUBLIC_READ_POLICY(bucket));
}

/** Uploads a buffer and returns its public URL (built from MINIO_PUBLIC_URL). */
export async function uploadBuffer(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const client = getMinioClient();
  await ensureBucket(bucket);
  await client.putObject(bucket, path, buffer, buffer.length, {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
  });
  return publicUrl(bucket, path);
}

export function publicUrl(bucket: string, path: string): string {
  const base = process.env.MINIO_PUBLIC_URL;
  if (!base) throw new Error("MINIO_PUBLIC_URL is not set.");
  return `${base.replace(/\/$/, "")}/${bucket}/${path}`;
}

export async function deleteObject(bucket: string, path: string): Promise<void> {
  const client = getMinioClient();
  await client.removeObject(bucket, path);
}
