"use client";

import * as React from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/components/providers/ui-provider";
import { useCart, useUI, useWishlist, useWishlistHas } from "@/components/providers/ui-provider";
import { formatPrice, calculateDiscount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const add = useCart((s) => s.add);
  const setCartOpen = useUI((s) => s.setCartOpen);
  const toggle = useWishlist((s) => s.toggle);
  const isWishlisted = useWishlistHas(product.id);
  const [hovered, setHovered] = React.useState(false);
  const [imgIndex, setImgIndex] = React.useState(0);

  // Use second image on hover if available
  React.useEffect(() => {
    if (hovered && product.images.length > 1) setImgIndex(1);
    else setImgIndex(0);
  }, [hovered, product.images.length]);

  const discount = calculateDiscount(product.price, product.compareAtPrice);

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      color: product.colors[0].name,
      size: product.sizes[0],
      price: product.price,
    });
    toast.success(`${product.name} added to cart`);
    setCartOpen(true);
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      price: product.price,
      addedAt: Date.now(),
    });
    toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <Link
        href={`/product/${product.slug}`}
        className="block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-accent rounded-sm">
          <Image
            src={product.images[imgIndex]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            priority={index < 4}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="bg-foreground text-background text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm font-medium">
                New
              </span>
            )}
            {product.isLimited && (
              <span className="bg-foreground/90 text-background text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm font-medium">
                Limited
              </span>
            )}
            {discount && (
              <span className="bg-destructive text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm font-medium">
                -{discount}%
              </span>
            )}
            {product.inventory <= 12 && !product.isLimited && (
              <span className="bg-background/80 backdrop-blur text-foreground text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm font-medium">
                Low stock
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={toggleWishlist}
            className={cn(
              "absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center transition-all",
              "hover:scale-110 active:scale-95",
              isWishlisted && "bg-foreground text-background"
            )}
            aria-label="Add to wishlist"
          >
            <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
          </button>

          {/* Quick add */}
          <div
            className={cn(
              "absolute bottom-3 inset-x-3 transition-all duration-300",
              hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            <button
              onClick={quickAdd}
              className="w-full h-11 rounded-full glass-dark text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-foreground hover:text-background transition-colors"
            >
              <Plus className="h-4 w-4" /> Quick add
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {product.collection}
            </p>
            <div className="flex gap-1">
              {product.colors.slice(0, 4).map((c) => (
                <span
                  key={c.name}
                  className="w-3 h-3 rounded-full border border-border/80"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          <h3 className="text-sm font-medium leading-snug line-clamp-1">{product.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{product.subtitle}</p>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-sm font-medium">{formatPrice(product.price, product.currency)}</span>
            {product.compareAtPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice, product.currency)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
