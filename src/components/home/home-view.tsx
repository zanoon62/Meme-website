"use client";

import * as React from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Star,
  Truck,
  Shield,
  RefreshCw,
  Sparkles,
  Instagram,
} from "lucide-react";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { SponsorLogos } from "@/components/home/sponsor-logos";
import { ShowcaseSection } from "@/components/home/showcase-section";
import { EditorialSplit } from "@/components/home/editorial-split";
import { ManifestoNewsletter } from "@/components/home/manifesto-newsletter";
import { LimitedDropSpotlight } from "@/components/home/limited-drop-spotlight";
import { reviews } from "@/data/products";
import { useLiveProducts } from "@/components/providers/product-store";

// Composed home view that mirrors the reference (dream-stock3) structure:
// 1. Hero carousel (4 slides)
// 2. Sponsor logos marquee
// 3. Showcase: Our Best Sellers
// 4. Editorial: Premium Brands feature
// 5. Showcase: New Arrivals
// 6. Limited drop spotlight
// 7. Showcase: Trending
// 8. Editorial: MEME atelier story
// 9. Value props strip
// 10. Reviews carousel
// 11. Instagram strip
// 12. FAQ accordion
// 13. Manifesto + newsletter (also handled by footer)

export function HomeView() {
  const products = useLiveProducts();
  const limited = products.filter((p) => p.isLimited);

  // Tabs derived from the catalog
  const bestTabs = ["Hoodies & Sweatshirts", "Tops", "Pants", "Accessories", "Footwear"];
  const newTabs = ["Dresses", "Tailoring", "Outerwear", "Knitwear", "Hoodies & Sweatshirts"];
  const trendingTabs = ["Dresses", "Pants", "Knitwear", "Accessories", "Footwear"];

  // Best sellers — prefer branded catalog for "Our Best Sellers" matching reference
  const brandedBestSellers = products.filter((p) => p.collection === "Premium Brands");

  return (
    <main className="flex-1 bg-background">
      {/* 1. Hero carousel — multi-slide editorial hero (clones ai-luxury-hero-carousel) */}
      <HeroCarousel />

      {/* 2. Sponsor logos marquee (clones ai-sponsor-logos) */}
      <SponsorLogos />

      {/* 3. Showcase: Our Best Sellers — clones reference's main showcase */}
      <ShowcaseSection
        id="best-sellers"
        eyebrow="Most wanted"
        title="Our Best"
        italicTail="Sellers."
        description="Top brands, one store — Zara, H&M, Lacoste, Adidas, Hollister, Hugo Boss & more. Authentic premium pieces, shipped fast across Egypt with cash on delivery."
        products={brandedBestSellers.length >= 4 ? brandedBestSellers : products}
        tabs={bestTabs}
        viewAllHref="/shop?filter=best"
        tone="default"
      />

      {/* 4. Editorial split — Premium Brands feature */}
      <EditorialSplit
        id="premium-brands"
        eyebrow="30+ brands · One store"
        title="Premium brands,"
        italicTail="authentic & accessible."
        body={[
          "Discover more than 30 brands in one place. We bring you the premium labels you love — Zara, H&M, Lacoste, Adidas, Hollister, Pull&Bear, Bershka, Hugo Boss, Urberry — all in one store, all authentic, all shipped fast across Egypt.",
          "From the everyday essentials to statement pieces, every item in our branded catalog is sourced directly and verified for authenticity. Cash on delivery available nationwide, free shipping over 7,500 EGP, and 14-day returns on every order.",
        ]}
        image="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=85&auto=format&fit=crop"
        imageAlt="Premium brands at MEME — Zara, H&M, Lacoste, Adidas & more"
        cta={{ label: "Shop Premium Brands", href: "/collection/premium-brands" }}
        tone="default"
        stats={[
          { value: "30+", label: "Premium brands" },
          { value: "100%", label: "Authentic" },
          { value: "1-2d", label: "Cairo delivery" },
        ]}
      />

      {/* 5. Showcase: New Arrivals */}
      <ShowcaseSection
        id="new-arrivals"
        eyebrow="Just dropped"
        title="New"
        italicTail="arrivals."
        description="The latest from the MEME atelier and our premium brand partners — fresh drops every week, engineered for the season ahead."
        products={products}
        tabs={newTabs}
        viewAllHref="/shop?filter=new"
        tone="muted"
      />

      {/* 6. Limited drop spotlight */}
      {limited.length > 0 && <LimitedDropSpotlight product={limited[0]} />}

      {/* 7. Showcase: Trending */}
      <ShowcaseSection
        id="trending"
        eyebrow="On the up"
        title="Trending"
        italicTail="now."
        description="Picked by the atelier — the pieces moving fastest this season, from cashmere wraps to Japanese denim to premium branded essentials."
        products={products}
        tabs={trendingTabs}
        viewAllHref="/shop"
        tone="default"
      />

      {/* 8. Brand story editorial (dark) */}
      <EditorialSplit
        id="brand-story"
        eyebrow="The MEME atelier"
        title="Clothing worth"
        italicTail="keeping for life."
        body={[
          "MEME was founded on a single belief: that the clothes a woman wears should be engineered to outlive every trend cycle. We work directly with mills in Italy, Japan, and Portugal to source materials with a story — wools woven on heritage looms, silks spun from mulberry, leathers tanned by hand over months.",
          "Every piece is patterned, cut, and finished in our atelier with an obsession for the details you can't see: the canvassing inside a blazer dress, the bias-cut of a silk slip, the bartack on a leather moto. We build garments for the modern woman's wardrobe — pieces that look right today and in a decade.",
        ]}
        image="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=85&auto=format&fit=crop"
        imageAlt="The MEME atelier"
        cta={{ label: "Read our story", href: "/" }}
        tone="dark"
        reverse
        stats={[
          { value: "14", label: "Atelier partners" },
          { value: "100%", label: "Natural fibers" },
          { value: "∞", label: "Lifetime repairs" },
        ]}
      />

      {/* 9. Value props strip */}
      <ValuePropsStrip />

      {/* 10. Reviews carousel */}
      <ReviewsSection />

      {/* 11. Instagram strip */}
      <InstagramStrip />

      {/* 12. FAQ accordion */}
      <FAQAccordion />

      {/* 13. Manifesto + newsletter */}
      <ManifestoNewsletter />
    </main>
  );
}

