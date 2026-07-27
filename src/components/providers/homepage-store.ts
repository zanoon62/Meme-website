"use client";

/**
 * Homepage Settings Store
 *
 * Zustand store that holds the admin-configurable homepage section config.
 * Persists to Supabase (homepage_settings table) when configured.
 * Falls back to localStorage when Supabase is not configured.
 *
 * Each section has:
 *   - visible: boolean   — show / hide the section on the storefront
 *   - content: { en, ar } — bilingual editable text fields
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type BiLang = { en: string; ar: string };

export type AnnouncementItem = { en: string; ar: string; visible: boolean };

export type HeroSlide = {
  id: string;
  visible: boolean;
  eyebrow: BiLang;
  headline: BiLang;
  italicTail: BiLang;
  subheading: BiLang;
  image: string;
  ctaLabel: BiLang;
  ctaHref: string;
  align: "left" | "center";
};

export type EditorialStats = { value: string; label: BiLang }[];

export type SectionBase = { visible: boolean };

export type HomepageConfig = {
  announcement: SectionBase & {
    items: AnnouncementItem[];
  };
  hero: SectionBase & {
    slides: HeroSlide[];
  };
  sponsors: SectionBase & {
    eyebrow: BiLang;
    subtext: BiLang;
  };
  bestSellers: SectionBase & {
    eyebrow: BiLang;
    title: BiLang;
    italicTail: BiLang;
    description: BiLang;
  };
  editorialPremium: SectionBase & {
    eyebrow: BiLang;
    title: BiLang;
    italicTail: BiLang;
    body: { en: string[]; ar: string[] };
    image: string;
    ctaLabel: BiLang;
    ctaHref: string;
    stats: EditorialStats;
  };
  newArrivals: SectionBase & {
    eyebrow: BiLang;
    title: BiLang;
    italicTail: BiLang;
    description: BiLang;
  };
  limitedDrop: SectionBase;
  trending: SectionBase & {
    eyebrow: BiLang;
    title: BiLang;
    italicTail: BiLang;
    description: BiLang;
  };
  editorialStory: SectionBase & {
    eyebrow: BiLang;
    title: BiLang;
    italicTail: BiLang;
    body: { en: string[]; ar: string[] };
    image: string;
    ctaLabel: BiLang;
    ctaHref: string;
    stats: EditorialStats;
  };
  valueProps: SectionBase & {
    items: { en: string; ar: string; descEn: string; descAr: string; visible: boolean }[];
  };
  reviews: SectionBase & {
    eyebrow: BiLang;
    title: BiLang;
    subtitle: BiLang;
  };
  instagram: SectionBase & {
    handle: string;
    title: BiLang;
    eyebrow: BiLang;
  };
  faq: SectionBase & {
    items: { qEn: string; qAr: string; aEn: string; aAr: string; visible: boolean }[];
  };
  manifesto: SectionBase & {
    eyebrow: BiLang;
    headline: BiLang;
    italicTail: BiLang;
    body: BiLang;
    newsletterEyebrow: BiLang;
    newsletterTitle: BiLang;
    newsletterItalic: BiLang;
    newsletterBody: BiLang;
  };
};

// ─────────────────────────────────────────────
// DEFAULT CONFIG (factory defaults)
// ─────────────────────────────────────────────

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  announcement: {
    visible: true,
    items: [
      { en: "Free shipping across Egypt on orders over 7,500 EGP", ar: "شحن مجاني داخل مصر للطلبات فوق ٧٥٠٠ ج.م", visible: true },
      { en: "New Atelier Noir drop — limited pieces · Cairo atelier", ar: "تشكيلة أتيليه نوار الجديدة — قطع محدودة · ورشة القاهرة", visible: true },
      { en: "Cash on Delivery available · Fawry · Vodafone Cash · InstaPay", ar: "الدفع عند الاستلام متاح · فوري · فودافون كاش · إنستا باي", visible: true },
    ],
  },
  hero: {
    visible: true,
    slides: [
      {
        id: "slide-1",
        visible: true,
        eyebrow: { en: "MEME · Women's Atelier · Egypt", ar: "ميم · أتيليه المرأة · مصر" },
        headline: { en: "TOP BRANDS,", ar: "أفضل الماركات،" },
        italicTail: { en: "ONE STORE.", ar: "متجر واحد." },
        subheading: { en: "Discover more than 30 brands in one place", ar: "اكتشف أكثر من ٣٠ ماركة في مكان واحد" },
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=90&auto=format&fit=crop",
        ctaLabel: { en: "Shop Now", ar: "تسوق الآن" },
        ctaHref: "/shop",
        align: "left",
      },
      {
        id: "slide-2",
        visible: true,
        eyebrow: { en: "Nationwide delivery · COD available", ar: "توصيل لجميع المحافظات · الدفع عند الاستلام" },
        headline: { en: "FAST SHIPPING", ar: "شحن سريع" },
        italicTail: { en: "ACROSS EGYPT.", ar: "في كل مصر." },
        subheading: { en: "From Cairo to Alexandria, Delta to Red Sea — delivered to your door", ar: "من القاهرة للإسكندرية، الدلتا والبحر الأحمر — حتى بابك" },
        image: "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?w=1920&q=90&auto=format&fit=crop",
        ctaLabel: { en: "Explore Collection", ar: "استكشف التشكيلة" },
        ctaHref: "/collection/premium-brands",
        align: "left",
      },
      {
        id: "slide-3",
        visible: true,
        eyebrow: { en: "Crafted in our Cairo atelier", ar: "مصنوع في أتيليه القاهرة" },
        headline: { en: "Uncompromising", ar: "جودة" },
        italicTail: { en: "Quality.", ar: "لا تُضاهى." },
        subheading: { en: "Where craftsmanship meets contemporary design", ar: "حيث تلتقي الحرفية بالتصميم المعاصر" },
        image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1920&q=90&auto=format&fit=crop",
        ctaLabel: { en: "Shop Now", ar: "تسوق الآن" },
        ctaHref: "/collection/atelier-noir",
        align: "center",
      },
      {
        id: "slide-4",
        visible: true,
        eyebrow: { en: "Lifetime repairs · Numbered editions", ar: "إصلاح مدى الحياة · إصدارات مرقمة" },
        headline: { en: "CRAFTED FOR", ar: "صُنع من أجل" },
        italicTail: { en: "THE FEW.", ar: "القليلين المميزين." },
        subheading: { en: "Worn by the bold. Engineered to outlive every trend cycle.", ar: "يرتديه الجريئون. مصمم ليتجاوز كل موجة موضة." },
        image: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=1920&q=90&auto=format&fit=crop",
        ctaLabel: { en: "Shop Now", ar: "تسوق الآن" },
        ctaHref: "/collection/core-essentials",
        align: "left",
      },
    ],
  },
  sponsors: {
    visible: true,
    eyebrow: { en: "30+ Brands · One Store", ar: "٣٠+ ماركة · متجر واحد" },
    subtext: { en: "Authentic premium brands — shipped fast across Egypt", ar: "ماركات أصلية مميزة — شحن سريع لجميع محافظات مصر" },
  },
  bestSellers: {
    visible: true,
    eyebrow: { en: "Most wanted", ar: "الأكثر طلباً" },
    title: { en: "Our Best", ar: "الأكثر" },
    italicTail: { en: "Sellers.", ar: "مبيعاً." },
    description: {
      en: "Top brands, one store — Zara, H&M, Lacoste, Adidas, Hollister, Hugo Boss & more. Authentic premium pieces, shipped fast across Egypt with cash on delivery.",
      ar: "أفضل الماركات في متجر واحد — زارا، H&M، لاكوست، أديداس، هوليستر، هوغو بوس والمزيد. قطع أصلية مميزة، شحن سريع داخل مصر مع الدفع عند الاستلام.",
    },
  },
  editorialPremium: {
    visible: true,
    eyebrow: { en: "30+ brands · One store", ar: "٣٠+ ماركة · متجر واحد" },
    title: { en: "Premium brands,", ar: "ماركات فاخرة،" },
    italicTail: { en: "authentic & accessible.", ar: "أصيلة وفي متناول الجميع." },
    body: {
      en: [
        "Discover more than 30 brands in one place. We bring you the premium labels you love — Zara, H&M, Lacoste, Adidas, Hollister, Pull&Bear, Bershka, Hugo Boss, Urberry — all in one store, all authentic, all shipped fast across Egypt.",
        "From the everyday essentials to statement pieces, every item in our branded catalog is sourced directly and verified for authenticity. Cash on delivery available nationwide, free shipping over 7,500 EGP, and 14-day returns on every order.",
      ],
      ar: [
        "اكتشف أكثر من ٣٠ ماركة في مكان واحد. نحضر لك أفضل الماركات العالمية — زارا، H&M، لاكوست، أديداس، هوليستر، بول بير، برشكا، هوغو بوس، أوربيري — كلها في متجر واحد، كلها أصلية، كلها تصل بسرعة إلى كل مصر.",
        "من قطع الضرورة اليومية إلى قطع الإطلالة المميزة، كل منتج في كتالوجنا مصدره مباشر ومُتحقق من أصالته. الدفع عند الاستلام متاح في كل مكان، شحن مجاني فوق ٧٥٠٠ ج.م، وإرجاع مجاني خلال ١٤ يوماً.",
      ],
    },
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=85&auto=format&fit=crop",
    ctaLabel: { en: "Shop Premium Brands", ar: "تسوق الماركات الفاخرة" },
    ctaHref: "/collection/premium-brands",
    stats: [
      { value: "30+", label: { en: "Premium brands", ar: "ماركة فاخرة" } },
      { value: "100%", label: { en: "Authentic", ar: "أصلية" } },
      { value: "1-2d", label: { en: "Cairo delivery", ar: "توصيل القاهرة" } },
    ],
  },
  newArrivals: {
    visible: true,
    eyebrow: { en: "Just dropped", ar: "وصل حديثاً" },
    title: { en: "New", ar: "وصل" },
    italicTail: { en: "arrivals.", ar: "حديثاً." },
    description: {
      en: "The latest from the MEME atelier and our premium brand partners — fresh drops every week, engineered for the season ahead.",
      ar: "أحدث تشكيلات أتيليه ميم وشركاء الماركات الفاخرة — قطع جديدة كل أسبوع، مصممة للموسم القادم.",
    },
  },
  limitedDrop: { visible: true },
  trending: {
    visible: true,
    eyebrow: { en: "On the up", ar: "الأكثر انتشاراً" },
    title: { en: "Trending", ar: "الرائج" },
    italicTail: { en: "now.", ar: "الآن." },
    description: {
      en: "Picked by the atelier — the pieces moving fastest this season, from cashmere wraps to Japanese denim to premium branded essentials.",
      ar: "اختيارات الأتيليه — القطع الأسرع مبيعاً هذا الموسم، من الكشمير إلى الجينز الياباني إلى أساسيات الماركات الفاخرة.",
    },
  },
  editorialStory: {
    visible: true,
    eyebrow: { en: "The MEME atelier", ar: "أتيليه ميم" },
    title: { en: "Clothing worth", ar: "ملابس تستحق" },
    italicTail: { en: "keeping for life.", ar: "الاحتفاظ بها للأبد." },
    body: {
      en: [
        "MEME was founded on a single belief: that the clothes a woman wears should be engineered to outlive every trend cycle. We work directly with mills in Italy, Japan, and Portugal to source materials with a story — wools woven on heritage looms, silks spun from mulberry, leathers tanned by hand over months.",
        "Every piece is patterned, cut, and finished in our atelier with an obsession for the details you can't see: the canvassing inside a blazer dress, the bias-cut of a silk slip, the bartack on a leather moto. We build garments for the modern woman's wardrobe — pieces that look right today and in a decade.",
      ],
      ar: [
        "تأسست ميم على قناعة واحدة: أن ملابس المرأة يجب أن تُصمَّم لتتجاوز كل موجة موضة. نعمل مباشرة مع مصانع في إيطاليا واليابان والبرتغال للحصول على خامات تحكي قصة — صوف مُنسَج على أنوال تراثية، وحرير مُغزَل من التوت، وجلد مدبوغ يدوياً على مدى أشهر.",
        "كل قطعة تُخطَّط وتُقطَّع وتُشطَّب في أتيليهنا بهوس للتفاصيل التي لا تُرى: الحشو داخل فستان البليزر، القطع المائل لقميص الحرير، الغرزة المُثبِّتة على الجاكيت الجلدي. نصنع ملابس لخزانة المرأة العصرية — قطع تبدو صحيحة اليوم وبعد عقد.",
      ],
    },
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=85&auto=format&fit=crop",
    ctaLabel: { en: "Read our story", ar: "اقرأ قصتنا" },
    ctaHref: "/",
    stats: [
      { value: "14", label: { en: "Atelier partners", ar: "شريك أتيليه" } },
      { value: "100%", label: { en: "Natural fibers", ar: "ألياف طبيعية" } },
      { value: "∞", label: { en: "Lifetime repairs", ar: "إصلاح مدى الحياة" } },
    ],
  },
  valueProps: {
    visible: true,
    items: [
      { en: "Free shipping across Egypt", ar: "شحن مجاني داخل مصر", descEn: "On all orders over 7,500 EGP. Cairo, Alex, Delta, Upper Egypt & Red Sea.", descAr: "على جميع الطلبات فوق ٧٥٠٠ ج.م. القاهرة، الإسكندرية، الدلتا، الصعيد والبحر الأحمر.", visible: true },
      { en: "14-day returns", ar: "إرجاع خلال ١٤ يوماً", descEn: "Not right? Send it back within 14 days for a full refund. COD available nationwide.", descAr: "لم يعجبك؟ أعده خلال ١٤ يوماً للحصول على استرداد كامل. الدفع عند الاستلام متاح في كل مكان.", visible: true },
      { en: "Authentic guaranteed", ar: "ضمان الأصالة", descEn: "Every premium brand product is sourced directly and verified for authenticity.", descAr: "كل منتج من الماركات الفاخرة مصدره مباشر ومُتحقق من أصالته.", visible: true },
      { en: "Cash on Delivery", ar: "الدفع عند الاستلام", descEn: "Pay in cash when your order arrives. Available nationwide except Red Sea region.", descAr: "ادفع نقداً عند وصول طلبك. متاح في جميع محافظات مصر ما عدا منطقة البحر الأحمر.", visible: true },
    ],
  },
  reviews: {
    visible: true,
    eyebrow: { en: "Customer love", ar: "حب العملاء" },
    title: { en: "Worn & loved.", ar: "مرتداة ومحبوبة." },
    subtitle: { en: "4.9 average · 2,800+ reviews", ar: "متوسط ٤.٩ · أكثر من ٢٨٠٠ تقييم" },
  },
  instagram: {
    visible: true,
    handle: "@suited_by_meme",
    eyebrow: { en: "@suited_by_meme", ar: "@suited_by_meme" },
    title: { en: "Worn by you.", ar: "مرتداة بواسطتك." },
  },
  faq: {
    visible: true,
    items: [
      { qEn: "How do I find my size?", qAr: "كيف أجد مقاسي؟", aEn: "Every product page has a detailed size guide with measurements in inches and centimeters. If you're between sizes, we generally recommend sizing up for a more relaxed fit and sizing down for a tailored fit. Free exchanges within 30 days.", aAr: "كل صفحة منتج تحتوي على دليل مقاسات تفصيلي بالبوصة والسنتيمتر. إذا كنت بين مقاسين، ننصح عادةً بأخذ المقاس الأكبر لملاءمة أريحية والأصغر لملاءمة مُفصَّلة. استبدال مجاني خلال ٣٠ يوماً.", visible: true },
      { qEn: "What is your shipping policy?", qAr: "ما هي سياسة الشحن؟", aEn: "Free shipping across Egypt on orders over 7,500 EGP. Cairo & Giza: 1-2 days. Alexandria: 2-3 days. Delta & Upper Egypt: 3-5 days. Red Sea & Sinai: 3-6 days. Cash on Delivery available nationwide except Red Sea region.", aAr: "شحن مجاني داخل مصر على الطلبات فوق ٧٥٠٠ ج.م. القاهرة والجيزة: ١-٢ يوم. الإسكندرية: ٢-٣ أيام. الدلتا والصعيد: ٣-٥ أيام. البحر الأحمر وسيناء: ٣-٦ أيام. الدفع عند الاستلام متاح في كل مكان ما عدا البحر الأحمر.", visible: true },
      { qEn: "Can I return or exchange?", qAr: "هل يمكنني الإرجاع أو الاستبدال؟", aEn: "Yes. We offer 14-day returns and exchanges on all unworn items with tags attached. Items marked 'Final Sale' cannot be returned. Start your return from the account portal or message us on WhatsApp.", aAr: "نعم. نقدم إرجاعاً واستبدالاً خلال ١٤ يوماً على جميع القطع غير المرتداة مع وجود الوسوم. القطع المميزة بـ'تخفيض نهائي' لا يمكن إرجاعها. ابدأ الإرجاع من بوابة الحساب أو راسلنا على واتساب.", visible: true },
      { qEn: "Are the branded products authentic?", qAr: "هل المنتجات الماركة أصلية؟", aEn: "Yes. Every premium branded product (Zara, H&M, Lacoste, Adidas, Hollister, Hugo Boss, etc.) is sourced directly from authorized suppliers and verified for authenticity. We stand behind every item we sell with a 100% authenticity guarantee.", aAr: "نعم. كل منتج من الماركات الفاخرة (زارا، H&M، لاكوست، أديداس، هوليستر، هوغو بوس، إلخ) مصدره مباشر من موردين معتمدين ومُتحقق من أصالته. نضمن أصالة كل قطعة بنسبة ١٠٠٪.", visible: true },
      { qEn: "What payment methods do you accept?", qAr: "ما طرق الدفع المقبولة؟", aEn: "We accept Visa, Mastercard, Meeza (credit/debit cards), Cash on Delivery (nationwide except Red Sea), Fawry reference code, Vodafone Cash, and InstaPay. All payment methods are in Egyptian Pounds (EGP).", aAr: "نقبل فيزا وماستركارد وميزة (بطاقات ائتمانية/خصم)، الدفع عند الاستلام (في كل مكان ما عدا البحر الأحمر)، فوري، فودافون كاش، وإنستاباي. جميع المدفوعات بالجنيه المصري.", visible: true },
      { qEn: "Do you offer alterations?", qAr: "هل تقدمون خدمة الخياطة والتعديل؟", aEn: "Yes. Hemming and basic alterations are complimentary on all tailoring purchases from our Atelier Noir collection. Just bring your garment to our Cairo atelier in Zamalek or mail it in.", aAr: "نعم. التطريف والتعديلات الأساسية مجانية على جميع مشتريات التيلور من مجموعة أتيليه نوار. فقط أحضر قطعتك إلى أتيليهنا في الزمالك أو أرسلها بالبريد.", visible: true },
    ],
  },
  manifesto: {
    visible: true,
    eyebrow: { en: "The MEME Manifesto", ar: "بيان ميم" },
    headline: { en: "We build clothing for the woman", ar: "نصنع ملابس للمرأة" },
    italicTail: { en: "who refuses to be a trend.", ar: "التي ترفض أن تكون موضة عابرة." },
    body: {
      en: "Italian wools. Mulberry silk. Mongolian cashmere. Vegetable-tanned leather. Engineered to outlive every trend cycle — and to be repaired, not replaced, for life.",
      ar: "صوف إيطالي. حرير التوت. كشمير منغولي. جلد مدبوغ نباتياً. مصمم ليتجاوز كل موجة موضة — وليُصلَّح لا ليُستبدَل، مدى الحياة.",
    },
    newsletterEyebrow: { en: "Join the inner circle", ar: "انضم للدائرة الخاصة" },
    newsletterTitle: { en: "Early access to drops.", ar: "وصول مبكر للتشكيلات." },
    newsletterItalic: { en: "10% off your first order.", ar: "خصم ١٠٪ على أول طلب." },
    newsletterBody: {
      en: "Be the first to know about limited drops, atelier stories, and private sales. No spam — just letters from the atelier, two or three times a month.",
      ar: "كن أول من يعلم عن التشكيلات المحدودة وقصص الأتيليه والمبيعات الخاصة. بدون رسائل مزعجة — فقط رسائل من الأتيليه، مرتين أو ثلاث في الشهر.",
    },
  },
};

// ─────────────────────────────────────────────
// STORE TYPE
// ─────────────────────────────────────────────

type HomepageStore = {
  config: HomepageConfig;
  loading: boolean;
  saving: boolean;

  /** Pull the latest config from Supabase (no-op if not configured) */
  fetchFromServer: () => Promise<void>;

  /** Persist the full config to Supabase (or localStorage fallback) */
  saveConfig: (config: HomepageConfig) => Promise<void>;

  /** Update a single top-level section */
  updateSection: <K extends keyof HomepageConfig>(key: K, value: HomepageConfig[K]) => Promise<void>;

  /** Toggle visibility of a section */
  toggleVisibility: (key: keyof HomepageConfig) => Promise<void>;

  /** Reset to factory defaults */
  resetToDefaults: () => Promise<void>;
};

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

