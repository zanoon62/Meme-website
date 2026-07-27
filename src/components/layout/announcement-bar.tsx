"use client";

import * as React from "react";
import { Sparkles, Truck, Shield } from "lucide-react";
import { useLang } from "./language-toggle";
import { useHomepageConfig } from "@/components/providers/homepage-store";

const ICONS = [Truck, Sparkles, Shield];

export function AnnouncementBar() {
  const [lang] = useLang();
  const config = useHomepageConfig();
  const section = config.announcement;

  if (!section.visible) return null;

  const visibleItems = section.items.filter((item) => item.visible);
  if (visibleItems.length === 0) return null;

  // Repeat items 4× for seamless marquee
  const repeated = [...visibleItems, ...visibleItems, ...visibleItems, ...visibleItems];

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="bg-black text-[#f6ec91] text-[11px] sm:text-xs tracking-wide overflow-hidden border-b border-[#f6ec91]/20"
    >
      <div className="flex whitespace-nowrap animate-marquee py-2">
        {repeated.map((item, i) => {
          const Icon = ICONS[i % ICONS.length];
          const text = lang === "ar" ? item.ar : item.en;
          return (
            <span key={i} className="flex items-center gap-2 mx-8 uppercase font-medium">
              <Icon className="h-3 w-3 opacity-80" />
              {text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
