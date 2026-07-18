"use client";

import * as React from "react";
import { Sparkles, Truck, Shield } from "lucide-react";

const announcements = [
  { icon: Truck, text: "Free shipping across Egypt on orders over 7,500 EGP" },
  { icon: Sparkles, text: "New Atelier Noir drop — limited pieces · Cairo atelier" },
  { icon: Shield, text: "Cash on Delivery available · Fawry · Vodafone Cash · InstaPay" },
  { icon: Truck, text: "شحن مجاني داخل مصر للطلبات فوق ٧٥٠٠ ج.م" },
];

export function AnnouncementBar() {
  return (
    <div className="bg-black text-[#f6ec91] text-[11px] sm:text-xs tracking-wide overflow-hidden border-b border-[#f6ec91]/20">
      <div className="flex whitespace-nowrap animate-marquee py-2">
        {[...announcements, ...announcements, ...announcements, ...announcements].map((a, i) => (
          <span key={i} className="flex items-center gap-2 mx-8 uppercase font-medium">
            <a.icon className="h-3 w-3 opacity-80" />
            {a.text}
          </span>
        ))}
      </div>
    </div>
  );
}
