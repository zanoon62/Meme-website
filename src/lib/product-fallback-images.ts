/**
 * Product fallback images catalog.
 * Provides curated, editorial high-fashion imagery for MEME products
 * whenever database-stored product images are missing or empty.
 */

const FALLBACK_MAP: Record<string, string[]> = {
  "fitted-vest": [
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=85",
  ],
  "wide-leg-vest-suit": [
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85",
  ],
  "sleeveless-tailored-suit": [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=85",
  ],
  "cropped-tailored-suit": [
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1548624149-f1e967a5f644?auto=format&fit=crop&w=1000&q=85",
  ],
  "cropped-suit": [
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1548624149-f1e967a5f644?auto=format&fit=crop&w=1000&q=85",
  ],
  "relaxed-fit-suit": [
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1000&q=85",
  ],
  "oversized-tailored-suit": [
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=85",
  ],
  "pinstripe-wide-leg-suit": [
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85",
  ],
  "blazer-dress": [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=85",
  ],
};

const DEFAULT_POOL = [
  "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=85",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85",
];

export function getProductFallbackImages(slug?: string, name?: string): string[] {
  const cleanSlug = (slug || "").toLowerCase().replace(/^\./, "").trim();
  const cleanName = (name || "").toLowerCase().trim();

  // Direct slug match
  if (cleanSlug && FALLBACK_MAP[cleanSlug]) {
    return FALLBACK_MAP[cleanSlug];
  }

  // Keyword match
  for (const [key, imgs] of Object.entries(FALLBACK_MAP)) {
    if (cleanSlug.includes(key) || cleanName.includes(key.replace(/-/g, " "))) {
      return imgs;
    }
  }

  if (cleanSlug.includes("vest") || cleanName.includes("vest")) {
    return FALLBACK_MAP["fitted-vest"];
  }
  if (cleanSlug.includes("blazer") || cleanName.includes("blazer") || cleanSlug.includes("dress")) {
    return FALLBACK_MAP["blazer-dress"];
  }
  if (cleanSlug.includes("pinstripe") || cleanName.includes("pinstripe")) {
    return FALLBACK_MAP["pinstripe-wide-leg-suit"];
  }
  if (cleanSlug.includes("cropped") || cleanName.includes("cropped")) {
    return FALLBACK_MAP["cropped-tailored-suit"];
  }

  return DEFAULT_POOL;
}
