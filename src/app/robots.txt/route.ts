/**
 * GET /robots.txt — dynamic robots.txt.
 *
 * Allows all crawlers, points to sitemap.xml, blocks /admin, /api, /account.
 */

import { NextResponse } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://meme.example.com";

export function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /api
Disallow: /api/*
Disallow: /account
Disallow: /account/*
Disallow: /checkout
Disallow: /wishlist

Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
