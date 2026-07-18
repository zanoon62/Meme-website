"use client";

import * as React from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/product-card";
import { collections } from "@/data/products";
import { useLiveProducts } from "@/components/providers/product-store";

export default function CollectionPageClient({ slug }: { slug: string }) {
  const collection = collections.find((c) => c.slug === slug);
  const products = useLiveProducts();
  // Server already 404'd for unknown slugs; this is a client safety net
  if (!collection) return null;

  const items = products.filter(
    (p) => p.collection.toLowerCase().replace(/\s+/g, "-") === slug
  );

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden bg-foreground">
        <Image
          src={collection.image}
          alt={collection.name}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-foreground/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-background">
          <p className="text-[11px] uppercase tracking-[0.3em] mb-4 opacity-90">MEME Collection</p>
          <h1 className="font-display text-5xl lg:text-7xl tracking-tight mb-4">{collection.name}</h1>
          <p className="text-base lg:text-lg opacity-90 max-w-xl leading-relaxed">{collection.description}</p>
          <p className="text-xs mt-4 opacity-70 uppercase tracking-wider">{collection.count} pieces</p>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 py-14 lg:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-6">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 lg:mt-28 text-center">
          <h2 className="font-display text-3xl lg:text-5xl tracking-tight mb-4">Discover more from MEME</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Explore our full range of premium streetwear, tailored essentials, and limited drops.
          </p>
          <Button asChild size="lg" className="rounded-full h-12 px-8">
            <Link href="/shop">
              Shop all products <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
