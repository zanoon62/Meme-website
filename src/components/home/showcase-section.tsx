"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/components/providers/ui-provider";
import { cn } from "@/lib/utils";

type ShowcaseSectionProps = {
  eyebrow: string;
  title: string;
  italicTail?: string;
  description?: string;
  products: Product[];
  /** Optional category tabs — "All" is always prepended. */
  tabs?: string[];
  /** Optional "view all" link, hidden on mobile. */
  viewAllHref?: string;
  /** Limit how many cards render at once per tab. */
  limit?: number;
  /** Section background tone. */
  tone?: "default" | "muted" | "dark";
  /** Section id, for deep-linking. */
  id?: string;
};

export function ShowcaseSection({
  eyebrow,
  title,
  italicTail,
  description,
  products,
  tabs,
  viewAllHref,
  limit = 8,
  tone = "default",
  id,
}: ShowcaseSectionProps) {
  // Build the tab list from props, always with "All" first
  const tabList = React.useMemo(() => {
    if (!tabs || tabs.length === 0) return ["All"];
    return ["All", ...tabs.filter((t, i, arr) => arr.indexOf(t) === i)];
  }, [tabs]);

  const [active, setActive] = React.useState("All");

  const filtered = React.useMemo(() => {
    const list = active === "All" ? products : products.filter((p) => p.category === active);
    // Dedupe by id (some products appear in multiple flags)
    const seen = new Set<string>();
    return list
      .filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      })
      .slice(0, limit);
  }, [active, products, limit]);

  const sectionTone = {
    default: "bg-background",
    muted: "bg-accent/30",
    dark: "bg-foreground text-background",
  }[tone];

  const headingTone = tone === "dark" ? "text-background" : "text-foreground";
  const subTone = tone === "dark" ? "text-background/70" : "text-muted-foreground";
  const tabTone = (isActive: boolean) =>
    tone === "dark"
      ? isActive
        ? "bg-background text-foreground"
        : "border-background/30 text-background hover:bg-background/10"
      : isActive
        ? "bg-foreground text-background"
        : "border-border text-foreground hover:bg-foreground/5";

  return (
    <section id={id} className={cn("py-20 lg:py-28 border-t", tone === "dark" ? "border-background/10" : "border-border/60", sectionTone)}>
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10 lg:mb-14">
          <div className="max-w-2xl">
            <p className={cn("text-[11px] uppercase tracking-[0.2em] mb-3", subTone)}>{eyebrow}</p>
            <h2 className={cn("font-display text-4xl lg:text-6xl tracking-tight leading-[1.0]", headingTone)}>
              {title}
              {italicTail && (
                <>
                  {" "}
                  <span className="italic font-light opacity-80">{italicTail}</span>
                </>
              )}
            </h2>
            {description && (
              <p className={cn("mt-4 text-sm leading-relaxed max-w-xl", subTone)}>{description}</p>
            )}
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className={cn(
                "hidden sm:inline-flex items-center gap-1 text-sm link-underline w-fit",
                tone === "dark" ? "text-background" : "text-foreground"
              )}
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Tabs */}
        {tabList.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {tabList.map((t) => (
              <button
                key={t}
                onClick={() => setActive(t)}
                className={cn(
                  "px-4 h-9 rounded-full text-xs uppercase tracking-[0.15em] font-medium transition-colors border",
                  tabTone(active === t)
                )}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-6"
          >
            {filtered.map((p, i) => (
              <ProductCard key={`${active}-${p.id}`} product={p} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Mobile view-all */}
        {viewAllHref && (
          <div className="mt-10 sm:hidden">
            <Link
              href={viewAllHref}
              className={cn(
                "inline-flex items-center gap-1 text-sm link-underline",
                tone === "dark" ? "text-background" : "text-foreground"
              )}
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
