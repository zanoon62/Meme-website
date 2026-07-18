"use client";

import * as React from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight, Truck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart, useUI, useCartSubtotal } from "@/components/providers/ui-provider";
import { formatPrice, getShippingProgress, FREE_SHIPPING_THRESHOLD } from "@/lib/format";
import { products } from "@/data/products";
import { ProductCard } from "@/components/shop/product-card";

export function CartDrawer() {
  const { cartOpen, setCartOpen } = useUI();
  const lines = useCart((s) => s.lines);
  const remove = useCart((s) => s.remove);
  const updateQty = useCart((s) => s.updateQty);
  const sub = useCartSubtotal();
  const [recommendations, setRecommendations] = React.useState<typeof products>([]);

  React.useEffect(() => {
    if (cartOpen && lines.length > 0) {
      const lineProductIds = new Set(lines.map((l) => l.productId));
      const recs = products
        .filter((p) => !lineProductIds.has(p.id))
        .filter((p) => p.isBestSeller || p.isTrending)
        .slice(0, 3);
      setRecommendations(recs);
    }
  }, [cartOpen, lines]);

  const shipping = getShippingProgress(sub);

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="w-full sm:max-w-[440px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b border-border/60">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 font-display text-xl">
              <ShoppingBag className="h-5 w-5" /> Your Cart
              <span className="text-sm text-muted-foreground font-sans font-normal">
                ({lines.reduce((a, l) => a + l.quantity, 0)})
              </span>
            </SheetTitle>
          </div>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-lg">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">Start building your wardrobe.</p>
            </div>
            <Button asChild className="mt-2 rounded-full" onClick={() => setCartOpen(false)}>
              <Link href="/shop">Explore the collection <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Free shipping bar */}
            <div className="px-6 py-4 bg-accent/30 border-b border-border/60">
              {shipping.qualified ? (
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4" />
                  <span>You&apos;ve unlocked <strong>free shipping</strong>.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs">
                    Add <strong>{formatPrice(shipping.remaining)}</strong> for free shipping
                  </p>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground rounded-full transition-all duration-500"
                      style={{ width: `${shipping.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Lines */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {lines.map((line) => (
                <div key={`${line.productId}-${line.color}-${line.size}`} className="flex gap-4">
                  <div className="relative w-20 h-28 rounded-md overflow-hidden bg-accent flex-shrink-0">
                    <Image
                      src={line.image}
                      alt={line.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${line.slug}`}
                      onClick={() => setCartOpen(false)}
                      className="font-medium text-sm hover:underline line-clamp-2"
                    >
                      {line.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      {line.color} / {line.size}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-border rounded-full">
                        <button
                          onClick={() => updateQty(line.productId, line.color, line.size, line.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-accent rounded-l-full transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-medium w-6 text-center">{line.quantity}</span>
                        <button
                          onClick={() => updateQty(line.productId, line.color, line.size, line.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-accent rounded-r-full transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{formatPrice(line.price * line.quantity)}</span>
                        <button
                          onClick={() => remove(line.productId, line.color, line.size)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="pt-6 border-t border-border/60">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">You may also like</p>
                  <div className="grid grid-cols-3 gap-3">
                    {recommendations.map((p) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.slug}`}
                        onClick={() => setCartOpen(false)}
                        className="group"
                      >
                        <div className="relative aspect-[3/4] rounded-md overflow-hidden bg-accent">
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            sizes="120px"
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                        <p className="text-xs mt-2 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(p.price)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/60 px-6 py-5 space-y-4 bg-background">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(sub)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Shipping & taxes calculated at checkout</span>
              </div>
              <Button asChild className="w-full rounded-full h-12 text-sm" size="lg" onClick={() => setCartOpen(false)}>
                <Link href="/checkout">
                  Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full text-xs text-muted-foreground"
                onClick={() => setCartOpen(false)}
              >
                Continue shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
