"use client";

import * as React from "react";
import Link from "next/link";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { Heart, ShoppingBag, ArrowRight, Trash2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist, useCart, useUI } from "@/components/providers/ui-provider";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { ProductCard } from "@/components/shop/product-card";
import { useLiveProducts } from "@/components/providers/product-store";

export default function WishlistPage() {
  const items = useWishlist((s) => s.items);
  const remove = useWishlist((s) => s.remove);
  const clear = useWishlist((s) => s.clear);
  const add = useCart((s) => s.add);
  const setCartOpen = useUI((s) => s.setCartOpen);
  const products = useLiveProducts();

  const handleAddAll = () => {
    items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        add({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.images[0],
          color: product.colors[0].name,
          size: product.sizes[0],
          price: product.price,
        });
      }
    });
    toast.success(`${items.length} items added to cart`);
    setCartOpen(true);
  };

  if (items.length === 0) {
    return (
      <main className="flex-1 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-20">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
            <Heart className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="font-display text-4xl tracking-tight mb-3">Your wishlist is empty</h1>
          <p className="text-muted-foreground mb-8">
            Save the pieces you love and they&apos;ll appear here.
          </p>
          <Button asChild className="rounded-full h-12 px-8">
            <Link href="/shop">
              Explore the collection <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Suggestions */}
        <div className="mt-24">
          <h2 className="font-display text-3xl tracking-tight mb-8 text-center">Trending now</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-6">
            {products.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 py-10 lg:py-16">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Saved</p>
          <h1 className="font-display text-4xl lg:text-6xl tracking-tight">Wishlist</h1>
          <p className="text-sm text-muted-foreground mt-3">{items.length} items saved</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => toast.success("Wishlist link copied!")}>
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={handleAddAll}>
            <ShoppingBag className="h-4 w-4 mr-2" /> Add all to cart
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={() => { clear(); toast.success("Wishlist cleared"); }}>
            <Trash2 className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-6">
        {items.map((item, i) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return null;
          return <ProductCard key={item.productId} product={product} index={i} />;
        })}
      </div>
    </main>
  );
}
