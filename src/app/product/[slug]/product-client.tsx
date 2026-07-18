"use client";

import * as React from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  Truck,
  RefreshCw,
  Shield,
  Check,
  Minus,
  Plus,
  ChevronRight,
  Star,
  Ruler,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/shop/product-card";
import { getReviewsForProduct } from "@/data/products";
import { useProductStore } from "@/components/providers/product-store";
import { useCart, useUI, useWishlist, useWishlistHas } from "@/components/providers/ui-provider";
import type { ProductSize } from "@/components/providers/ui-provider";
import { formatPrice, calculateDiscount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProductPageClient({ slug }: { slug: string }) {
  const product = useProductStore((s) => s.products.find((p) => p.slug === slug));
  const allProducts = useProductStore((s) => s.products);
  const add = useCart((s) => s.add);
  const setCartOpen = useUI((s) => s.setCartOpen);
  const toggle = useWishlist((s) => s.toggle);
  const isWishlisted = useWishlistHas(product?.id ?? "");

  const [selectedImage, setSelectedImage] = React.useState(0);
  const [selectedColor, setSelectedColor] = React.useState(product?.colors[0]?.name ?? "");
  const [selectedSize, setSelectedSize] = React.useState<ProductSize | null>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [zoomed, setZoomed] = React.useState(false);
  const [stickyVisible, setStickyVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // If the store has hydrated and the product genuinely doesn't exist,
  // redirect to the 404 page (server already 404'd for unknown slugs —
  // this is a client-side safety net for hydration edge cases).
  React.useEffect(() => {
    const hydrated = useProductStore.getState().hydrated;
    if (hydrated && !product) {
      window.location.href = "/not-found";
    }
  }, [product]);

  if (!product) {
    // Render null while either (a) waiting for store hydration or
    // (b) the redirect effect above fires.
    return null;
  }

  const related = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || p.collection === product.collection))
    .slice(0, 4);
  const productReviews = getReviewsForProduct(product.id);
  const discount = calculateDiscount(product.price, product.compareAtPrice);

  const onAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        color: selectedColor,
        size: selectedSize,
        price: product.price,
      },
      quantity
    );
    toast.success(`${product.name} added to cart`);
    setCartOpen(true);
  };

  return (
    <main className="flex-1">
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 pt-6">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/shop" className="hover:text-foreground">Shop</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-foreground">
            {product.category}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate">{product.name}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Gallery */}
          <div className="flex flex-col-reverse lg:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible no-scrollbar">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "relative flex-shrink-0 w-20 h-24 lg:w-20 lg:h-24 rounded-sm overflow-hidden border-2 transition-colors",
                    selectedImage === i ? "border-foreground" : "border-transparent hover:border-border"
                  )}
                >
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
            {/* Main image */}
            <div
              className="relative flex-1 aspect-[4/5] rounded-sm overflow-hidden bg-accent cursor-zoom-in"
              onClick={() => setZoomed(!zoomed)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={product.images[selectedImage]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className={cn(
                      "object-cover transition-transform duration-500",
                      zoomed ? "scale-150 cursor-zoom-out" : "scale-100"
                    )}
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <span className="bg-foreground text-background text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-sm font-medium">
                    New
                  </span>
                )}
                {product.isLimited && (
                  <span className="bg-foreground/90 text-background text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-sm font-medium">
                    Limited
                  </span>
                )}
                {discount && (
                  <span className="bg-destructive text-white text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-sm font-medium">
                    -{discount}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="lg:py-2">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
              {product.collection}
            </p>
            <h1 className="font-display text-3xl lg:text-5xl tracking-tight leading-[1.05] mb-3">
              {product.name}
            </h1>
            <p className="text-base text-muted-foreground mb-5">{product.subtitle}</p>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i <= Math.round(product.rating)
                        ? "fill-foreground text-foreground"
                        : "text-muted-foreground"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{product.rating}</span>
              <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-8">
              <span className="font-display text-3xl">{formatPrice(product.price, product.currency)}</span>
              {product.compareAtPrice && (
                <>
                  <span className="text-base text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice, product.currency)}
                  </span>
                  <Badge variant="destructive" className="rounded-sm">
                    Save {formatPrice(product.compareAtPrice - product.price, product.currency)}
                  </Badge>
                </>
              )}
            </div>

            <Separator className="my-6" />

            {/* Color selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-[0.2em] font-medium">Color</p>
                <p className="text-sm text-muted-foreground">{selectedColor}</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={cn(
                      "relative w-10 h-10 rounded-full border-2 transition-all",
                      selectedColor === color.name
                        ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background"
                        : "border-border hover:border-foreground"
                    )}
                    style={{ backgroundColor: color.hex }}
                    aria-label={color.name}
                  >
                    {selectedColor === color.name && (
                      <Check
                        className="absolute inset-0 m-auto h-4 w-4"
                        style={{ color: getContrastColor(color.hex) }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-[0.2em] font-medium">Size</p>
                <button className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> Size guide
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "h-12 rounded-sm border text-sm font-medium transition-all",
                      selectedSize === size
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && (
                <p className="text-xs text-muted-foreground mt-2">Select a size to add to cart</p>
              )}
            </div>

            {/* Quantity & Add to cart */}
            <div className="flex gap-3 mb-4">
              <div className="flex items-center border border-border rounded-full">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center hover:bg-accent rounded-l-full transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-11 h-11 flex items-center justify-center hover:bg-accent rounded-r-full transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                onClick={onAddToCart}
                size="lg"
                className="flex-1 h-11 rounded-full text-sm font-medium"
                disabled={!selectedSize}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                {selectedSize ? "Add to cart" : "Select size"} — {formatPrice(product.price * quantity)}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full"
                onClick={() => {
                  toggle({
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    image: product.images[0],
                    price: product.price,
                    addedAt: Date.now(),
                  });
                  toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
                }}
                aria-label="Add to wishlist"
              >
                <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
              </Button>
            </div>

            {/* Inventory */}
            {product.inventory <= 24 && (
              <div className="mb-6 text-sm">
                <div className="flex justify-between mb-1.5">
                  <span className="text-muted-foreground">Almost gone</span>
                  <span className="font-medium">Only {product.inventory} left</span>
                </div>
                <div className="h-1 bg-accent rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground"
                    style={{ width: `${Math.min(100, (product.inventory / 24) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Value props */}
            <div className="grid grid-cols-3 gap-3 py-6 border-y border-border/60">
              {[
                { icon: Truck, label: "Free shipping over 7,500 EGP" },
                { icon: RefreshCw, label: "14-day returns" },
                { icon: Shield, label: "Lifetime repairs" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-2">
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Details tabs */}
            <Tabs defaultValue="details" className="mt-8">
              <TabsList className="w-full justify-start border-b border-border/60 rounded-none bg-transparent h-auto p-0">
                <TabsTrigger
                  value="details"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-xs uppercase tracking-wider py-3"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="material"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-xs uppercase tracking-wider py-3"
                >
                  Material & Care
                </TabsTrigger>
                <TabsTrigger
                  value="shipping"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-xs uppercase tracking-wider py-3"
                >
                  Shipping
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-xs uppercase tracking-wider py-3"
                >
                  Reviews ({productReviews.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="pt-6 text-sm text-muted-foreground leading-relaxed">
                <p className="mb-4">{product.description}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 flex-shrink-0" /> Premium construction with reinforced seams</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 flex-shrink-0" /> Designed in our atelier, crafted by master makers</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 flex-shrink-0" /> Naturally dyed with low-impact pigments</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 flex-shrink-0" /> Lifetime repair guarantee</li>
                </ul>
              </TabsContent>

              <TabsContent value="material" className="pt-6 text-sm space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider font-medium mb-2">Material</p>
                  <p className="text-muted-foreground">{product.material}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider font-medium mb-2">Care Instructions</p>
                  <p className="text-muted-foreground">{product.care}</p>
                </div>
              </TabsContent>

              <TabsContent value="shipping" className="pt-6 text-sm space-y-3 text-muted-foreground">
                <p><strong className="text-foreground">Free shipping across Egypt</strong> on orders over 7,500 EGP.</p>
                <p>Cairo & Giza: 1–2 business days · Alexandria: 2–3 · Delta: 2–4 · Upper Egypt: 3–5 · Red Sea: 3–6.</p>
                <p>Cash on Delivery available nationwide (except Red Sea & Sinai).</p>
                <p>Pay with Card, Fawry, Vodafone Cash, or InstaPay.</p>
                <p>14-day returns on unworn items with tags attached.</p>
              </TabsContent>

              <TabsContent value="reviews" className="pt-6">
                <div className="space-y-6">
                  {productReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review this product.</p>
                  ) : (
                    productReviews.map((r) => (
                      <div key={r.id} className="border-b border-border/60 pb-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{r.author}</p>
                            <p className="text-xs text-muted-foreground">{r.date}</p>
                          </div>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-3 w-3",
                                  i <= r.rating ? "fill-foreground text-foreground" : "text-muted-foreground"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="font-medium text-sm mb-1">{r.title}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
                        {r.verified && (
                          <Badge variant="outline" className="mt-2 text-[10px]">Verified buyer</Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-24 lg:mt-32">
            <div className="flex items-end justify-between mb-10">
              <h2 className="font-display text-3xl lg:text-5xl tracking-tight">You may also like</h2>
              <Link href="/shop" className="text-sm link-underline hidden sm:inline-flex items-center gap-1">
                Shop all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-6">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky add to cart */}
      <AnimatePresence>
        {stickyVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 inset-x-0 z-30 glass border-t border-border/60 lg:hidden"
          >
            <div className="flex items-center gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="relative w-12 h-12 rounded-sm overflow-hidden bg-accent flex-shrink-0">
                <Image src={product.images[0]} alt={product.name} fill sizes="48px" className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium line-clamp-1">{product.name}</p>
                <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
              </div>
              <Button
                size="sm"
                className="rounded-full h-10 px-4"
                onClick={onAddToCart}
                disabled={!selectedSize}
              >
                {selectedSize ? `Add — ${selectedSize}` : "Select size"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
