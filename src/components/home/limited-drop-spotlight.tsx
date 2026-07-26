"use client";

import * as React from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/components/providers/ui-provider";
import { formatPrice, calculateDiscount } from "@/lib/format";

/**
 * Spotlight for a single limited-drop product.
 * Full-bleed dark editorial layout — image on one side, copy + price on the other.
 */
export function LimitedDropSpotlight({ product }: { product: Product }) {
  if (!product) return null;
  const discount = calculateDiscount(product.price, product.compareAtPrice);
  return (
    <section className="border-t border-border/60">
      <div className="relative overflow-hidden bg-foreground text-background">
        <div className="grid lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[640px]"
          >
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute top-6 left-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/10 backdrop-blur text-background text-[10px] uppercase tracking-[0.25em] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-background animate-pulse" />
              Limited drop · {product.inventory} pieces
            </div>
          </motion.div>
          <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <p className="text-[11px] uppercase tracking-[0.3em] text-background/60 mb-5">
                Atelier Numbered Edition
              </p>
              <h2 className="font-display text-4xl lg:text-6xl tracking-tight leading-[1.05] mb-4">
                {product.name}
              </h2>
              <p className="text-base text-background/85 mb-8 leading-relaxed max-w-md">
                {product.description}
              </p>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-display text-3xl">{formatPrice(product.price, product.currency)}</span>
                {product.compareAtPrice && (
                  <span className="text-sm text-background/50 line-through">
                    {formatPrice(product.compareAtPrice, product.currency)}
                  </span>
                )}
                {discount && (
                  <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded-sm bg-background/10 ml-2">
                    Save {discount}%
                  </span>
                )}
              </div>
              <p className="text-xs text-background/60 mb-9">
                {product.material} · {product.care}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full h-12 px-8 group bg-background text-foreground hover:bg-background/90">
                  <Link href={`/product/${product.slug}`}>
                    Shop the drop
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full h-12 px-8 border-background/30 text-background hover:bg-background/10"
                >
                  <Link href="/shop?filter=limited">View all limited</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
