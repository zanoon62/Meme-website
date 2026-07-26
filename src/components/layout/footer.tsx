"use client";

import * as React from "react";
import Link from "next/link";
import { Instagram, ArrowUpRight, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Cloned from dream-stock3 reference footer:
// - Hero block: large gradient "MEME" brand text + manifesto line
// - SHOP column: New Arrivals, Collections, Limited Editions, Sale
// - INFO column: About Us, Contact, Shipping & Returns, Privacy Policy, Terms
// - JOIN THE INNER CIRCLE newsletter
// - Social icons + payment methods
// - Copyright bottom bar

const shopLinks = [
  { label: "New Arrivals", href: "/shop?filter=new" },
  { label: "Collections", href: "/shop" },
  { label: "Limited Editions", href: "/shop?filter=limited" },
  { label: "Sale", href: "/shop?filter=sale" },
];

const infoLinks = [
  { label: "About Us", href: "/" },
  { label: "Contact", href: "/" },
  { label: "Shipping & Returns", href: "/" },
  { label: "Privacy Policy", href: "/" },
  { label: "Terms of Service", href: "/" },
];

const socials = [
  { label: "Instagram", href: "https://www.instagram.com/suited_by_meme", handle: "@suited_by_meme" },
  { label: "TikTok", href: "#", handle: "@suited_by_meme" },
  { label: "WhatsApp", href: "https://wa.me/201000000000", handle: "+20 100 000 0000" },
  { label: "Facebook", href: "#", handle: "/suitedbymeme" },
];

const paymentMethods = ["VISA", "MASTERCARD", "MEEZA", "COD", "FAWRY", "VODAFONE CASH", "INSTAPAY"];

export function Footer() {
  const [email, setEmail] = React.useState("");
  const [openCol, setOpenCol] = React.useState<string | null>(null);

  const submitNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    toast.success("Welcome to the inner circle. Check your inbox.");
    setEmail("");
  };

  const toggleCol = (title: string) => setOpenCol((c) => (c === title ? null : title));

  return (
    <footer className="mt-auto bg-black text-white relative overflow-hidden">
      {/* Background brand watermark (cloned from reference) */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pointer-events-none select-none">
        <span className="brand-watermark">MEME</span>
      </div>

      <div className="relative z-10 max-w-[1300px] mx-auto px-5 sm:px-10 pt-16 lg:pt-24 pb-8">
        {/* Hero block — large gradient brand text + manifesto (cloned) */}
        <div className="text-center pb-12 lg:pb-16 border-b border-[#f6ec91]/30 mb-12">
          <h2 className="font-display font-black uppercase tracking-[0.05em] text-gold-gradient leading-none"
              style={{ fontSize: "clamp(50px, 8vw, 100px)" }}>
            MEME
          </h2>
          <p className="italic text-base sm:text-lg text-white/80 mt-5">
            Crafted for the Few. Worn by the Bold.
          </p>
        </div>

        {/* Main grid: SHOP + INFO + Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 mb-14">
          {/* SHOP column */}
          <div>
            <button
              onClick={() => toggleCol("SHOP")}
              aria-expanded={openCol === "SHOP"}
              className="md:cursor-default w-full flex md:block items-center justify-between md:justify-start text-left mb-4 md:mb-5"
            >
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#f6ec91]">SHOP</p>
              <span className="md:hidden text-white/60 text-xl leading-none">
                {openCol === "SHOP" ? "−" : "+"}
              </span>
            </button>
            <ul
              className={`space-y-3 transition-all duration-300 ${
                openCol === "SHOP" ? "opacity-100 max-h-96" : "opacity-100 max-h-96 md:opacity-100 md:max-h-none"
              } ${openCol !== "SHOP" ? "hidden md:block opacity-0 max-h-0 md:opacity-100 md:max-h-none" : ""}`}
            >
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/75 hover:text-[#f6ec91] transition-colors link-underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* INFO column */}
          <div>
            <button
              onClick={() => toggleCol("INFO")}
              aria-expanded={openCol === "INFO"}
              className="md:cursor-default w-full flex md:block items-center justify-between md:justify-start text-left mb-4 md:mb-5"
            >
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#f6ec91]">INFO</p>
              <span className="md:hidden text-white/60 text-xl leading-none">
                {openCol === "INFO" ? "−" : "+"}
              </span>
            </button>
            <ul
              className={`space-y-3 transition-all duration-300 ${
                openCol === "INFO" ? "block opacity-100 max-h-96" : "hidden md:block opacity-0 max-h-0 md:opacity-100 md:max-h-none"
              }`}
            >
              {infoLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/75 hover:text-[#f6ec91] transition-colors link-underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/admin"
                  className="text-sm text-white/75 hover:text-[#f6ec91] transition-colors link-underline"
                >
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* JOIN THE INNER CIRCLE — Newsletter (cloned) */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#f6ec91] mb-3">
              JOIN THE INNER CIRCLE
            </p>
            <p className="text-sm text-white/75 italic mb-5">
              Exclusive drops. No noise.
            </p>
            <form onSubmit={submitNewsletter} className="space-y-3">
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-12 bg-transparent border border-white/20 text-white placeholder:text-white/40 focus-visible:border-[#f6ec91] rounded-none pr-32"
                />
                <Button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-5 bg-[#f6ec91] text-black hover:bg-[#f6ec91]/80 rounded-none font-semibold text-xs uppercase tracking-wider"
                >
                  Submit
                </Button>
              </div>
              <p className="text-[10px] text-white/40">
                By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
              </p>
            </form>

            {/* Contact info */}
            <div className="mt-7 space-y-2.5">
              <a
                href="mailto:atelier@suitedbymeme.com"
                className="flex items-center gap-3 text-xs text-white/70 hover:text-[#f6ec91] transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-[#f6ec91]/70" />
                atelier@suitedbymeme.com
              </a>
              <a
                href="tel:+201000000000"
                className="flex items-center gap-3 text-xs text-white/70 hover:text-[#f6ec91] transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-[#f6ec91]/70" />
                +20 100 000 0000
              </a>
              <p className="flex items-start gap-3 text-xs text-white/70">
                <MapPin className="h-3.5 w-3.5 text-[#f6ec91]/70 mt-0.5 flex-shrink-0" />
                <span>The MEME Atelier · 12 Taha Hussein St. · Zamalek · Cairo · Egypt</span>
              </p>
            </div>
          </div>
        </div>

        {/* Social icons row */}
        <div className="pt-8 border-t border-white/10 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#f6ec91] mb-3">Follow Us</p>
              <div className="flex flex-wrap gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target={s.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 px-4 h-9 rounded-full border border-white/20 hover:border-[#f6ec91] hover:bg-[#f6ec91] hover:text-black transition-all text-xs"
                  >
                    {s.label}
                    <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                  </a>
                ))}
              </div>
            </div>

            {/* Payment methods */}
            <div className="flex flex-wrap gap-2 sm:justify-end items-center">
              <span className="text-[10px] uppercase tracking-[0.25em] text-white/60 mr-2">We Accept</span>
              {paymentMethods.map((p) => (
                <span
                  key={p}
                  className="px-2.5 h-7 inline-flex items-center justify-center text-[10px] font-semibold tracking-wider border border-white/20 rounded-sm text-white/80"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] text-white/50">
          <p>© {new Date().getFullYear()} MEME. All rights reserved. Suited by MEME · Cairo, Egypt</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
            <Link href="/" className="hover:text-[#f6ec91] transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-[#f6ec91] transition-colors">Terms of Service</Link>
            <Link href="/" className="hover:text-[#f6ec91] transition-colors">Cookies</Link>
            <Link href="/admin" className="hover:text-[#f6ec91] transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
