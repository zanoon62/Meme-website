"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useHomepageConfig } from "@/components/providers/homepage-store";
import { useLang } from "@/components/layout/language-toggle";

/**
 * Manifesto + "Join the Inner Circle" newsletter block.
 * Content fully driven by the homepage store (bilingual).
 */
export function ManifestoNewsletter() {
  const [email, setEmail] = React.useState("");
  const config = useHomepageConfig();
  const [lang] = useLang();
  const section = config.manifesto;
  const isRtl = lang === "ar";

  if (!section.visible) return null;

  const t = <K extends keyof typeof section>(key: K) => {
    const val = section[key] as { en: string; ar: string } | undefined;
    if (!val || typeof val !== "object") return "";
    return isRtl ? val.ar : val.en;
  };

  const onSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success(
      isRtl ? "مرحباً بك في الدائرة الخاصة." : "Welcome to the inner circle.",
      { description: isRtl ? "تحقق من بريدك لتحصل على خصم ١٠٪ على أول طلب." : "Check your inbox for 10% off your first order." }
    );
    setEmail("");
  };

  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      className="bg-black text-white border-t border-[#f6ec91]/20 relative overflow-hidden"
    >
      {/* Background watermark */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none opacity-50">
        <span className="brand-watermark">MEME</span>
      </div>
      {/* Manifesto hero */}
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 pt-20 lg:pt-28 pb-16 lg:pb-20">
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-[11px] uppercase tracking-[0.3em] text-[#f6ec91] mb-6 text-center"
        >
          {t("eyebrow")}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.08] text-center max-w-4xl mx-auto"
        >
          {t("headline")}
          <br />
          <span className="italic font-light text-[#f6ec91]">
            {t("italicTail")}
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mt-7 text-sm sm:text-base text-white/70 leading-relaxed text-center max-w-2xl mx-auto"
        >
          {t("body")}
        </motion.p>
      </div>

      {/* Newsletter */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 py-14 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#f6ec91] mb-3">
                {t("newsletterEyebrow")}
              </p>
              <h3 className="font-display text-3xl lg:text-5xl leading-[1.05] tracking-tight">
                {t("newsletterTitle")}
                <br />
                <span className="italic font-light text-[#f6ec91]">
                  {t("newsletterItalic")}
                </span>
              </h3>
              <p className="mt-5 text-sm text-white/70 max-w-md leading-relaxed">
                {t("newsletterBody")}
              </p>
            </div>
            <form onSubmit={onSubscribe} className="w-full">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isRtl ? "بريدك الإلكتروني" : "Your email address"}
                  className="h-14 rounded-full border-2 border-white/20 bg-transparent px-6 text-base text-white placeholder:text-white/40 focus-visible:border-[#f6ec91] flex-1"
                />
                <button
                  type="submit"
                  className="group inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-[#f6ec91] text-black text-sm font-semibold hover:bg-[#f6ec91]/80 transition-colors whitespace-nowrap"
                >
                  {isRtl ? "اشترك" : "Subscribe"}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <p className="mt-3 text-xs text-white/50">
                {isRtl
                  ? "بالاشتراك، تقبل تلقي رسائل تسويقية من ميم. يمكنك إلغاء الاشتراك في أي وقت."
                  : "By subscribing, you agree to receive marketing emails from MEME. Unsubscribe anytime."}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
