/**
 * The public-facing origin of the site — NOT `req.nextUrl.origin` or
 * `new URL(request.url).origin`, which reflect the raw socket Next.js is
 * listening on (behind Nginx, that's the internal `127.0.0.1:3001`/
 * `0.0.0.0:3000` address, not `https://meme-eg.store`). Anything building
 * a URL that gets sent to a third party (Google's redirect_uri) or back to
 * the browser (a redirect Location header) must use this instead.
 */
export function getSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return "http://localhost:3000";
}
