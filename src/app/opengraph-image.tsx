/**
 * Default site OG image (used when no per-page OG image is set).
 * Generated at the edge using Next.js ImageResponse.
 *
 * Served at /opengraph-image
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MEME Atelier — Premium Women's Fashion";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)",
          color: "white",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              background: "white",
              color: "#0d0d0d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            M
          </div>
          <span style={{ fontSize: 24, letterSpacing: 6, textTransform: "uppercase" }}>
            MEME Atelier
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h1
            style={{
              fontSize: 96,
              lineHeight: 1,
              margin: 0,
              fontWeight: 700,
              letterSpacing: -2,
            }}
          >
            Modern Streetwear.
            <br />
            <em style={{ fontWeight: 400 }}>Tailored Essentials.</em>
          </h1>
          <p style={{ fontSize: 28, color: "#a3a3a3", margin: 0 }}>
            Limited drops. Engineered for the modern wardrobe.
          </p>
        </div>
      </div>
    ),
    { ...size },
  );
}
