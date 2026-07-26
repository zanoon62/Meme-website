"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";

/**
 * SmartImage — drop-in replacement for next/image that automatically disables
 * the image optimizer for same-origin `/api/...` URLs (which return dynamic
 * SVGs that don't benefit from optimization and would otherwise trip
 * Next.js 16's strict `localPatterns` query-string rules).
 *
 * For all other URLs (remote patterns, static imports, etc.) it behaves
 * exactly like next/image.
 */
type SmartImageProps = Omit<ImageProps, "src"> & {
  src: string;
};

function isUnoptimizedSrc(src: string): boolean {
  // Bypass optimizer for any same-origin API path that returns SVGs
  return src.startsWith("/api/") || src.startsWith("data:image/svg");
}

export const SmartImage = React.forwardRef<HTMLImageElement, SmartImageProps>(
  function SmartImage({ src, unoptimized, alt, ...rest }, ref) {
    const bypass = isUnoptimizedSrc(src) || unoptimized === true;
    return (
      <Image
        ref={ref}
        src={src}
        alt={alt}
        unoptimized={bypass}
        {...rest}
      />
    );
  }
);
