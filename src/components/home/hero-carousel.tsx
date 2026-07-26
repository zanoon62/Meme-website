"use client";

import * as React from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

// Cloned from dream-stock3 reference hero-carousel:
// 4 slides with headline, subheading, CTA button, full-bleed image, dots nav
const slides = [
  {
    eyebrow: "MEME · Women's Atelier · Egypt",
    headline: "TOP BRANDS,",
    italicTail: "ONE STORE.",
    subheading: "Discover more than 30 brands in one place",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=90&auto=format&fit=crop",
    cta: { label: "Shop Now", href: "/shop" },
    align: "left" as const,
  },
  {
    eyebrow: "Nationwide delivery · COD available",
    headline: "FAST SHIPPING",
    italicTail: "ACROSS EGYPT.",
    subheading: "From Cairo to Alexandria, Delta to Red Sea — delivered to your door",
    image:
      "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?w=1920&q=90&auto=format&fit=crop",
    cta: { label: "Explore Collection", href: "/collection/premium-brands" },
    align: "left" as const,
  },
  {
    eyebrow: "Crafted in our Cairo atelier",
    headline: "Uncompromising",
    italicTail: "Quality.",
    subheading: "Where craftsmanship meets contemporary design",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1920&q=90&auto=format&fit=crop",
    cta: { label: "Shop Now", href: "/collection/atelier-noir" },
    align: "center" as const,
  },
  {
    eyebrow: "Lifetime repairs · Numbered editions",
    headline: "CRAFTED FOR",
    italicTail: "THE FEW.",
    subheading: "Worn by the bold. Engineered to outlive every trend cycle.",
    image:
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=1920&q=90&auto=format&fit=crop",
    cta: { label: "Shop Now", href: "/collection/core-essentials" },
    align: "left" as const,
  },
];

export function HeroCarousel() {
  const [index, setIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (i: number, dir = 1) => {
    setIndex((i + slides.length) % slides.length);
    setDirection(dir);
  };
  const next = React.useCallback(() => goTo(index + 1, 1), [index]);
  const prev = React.useCallback(() => goTo(index - 1, -1), [index]);

  React.useEffect(() => {
    timerRef.current = setInterval(next, 7000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next]);

  const pause = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const resume = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 7000);
  };

  const slide = slides[index];

  return (
    <section
      className="relative h-[88vh] min-h-[620px] w-full overflow-hidden bg-black"
      onMouseEnter={pause}
      onMouseLeave={resume}
      role="region"
      aria-roledescription="carousel"
      aria-label="MEME featured collections"
    >
      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          key={index}
          custom={direction}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={slide.image}
            alt={slide.headline}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Dark overlay for legibility — gold tinted to match brand */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/80" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full flex flex-col">
        <div
          className={`flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-20 text-background ${
            slide.align === "center" ? "items-center text-center" : "items-start text-left"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${index}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`max-w-3xl ${slide.align === "center" ? "mx-auto" : ""}`}
            >
              <p className="text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-6 text-[#f6ec91]">
                {slide.eyebrow}
              </p>
              <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl xl:text-[7.5rem] font-medium leading-[0.92] tracking-tight">
                {slide.headline}
                <br />
                <span className="italic font-light text-[#f6ec91]">{slide.italicTail}</span>
              </h1>
              <p className="mt-6 text-sm sm:text-base max-w-xl opacity-90 leading-relaxed">
                {slide.subheading}
              </p>
              <div className="mt-9">
                <Link
                  href={slide.cta.href}
                  className="group inline-flex items-center gap-2 h-12 px-8 rounded-full bg-[#f6ec91] text-black text-sm font-semibold hover:bg-[#f6ec91]/90 transition-colors"
                >
                  {slide.cta.label}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls — dots + prev/next, matching reference */}
        <div className="absolute bottom-7 inset-x-0 flex items-center justify-between px-6 sm:px-10 lg:px-20 text-background">
          <div className="flex items-center gap-3">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > index ? 1 : -1)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === index ? "w-10 bg-[#f6ec91]" : "w-2.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
            <span className="ml-4 text-[10px] uppercase tracking-[0.25em] opacity-80 tabular-nums">
              {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
