"use client";

import * as React from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/components/providers/ui-provider";
import { formatPrice, calculateDiscount } from "@/lib/format";
import { useHomepageConfig } from "@/components/providers/homepage-store";
import { useLang } from "@/components/layout/language-toggle";

/**
 * Spotlight for a single limited-drop product.
 * Full-bleed dark editorial layout — image on one side, copy + price on the other.
 */
export function LimitedDropSpotlight({ product }: { product: Product }) {
  const config = useHomepageConfig();
  const [lang] = useLang();
  const isRtl = lang === "ar";

  if (!config.limitedDrop.visible) return null;
  if (!product) return null;

  const discount = calculateDiscount(product.price, product.compareAtPrice);
  const shopLabel = isRtl ? "تسوق التشكيلة" : "Shop the drop";
  const viewAllLabel = isRtl ? "عرض كل القطع المحدودة" : "View all limited";
  const editionLabel = isRtl ? "إصدار مرقم من الأتيليه" : "Atelier Numbered Edition";
  const piecesLabel = isRtl ? "قطعة" : "pieces";
  const limitedLabel = isRtl ? "تشكيلة محدودة" : "Limited drop";

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
              {limitedLabel} · {product.inventory} {piecesLabel}
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
                {editionLabel}
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
                    {isRtl ? `وفّر ${discount}٪` : `Save ${discount}%`}
                  </span>
                )}
              </div>
              <p className="text-xs text-background/60 mb-9">
                {product.material} · {product.care}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full h-12 px-8 group bg-background text-foreground hover:bg-background/90">
                  <Link href={`/product/${product.slug}`}>
                    {shopLabel}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full h-12 px-8 border-background/30 text-background hover:bg-background/10"
                >
                  <Link href="/shop?filter=limited">{viewAllLabel}</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
