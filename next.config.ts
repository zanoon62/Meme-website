import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel-native output (no `output: "standalone"` — that's Docker-only)
  reactStrictMode: true,
  poweredByHeader: false,
  // Type errors MUST fail the build in production
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow dynamic SVG product images served by /api/product-img with any
    // query string. The `search` field is a glob that must include the
    // leading `?` and at least one wildcard to permit query strings.
    localPatterns: [
      { pathname: "/api/product-img", search: "?*" },
    ],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      // Allow admin-uploaded images hosted on Supabase Storage
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
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
