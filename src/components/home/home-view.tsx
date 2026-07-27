"use client";

import * as React from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
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
import { useHomepageConfig } from "@/components/providers/homepage-store";
import { useLang } from "@/components/layout/language-toggle";

export function HomeView() {
  const products = useLiveProducts();
  const config = useHomepageConfig();
  const [lang] = useLang();
  const isRtl = lang === "ar";
  const limited = products.filter((p) => p.isLimited);

  const bestTabs = ["Hoodies & Sweatshirts", "Tops", "Pants", "Accessories", "Footwear"];
  const newTabs = ["Dresses", "Tailoring", "Outerwear", "Knitwear", "Hoodies & Sweatshirts"];
  const trendingTabs = ["Dresses", "Pants", "Knitwear", "Accessories", "Footwear"];
  const brandedBestSellers = products.filter((p) => p.collection === "Premium Brands");

  const bs = config.bestSellers;
  const na = config.newArrivals;
  const tr = config.trending;
  const ep = config.editorialPremium;
  const es = config.editorialStory;

  return (
    <main className="flex-1 bg-background">
      {/* 1. Hero carousel */}
      <HeroCarousel />

      {/* 2. Sponsor logos marquee */}
      <SponsorLogos />

      {/* 3. Best Sellers */}
      {bs.visible && (
        <ShowcaseSection
          id="best-sellers"
          eyebrow={isRtl ? bs.eyebrow.ar : bs.eyebrow.en}
          title={isRtl ? bs.title.ar : bs.title.en}
          italicTail={isRtl ? bs.italicTail.ar : bs.italicTail.en}
          description={isRtl ? bs.description.ar : bs.description.en}
          products={brandedBestSellers.length >= 4 ? brandedBestSellers : products}
          tabs={bestTabs}
          viewAllHref="/shop?filter=best"
          tone="default"
        />
      )}

      {/* 4. Editorial split — Premium Brands */}
      {ep.visible && (
        <EditorialSplit
          id="premium-brands"
          eyebrow={isRtl ? ep.eyebrow.ar : ep.eyebrow.en}
          title={isRtl ? ep.title.ar : ep.title.en}
          italicTail={isRtl ? ep.italicTail.ar : ep.italicTail.en}
          body={isRtl ? ep.body.ar : ep.body.en}
          image={ep.image}
          imageAlt="Premium brands at MEME"
          cta={{ label: isRtl ? ep.ctaLabel.ar : ep.ctaLabel.en, href: ep.ctaHref }}
          tone="default"
          stats={ep.stats.map((s) => ({ value: s.value, label: isRtl ? s.label.ar : s.label.en }))}
        />
      )}

      {/* 5. New Arrivals */}
      {na.visible && (
        <ShowcaseSection
          id="new-arrivals"
          eyebrow={isRtl ? na.eyebrow.ar : na.eyebrow.en}
          title={isRtl ? na.title.ar : na.title.en}
          italicTail={isRtl ? na.italicTail.ar : na.italicTail.en}
          description={isRtl ? na.description.ar : na.description.en}
          products={products}
          tabs={newTabs}
          viewAllHref="/shop?filter=new"
          tone="muted"
        />
      )}

      {/* 6. Limited drop spotlight */}
      {limited.length > 0 && <LimitedDropSpotlight product={limited[0]} />}

      {/* 7. Trending */}
      {tr.visible && (
        <ShowcaseSection
          id="trending"
          eyebrow={isRtl ? tr.eyebrow.ar : tr.eyebrow.en}
          title={isRtl ? tr.title.ar : tr.title.en}
          italicTail={isRtl ? tr.italicTail.ar : tr.italicTail.en}
          description={isRtl ? tr.description.ar : tr.description.en}
          products={products}
          tabs={trendingTabs}
          viewAllHref="/shop"
          tone="default"
        />
      )}

      {/* 8. Brand story editorial */}
      {es.visible && (
        <EditorialSplit
          id="brand-story"
          eyebrow={isRtl ? es.eyebrow.ar : es.eyebrow.en}
          title={isRtl ? es.title.ar : es.title.en}
          italicTail={isRtl ? es.italicTail.ar : es.italicTail.en}
          body={isRtl ? es.body.ar : es.body.en}
          image={es.image}
          imageAlt="The MEME atelier"
          cta={{ label: isRtl ? es.ctaLabel.ar : es.ctaLabel.en, href: es.ctaHref }}
          tone="dark"
          reverse
          stats={es.stats.map((s) => ({ value: s.value, label: isRtl ? s.label.ar : s.label.en }))}
        />
      )}

      {/* 9. Value props strip */}
      {config.valueProps.visible && <ValuePropsStrip />}

      {/* 10. Reviews carousel */}
      {config.reviews.visible && <ReviewsSection />}

      {/* 11. Instagram strip */}
      {config.instagram.visible && <InstagramStrip />}

      {/* 12. FAQ accordion */}
      {config.faq.visible && <FAQAccordion />}

      {/* 13. Manifesto + newsletter */}
      <ManifestoNewsletter />
    </main>
  );
}

