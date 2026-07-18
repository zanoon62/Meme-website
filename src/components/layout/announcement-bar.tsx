"use client";

import * as React from "react";
import { Sparkles, Truck, Shield } from "lucide-react";
import { useLang } from "./language-toggle";

const announcementsEn = [
  { icon: Truck, text: "Free shipping across Egypt on orders over 7,500 EGP" },
  { icon: Sparkles, text: "New Atelier Noir drop — limited pieces · Cairo atelier" },
  { icon: Shield, text: "Cash on Delivery available · Fawry · Vodafone Cash · InstaPay" },
];

const announcementsAr = [
  { icon: Truck, text: "شحن مجاني داخل مصر للطلبات فوق ٧٥٠٠ ج.م" },
  { icon: Sparkles, text: "تشكيلة أتيليه نوار الجديدة — قطع محدودة · ورشة القاهرة" },
  { icon: Shield, text: "الدفع عند الاستلام متاح · فوري · فودافون كاش · إنستا باي" },
];

export function AnnouncementBar() {
  const [lang] = useLang();
  const items = lang === "ar" ? announcementsAr : announcementsEn;

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="bg-black text-[#f6ec91] text-[11px] sm:text-xs tracking-wide overflow-hidden border-b border-[#f6ec91]/20"
    >
      <div className="flex whitespace-nowrap animate-marquee py-2">
        {[...items, ...items, ...items, ...items].map((a, i) => (
          <span key={i} className="flex items-center gap-2 mx-8 uppercase font-medium">
            <a.icon className="h-3 w-3 opacity-80" />
            {a.text}
          </span>
        ))}
      </div>
    </div>
  );
}
