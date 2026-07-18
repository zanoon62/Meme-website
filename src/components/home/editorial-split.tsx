"use client";

import * as React from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type EditorialSplitProps = {
  eyebrow: string;
  title: string;
  italicTail?: string;
  body: string[];
  image: string;
  imageAlt: string;
  cta?: { label: string; href: string };
  reverse?: boolean;
  tone?: "default" | "dark";
  /** Optional stats array shown below the body text. */
  stats?: { value: string; label: string }[];
  id?: string;
};

export function EditorialSplit({
  eyebrow,
  title,
  italicTail,
  body,
  image,
  imageAlt,
  cta,
  reverse,
  tone = "default",
  stats,
  id,
}: EditorialSplitProps) {
  const isDark = tone === "dark";
  return (
    <section
      id={id}
      className={cn(
        "py-20 lg:py-28 border-t",
        isDark ? "bg-foreground text-background border-background/10" : "bg-background border-border/60"
      )}
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "lg:col-span-6 relative aspect-[4/5] rounded-sm overflow-hidden",
              reverse && "lg:order-2"
            )}
          >
            <Image
              src={image}
              alt={imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>

          {/* Text */}
          <div className={cn("lg:col-span-6", reverse && "lg:order-1")}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <p
                className={cn(
                  "text-[11px] uppercase tracking-[0.3em] mb-6",
                  isDark ? "text-background/70" : "text-muted-foreground"
                )}
              >
                {eyebrow}
              </p>
              <h2
                className={cn(
                  "font-display text-4xl lg:text-6xl tracking-tight leading-[1.04]",
                  isDark ? "text-background" : "text-foreground"
                )}
              >
                {title}
                {italicTail && (
                  <>
                    <br />
                    <span className="italic font-light opacity-80">{italicTail}</span>
                  </>
                )}
              </h2>
              <div
                className={cn(
                  "mt-7 space-y-5 text-base leading-relaxed max-w-xl",
                  isDark ? "text-background/85" : "text-foreground/85"
                )}
              >
                {body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {stats && (
                <div className="mt-10 grid grid-cols-3 gap-6 max-w-lg">
                  {stats.map((s, i) => (
                    <div key={i}>
                      <p className="font-display text-3xl lg:text-4xl">{s.value}</p>
                      <p
                        className={cn(
                          "text-[11px] uppercase tracking-wider mt-1",
                          isDark ? "text-background/60" : "text-muted-foreground"
                        )}
                      >
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {cta && (
                <div className="mt-9">
                  <Link
                    href={cta.href}
                    className={cn(
                      "group inline-flex items-center gap-2 h-12 px-8 rounded-full text-sm font-medium transition-colors",
                      isDark
                        ? "bg-background text-foreground hover:bg-background/90"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    )}
                  >
                    {cta.label}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