export const useHomepageStore = create<HomepageStore>()(
  persist(
    (set, get) => ({
      config: DEFAULT_HOMEPAGE_CONFIG,
      loading: false,
      saving: false,

      fetchFromServer: async () => {
        if (!isSupabaseConfigured()) return;
        try {
          set({ loading: true });
          const supabase = createSupabaseBrowserClient();
          const { data, error } = await supabase
            .from("homepage_settings")
            .select("config")
            .eq("id", "main")
            .single();

          if (error || !data?.config) {
            set({ loading: false });
            return;
          }
          // Deep-merge server config with defaults (so new sections added later still appear)
          const merged = deepMerge(DEFAULT_HOMEPAGE_CONFIG, data.config as Partial<HomepageConfig>);
          set({ config: merged as HomepageConfig, loading: false });
        } catch (e) {
          console.error("fetchFromServer (homepage) failed:", e);
          set({ loading: false });
        }
      },

      saveConfig: async (config) => {
        set({ config, saving: true });
        if (isSupabaseConfigured()) {
          try {
            const res = await fetch("/api/admin/homepage", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ config }),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              console.warn("Save homepage config failed:", err);
            }
          } catch (e) {
            console.warn("Save homepage config error:", e);
          }
        }
        set({ saving: false });
      },

      updateSection: async (key, value) => {
        const next = { ...get().config, [key]: value };
        await get().saveConfig(next);
      },

      toggleVisibility: async (key) => {
        const current = get().config[key];
        const next = {
          ...get().config,
          [key]: { ...current, visible: !current.visible },
        };
        await get().saveConfig(next);
      },

      resetToDefaults: async () => {
        await get().saveConfig(DEFAULT_HOMEPAGE_CONFIG);
      },
    }),
    {
      name: "meme-homepage-settings",
      storage: createJSONStorage(() => localStorage),
      // Only persist config — no loading/saving flags
      partialize: (s) => ({ config: s.config }),
    }
  )
);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Deep-merge two objects — used to handle new config fields added in updates */
function deepMerge<T extends Record<string, unknown>>(
  defaults: T,
  overrides: Partial<T>
): T {
  const result = { ...defaults };
  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const override = overrides[key];
    const def = defaults[key];
    if (
      override !== null &&
      typeof override === "object" &&
      !Array.isArray(override) &&
      typeof def === "object" &&
      def !== null &&
      !Array.isArray(def)
    ) {
      result[key] = deepMerge(
        def as Record<string, unknown>,
        override as Record<string, unknown>
      ) as T[keyof T];
    } else if (override !== undefined) {
      result[key] = override as T[keyof T];
    }
  }
  return result;
}

/** Convenience hook — just reads config */
export function useHomepageConfig(): HomepageConfig {
  return useHomepageStore((s) => s.config);
}
