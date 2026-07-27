"use client";

import * as React from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useHomepageConfig } from "@/components/providers/homepage-store";
import { useLang } from "@/components/layout/language-toggle";

export function HeroCarousel() {
  const config = useHomepageConfig();
  const [lang] = useLang();
  const section = config.hero;

  // Only render visible slides
  const slides = section.slides.filter((s) => s.visible);

  const [index, setIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset index when slides change (e.g. admin hides a slide)
  React.useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  if (!section.visible || slides.length === 0) return null;

  const goTo = (i: number, dir = 1) => {
    setIndex((i + slides.length) % slides.length);
    setDirection(dir);
  };
  const next = () => goTo(index + 1, 1);
  const prev = () => goTo(index - 1, -1);

  // Auto-advance
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    timerRef.current = setInterval(next, 7000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [index, slides.length]);

  const pause = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const resume = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 7000);
  };

  const slide = slides[index];
  const isRtl = lang === "ar";

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
          key={slide.id}
          custom={direction}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={slide.image}
            alt={isRtl ? slide.headline.ar : slide.headline.en}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/80" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full flex flex-col">
        <div
          className={`flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-20 text-background ${
            slide.align === "center" ? "items-center text-center" : isRtl ? "items-end text-right" : "items-start text-left"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${slide.id}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`max-w-3xl ${slide.align === "center" ? "mx-auto" : ""}`}
            >
              <p className="text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-6 text-[#f6ec91]">
                {isRtl ? slide.eyebrow.ar : slide.eyebrow.en}
              </p>
              <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl xl:text-[7.5rem] font-medium leading-[0.92] tracking-tight">
                {isRtl ? slide.headline.ar : slide.headline.en}
                <br />
                <span className="italic font-light text-[#f6ec91]">
                  {isRtl ? slide.italicTail.ar : slide.italicTail.en}
                </span>
              </h1>
              <p className="mt-6 text-sm sm:text-base max-w-xl opacity-90 leading-relaxed">
                {isRtl ? slide.subheading.ar : slide.subheading.en}
              </p>
              <div className="mt-9">
                <Link
                  href={slide.ctaHref}
                  className="group inline-flex items-center gap-2 h-12 px-8 rounded-full bg-[#f6ec91] text-black text-sm font-semibold hover:bg-[#f6ec91]/90 transition-colors"
                >
                  {isRtl ? slide.ctaLabel.ar : slide.ctaLabel.en}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
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
