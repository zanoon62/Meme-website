import type { NextConfig } from "next";

function minioRemotePatterns(): { protocol: "http" | "https"; hostname: string; port?: string }[] {
  const raw = process.env.MINIO_PUBLIC_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw);
    return [
      {
        protocol: url.protocol === "https:" ? "https" : "http",
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
      },
    ];
  } catch {
    return []; // ignore malformed URL at build time
  }
}

const nextConfig: NextConfig = {
  // Standalone output for the Docker build (self-hosted VPS deploy).
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // Type errors MUST fail the build in production
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Keep optimized images cached for 30 days — prevents re-processing the same
    // image on every cache miss. Critical for conserving free-tier transform quota.
    minimumCacheTTL: 2592000,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Allow dynamic SVG product images served by /api/product-img with any
    // query string. The `search` field is a glob that must include the
    // leading `?` and at least one wildcard to permit query strings.
    localPatterns: [
      { pathname: "/api/product-img", search: "?*" },
    ],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      // Admin-uploaded images hosted on self-hosted MinIO (MINIO_PUBLIC_URL)
      ...minioRemotePatterns(),
    ],
  },
  // Security & caching headers applied to every route
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Never cache the service worker
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
