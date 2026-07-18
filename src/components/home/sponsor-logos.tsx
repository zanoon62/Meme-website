"use client";

import * as React from "react";

// Cloned from dream-stock3 reference sponsor-logos marquee.
// Renders a horizontally scrolling row of brand wordmarks.
const brands = [
  "ZARA",
  "H&M",
  "LACOSTE",
  "ADIDAS",
  "HOLLISTER",
  "PULL&BEAR",
  "BERSHKA",
  "HUGO BOSS",
  "URBERRY",
  "AMERICAN EAGLE",
  "STWD",
  "MEME ATELIER",
];

export function SponsorLogos() {
  return (
    <section
      aria-label="Our brands"
      className="bg-black border-y border-white/5 overflow-hidden"
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 lg:py-10 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#f6ec91]/80 mb-2">
          30+ Brands · One Store
        </p>
        <p className="text-sm text-muted-foreground mb-7">
          Authentic premium brands — shipped fast across Egypt
        </p>
      </div>
      {/* Marquee row */}
      <div className="relative overflow-hidden pb-8">
        {/* fade edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
        <div className="flex whitespace-nowrap animate-marquee">
          {[...brands, ...brands, ...brands].map((b, i) => (
            <span
              key={i}
              className="mx-10 font-display text-2xl lg:text-3xl tracking-[0.18em] font-bold text-white/60 hover:text-[#f6ec91] transition-colors"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