// =================== Value Props ===================
function ValuePropsStrip() {
  const config = useHomepageConfig();
  const [lang] = useLang();
  const isRtl = lang === "ar";
  const ICONS = [Truck, RefreshCw, Shield, Sparkles];

  const items = config.valueProps.items
    .filter((item) => item.visible)
    .map((item, i) => ({
      icon: ICONS[i % ICONS.length],
      title: isRtl ? item.ar : item.en,
      desc: isRtl ? item.descAr : item.descEn,
    }));

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
  const config = useHomepageConfig();
  const [lang] = useLang();
  const isRtl = lang === "ar";
  const section = config.reviews;
  const featured = reviews.slice(0, 3);

  return (
    <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 py-20 lg:py-28">
      <div className="text-center mb-12">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#f6ec91] mb-3">
          {isRtl ? section.eyebrow.ar : section.eyebrow.en}
        </p>
        <h2 className="font-display text-4xl lg:text-6xl tracking-tight">
          {isRtl ? section.title.ar : section.title.en}
        </h2>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-4 w-4 fill-[#f6ec91] text-[#f6ec91]" />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {isRtl ? section.subtitle.ar : section.subtitle.en}
          </span>
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
                <p className="text-muted-foreground">{isRtl ? "مشترٍ موثق" : "Verified buyer"}</p>
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
  const config = useHomepageConfig();
  const [lang] = useLang();
  const isRtl = lang === "ar";
  const section = config.instagram;

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
            <Instagram className="h-3.5 w-3.5" />
            {isRtl ? section.eyebrow.ar : section.eyebrow.en}
          </p>
          <h2 className="font-display text-4xl lg:text-6xl tracking-tight">
            {isRtl ? section.title.ar : section.title.en}
          </h2>
          <a
            href={`https://www.instagram.com/${section.handle.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 text-sm link-underline text-[#f6ec91]"
          >
            {isRtl ? "تابعنا على انستاغرام" : "Follow us on Instagram"}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3">
          {images.map((src, i) => (
            <motion.a
              key={i}
              href={`https://www.instagram.com/${section.handle.replace("@", "")}`}
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
  const config = useHomepageConfig();
  const [lang] = useLang();
  const isRtl = lang === "ar";

  const faqs = config.faq.items.filter((f) => f.visible);

  return (
    <section className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10 py-20 lg:py-28 border-t border-white/5">
      <div className="text-center mb-12">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#f6ec91] mb-3">
          {isRtl ? "مركز المساعدة" : "Help center"}
        </p>
        <h2 className="font-display text-4xl lg:text-6xl tracking-tight">
          {isRtl ? "أسئلة وأجوبة." : "Questions, answered."}
        </h2>
      </div>
      <div className="grid md:grid-cols-2 gap-x-10 gap-y-2">
        {faqs.map((faq, i) => (
          <details key={i} className="group py-5 border-b border-white/10">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <span className="font-medium text-base">{isRtl ? faq.qAr : faq.qEn}</span>
              <span className="ml-4 text-[#f6ec91] transition-transform group-open:rotate-45 text-xl">+</span>
            </summary>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {isRtl ? faq.aAr : faq.aEn}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
