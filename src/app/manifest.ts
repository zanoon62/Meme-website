import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MEME Atelier — Premium Women's Fashion",
    short_name: "MEME",
    description:
      "Modern streetwear. Tailored essentials. Limited drops. Engineered for the modern wardrobe.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0d0d0d",
    icons: [
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml" },
    ],
    categories: ["shopping", "lifestyle"],
  };
}
