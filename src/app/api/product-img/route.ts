import { NextRequest } from "next/server";

export const runtime = "edge";

// Dynamic premium SVG product imagery — replaces Unsplash (which has no network
// access in the sandbox preview). Generates editorial-quality gradient compositions
// with subtle typography, color swatches, and category-specific silhouettes.

const PALETTES: Record<string, [string, string, string]> = {
  noir: ["#0d0d0d", "#2a2a2a", "#444"],
  bone: ["#e3dac9", "#d4c4a8", "#b8a585"],
  camel: ["#c19a6b", "#a07a4a", "#704b1f"],
  sage: ["#9caf88", "#7a8e6c", "#5a6e4c"],
  dusty: ["#c8a0a0", "#a87878", "#7a5050"],
  "dusty rose": ["#c8a0a0", "#a87878", "#7a5050"],
  champagne: ["#f7e7c4", "#e6d4a0", "#c4a86b"],
  burgundy: ["#5e1f2d", "#3e0f1d", "#1f0000"],
  slate: ["#708090", "#506070", "#304050"],
  cognac: ["#9a3833", "#7a2823", "#5a1813"],
  "indigo raw": ["#1a2960", "#0a1950", "#000940"],
  "washed black": ["#1a1a1a", "#0a0a0a", "#000000"],
  "stone wash": ["#a0a8b8", "#808898", "#606878"],
  stone: ["#8a8a7a", "#6a6a5a", "#4a4a3a"],
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

const CATEGORY_LABELS: Record<string, string> = {
  Tailoring: "TAILORING",
  "Hoodies & Sweatshirts": "KNITWEAR",
  Pants: "TROUSERS",
  Outerwear: "OUTERWEAR",
  Dresses: "DRESSES",
  Knitwear: "KNITWEAR",
  Skirts: "SKIRTS",
  Accessories: "ACCESSORIES",
  Footwear: "FOOTWEAR",
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") ?? "MEME";
  const category = url.searchParams.get("category") ?? "Fashion";
  const color = (url.searchParams.get("color") ?? "noir").toLowerCase();
  const idx = parseInt(url.searchParams.get("idx") ?? "0", 10);
  const w = parseInt(url.searchParams.get("w") ?? "1200", 10);
  const h = parseInt(url.searchParams.get("h") ?? "1500", 10);

  const palette = PALETTES[color] ?? PALETTES.noir;
  const seed = hashString(name + idx);

  const catLabel = CATEGORY_LABELS[category] ?? "ATELIER";
  const angle = 110 + (seed % 40);
  const haloX = 35 + (seed % 30);
  const haloY = 30 + (seed % 25);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" gradientTransform="rotate(${angle})">
      <stop offset="0%" stop-color="${palette[0]}"/>
      <stop offset="55%" stop-color="${palette[1]}"/>
      <stop offset="100%" stop-color="${palette[2]}"/>
    </linearGradient>
    <radialGradient id="halo" cx="${haloX}%" cy="${haloY}%" r="55%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="40%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="80%">
      <stop offset="60%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.45"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <pattern id="stripes" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="40" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#stripes)"/>
  <rect width="${w}" height="${h}" fill="url(#halo)"/>
  <rect width="${w}" height="${h}" fill="url(#vignette)"/>
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.5"/>

  <g font-family="Helvetica Neue, Arial, sans-serif" fill="#ffffff" fill-opacity="0.85">
    <text x="60" y="80" font-size="22" font-weight="700" letter-spacing="6">MEME</text>
    <text x="${w - 60}" y="80" font-size="14" letter-spacing="3" text-anchor="end" fill-opacity="0.7">ATELIER · CAIRO</text>
    <line x1="60" y1="100" x2="${w - 60}" y2="100" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1"/>
  </g>

  <g font-family="Georgia, Times New Roman, serif" fill="#ffffff" text-anchor="middle">
    <text x="${w / 2}" y="${h / 2 - 40}" font-size="${Math.min(96, w / 12)}" font-style="italic" font-weight="400" fill-opacity="0.95">
      ${escapeXml(name.split(" ").slice(0, 2).join(" "))}
    </text>
    <text x="${w / 2}" y="${h / 2 + 30}" font-size="${Math.min(48, w / 24)}" letter-spacing="8" fill-opacity="0.65" font-family="Helvetica Neue, Arial, sans-serif">
      ${catLabel}
    </text>
  </g>

  <g>
    ${palette
      .map(
        (c, i) => `
      <circle cx="${w / 2 - 50 + i * 50}" cy="${h - 200}" r="14" fill="${c}" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1"/>`
      )
      .join("")}
  </g>

  <g font-family="Helvetica Neue, Arial, sans-serif" fill="#ffffff" fill-opacity="0.7" font-size="13" letter-spacing="2">
    <line x1="60" y1="${h - 110}" x2="${w - 60}" y2="${h - 110}" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1"/>
    <text x="60" y="${h - 80}">REF · ${String(seed).slice(0, 6)}</text>
    <text x="${w - 60}" y="${h - 80}" text-anchor="end">${idx === 0 ? "LOOK 01" : `LOOK 0${idx + 1}`}</text>
    <text x="60" y="${h - 55}">MEME · SUITED BY MEME</text>
    <text x="${w - 60}" y="${h - 55}" text-anchor="end">EST. CAIRO · 2024</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