// =================== Marquee ===================
function MarqueeBar() {
  const items = [
    "Designed in Cairo",
    "Lifetime repairs",
    "Free shipping across Egypt over 7,500 EGP",
    "Cash on Delivery available",
    "Sustainable materials",
    "Limited drops",
    "Numbered editions",
    "Italian virgin wool",
  ];
  return (
    <div className="border-y border-white/5 bg-black overflow-hidden">
      <div className="flex whitespace-nowrap animate-marquee py-4">
        {[...items, ...items, ...items, ...items].map((item, i) => (
          <span
            key={i}
            className="flex items-center text-[11px] uppercase tracking-[0.25em] mx-8 font-medium text-white/80"
          >
            {item}
            <Sparkles className="h-3 w-3 ml-8 text-[#f6ec91]/60" />
          </span>
        ))}
      </div>
    </div>
  );
}

// =================== Value Props ===================
function ValuePropsStrip() {
  const items = [
    { icon: Truck, title: "Free shipping across Egypt", desc: "On all orders over 7,500 EGP. Cairo, Alex, Delta, Upper Egypt & Red Sea." },
    { icon: RefreshCw, title: "14-day returns", desc: "Not right? Send it back within 14 days for a full refund. COD available nationwide." },
    { icon: Shield, title: "Authentic guaranteed", desc: "Every premium brand product is sourced directly and verified for authenticity." },
    { icon: Sparkles, title: "Cash on Delivery", desc: "Pay in cash when your order arrives. Available nationwide except Red Sea region." },
  ];
  return (
    <section className="bg-card/50 border-y border-white/5 py-16 lg:py-20">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-start gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-[#f6ec91]/10 border border-[#f6ec91]/30 flex items-center justify-center">
                <item.icon className="h-4 w-4 text-[#f6ec91]" />
              </div>
              <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =================== Reviews ===================
function ReviewsSection() {
  const featured = reviews.slice(0, 3);
  return (
    <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 py-20 lg:py-28">
      <div className="text-center mb-12">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#f6ec91] mb-3">Customer love</p>
        <h2 className="font-display text-4xl lg:text-6xl tracking-tight">Worn &amp; loved.</h2>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-4 w-4 fill-[#f6ec91] text-[#f6ec91]" />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">4.9 average · 2,800+ reviews</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {featured.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="border border-white/10 rounded-sm p-8 bg-card/30 hover:border-[#f6ec91]/30 transition-colors"
          >
            <div className="flex mb-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <Star key={j} className="h-3.5 w-3.5 fill-[#f6ec91] text-[#f6ec91]" />
              ))}
            </div>
            <h3 className="font-medium text-base mb-3">{r.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-4">{r.body}</p>
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-medium text-foreground">{r.author}</p>
                <p className="text-muted-foreground">Verified buyer</p>
              </div>
              <span className="text-muted-foreground">{r.date}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// =================== Instagram ===================
function InstagramStrip() {
  const images = [
    "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80&auto=format&fit=crop",
  ];
  return (
    <section className="border-t border-white/5 py-20 lg:py-28 bg-black">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#f6ec91] mb-3 inline-flex items-center gap-2">
            <Instagram className="h-3.5 w-3.5" /> @suited_by_meme
          </p>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight">Worn by you.</h2>
          <a
            href="https://www.instagram.com/suited_by_meme"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 text-sm link-underline text-[#f6ec91]"
          >
            Follow us on Instagram <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3">
          {images.map((src, i) => (
            <motion.a
              key={i}
              href="https://www.instagram.com/suited_by_meme"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group relative aspect-square overflow-hidden rounded-sm bg-card"
            >
              <Image
                src={src}
                alt={`MEME Instagram post ${i + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

// =================== FAQ ===================
function FAQAccordion() {
  const faqs = [
    {
      q: "How do I find my size?",
      a: "Every product page has a detailed size guide with measurements in inches and centimeters. If you're between sizes, we generally recommend sizing up for a more relaxed fit and sizing down for a tailored fit. Free exchanges within 30 days.",
    },
    {
      q: "What is your shipping policy?",
      a: "Free shipping across Egypt on orders over 7,500 EGP. Cairo & Giza: 1-2 days. Alexandria: 2-3 days. Delta & Upper Egypt: 3-5 days. Red Sea & Sinai: 3-6 days. Cash on Delivery available nationwide except Red Sea region.",
    },
    {
      q: "Can I return or exchange?",
      a: "Yes. We offer 14-day returns and exchanges on all unworn items with tags attached. Items marked 'Final Sale' cannot be returned. Start your return from the account portal or message us on WhatsApp.",
    },
    {
      q: "Are the branded products authentic?",
      a: "Yes. Every premium branded product (Zara, H&M, Lacoste, Adidas, Hollister, Hugo Boss, etc.) is sourced directly from authorized suppliers and verified for authenticity. We stand behind every item we sell with a 100% authenticity guarantee.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept Visa, Mastercard, Meeza (credit/debit cards), Cash on Delivery (nationwide except Red Sea), Fawry reference code, Vodafone Cash, and InstaPay. All payment methods are in Egyptian Pounds (EGP).",
    },
    {
      q: "Do you offer alterations?",
      a: "Yes. Hemming and basic alterations are complimentary on all tailoring purchases from our Atelier Noir collection. Just bring your garment to our Cairo atelier in Zamalek or mail it in.",
    },
  ];
  return (
    <section className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-20 lg:py-28 border-t border-white/5">
      <div className="text-center mb-12">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#f6ec91] mb-3">Help center</p>
        <h2 className="font-display text-4xl lg:text-6xl tracking-tight">Questions, answered.</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-x-10 gap-y-2">
        {faqs.map((faq, i) => (
          <details key={i} className="group py-5 border-b border-white/10">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <span className="font-medium text-base">{faq.q}</span>
              <span className="ml-4 text-[#f6ec91] transition-transform group-open:rotate-45 text-xl">
                +
              </span>
            </summary>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
