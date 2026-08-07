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
        eyebrow: { en: "SUITED BY MEME · Cairo Atelier", ar: "سوتيد باي ميم · أتيليه القاهرة" },
        headline: { en: "IT STARTS", ar: "تبدأ" },
        italicTail: { en: "WITH YOU.", ar: "معك." },
        subheading: { en: "M-ake E-very M-oment E-xceptional · Tailored suits made to fit you perfectly", ar: "اجعلي كل لحظة استثنائية · بدل ومجموعات رسمية مُفصّلة تناسبك تماماً" },
        image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1920&q=90&auto=format&fit=crop",
        ctaLabel: { en: "Shop Tailored Sets", ar: "تسوق المجموعات الرسمية" },
        ctaHref: "/shop",
        align: "left",
      },
      {
        id: "slide-2",
        visible: true,
        eyebrow: { en: "As seen on @suited_by_meme", ar: "كما يظهر على suited_by_meme@" },
        headline: { en: "THE MUST HAVE", ar: "الإطلالة" },
        italicTail: { en: "LOOK.", ar: "الأكثر طلباً." },
        subheading: { en: "Tailored V-neck vests & wide-leg trouser sets in Marsala Burgundy and Midnight Navy", ar: "صديريات فيست وبنطلونات واسعة باللون البورجاندي والنيفي" },
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&q=90&auto=format&fit=crop",
        ctaLabel: { en: "Explore Collection", ar: "استكشف التشكيلة" },
        ctaHref: "/shop",
        align: "left",
      },
      {
        id: "slide-3",
        visible: true,
        eyebrow: { en: "Our Story Begins · High Tailoring", ar: "بداية قصتنا · حياكة راقية" },
        headline: { en: "M-AKE E-VERY", ar: "اجعلي كل" },
        italicTail: { en: "MOMENT EXCEPTIONAL.", ar: "لحظة استثنائية." },
        subheading: { en: "Tailored suits with style, elegance and uncompromised quality", ar: "بدل رسمية بأناقة وجودة لا تُضاهى" },
        image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1920&q=90&auto=format&fit=crop",
        ctaLabel: { en: "Discover Atelier", ar: "اكتشف الأتيليه" },
        ctaHref: "/shop",
        align: "center",
      },
    ],
  },
  sponsors: {
    visible: true,
    eyebrow: { en: "Suited by MEME · Cairo & Alexandria Atelier", ar: "سوتيد باي ميم · أتيليه القاهرة والإسكندرية" },
    subtext: { en: "Tailored suits with style and quality — shipped fast across Egypt", ar: "بدل رسمية بأناقة وجودة — شحن سريع لجميع محافظات مصر" },
  },
  bestSellers: {
    visible: true,
    eyebrow: { en: "Instagram Icons", ar: "أيقونات إنستغرام" },
    title: { en: "Our Signature", ar: "تشكيلاتنا" },
    italicTail: { en: "Suits & Sets.", ar: "الأيقونية." },
    description: {
      en: "Featured on @suited_by_meme — tailored vest sets, cropped blazers, and double-breasted blazer dresses crafted for the modern woman.",
      ar: "كما يظهر على suited_by_meme@ — مجموعات الصديريات الرسمية، البليزر القصير، وفساتين البليزر الفاخرة.",
    },
  },
  editorialPremium: {
    visible: true,
    eyebrow: { en: "Suited by MEME · Signature Craft", ar: "سوتيد باي ميم · الحرفية الأيقونية" },
    title: { en: "Tailored to fit you", ar: "مُفصّلة لتناسبك" },
    italicTail: { en: "perfectly.", ar: "تماماً." },
    body: {
      en: [
        "M-ake E-very M-oment E-xceptional. Suited by MEME was created for women who demand immaculate tailoring, sculptured shoulders, and fluid wide-leg silhouettes.",
        "From our Marsala Burgundy vest sets to obsidian blazer dresses, every garment is pattern-cut in our atelier using wool-crepes and silk-wool blends.",
      ],
      ar: [
        "اجعلي كل لحظة استثنائية. تُصمم سوتيد باي ميم للمرأة التي تبحث عن الحياكة الراقية والأكتاف المنحوتة والتصاميم الواسعة الأنيقة.",
        "من مجموعات العنابي إلى فساتين البليزر السوداء، تُقص كل قطعة في أتيليهنا باستخدام أجود أنواع الصوف والحرير الإيطالي.",
      ],
    },
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1200&q=85&auto=format&fit=crop",
    ctaLabel: { en: "Shop Tailored Collection", ar: "تسوق تشكيلة البدلات" },
    ctaHref: "/shop",
    stats: [
      { value: "100%", label: { en: "Perfect fit", ar: "قَصّة مثالية" } },
      { value: "Premium", label: { en: "Italian Wool", ar: "صوف إيطالي" } },
      { value: "1-2d", label: { en: "Fast delivery", ar: "توصيل سريع" } },
    ],
  },
  newArrivals: {
    visible: true,
    eyebrow: { en: "Just dropped", ar: "وصل حديثاً" },
    title: { en: "New Collection", ar: "التشكيلة" },
    italicTail: { en: "Arrivals.", ar: "الجديدة." },
    description: {
      en: "Fresh off the atelier tailoring tables — new vest sets, asymmetric draped jumpsuits, and linen summer suits.",
      ar: "أحدث ما خرج من طاولة الأتيليه — مجموعات جديدة، جمبسوت بكتف واحد، وبدل كتان صيفية.",
    },
  },
  limitedDrop: { visible: true },
  trending: {
    visible: true,
    eyebrow: { en: "@suited_by_meme picks", ar: "اختيارات suited_by_meme@" },
    title: { en: "The Must-Have", ar: "الإطلالات" },
    italicTail: { en: "Look.", ar: "الأكثر طلباً." },
    description: {
      en: "The viral pieces moving fastest this week on Instagram.",
      ar: "القطع الأكثر انتشاراً هذا الأسبوع على إنستغرام.",
    },
  },
  editorialStory: {
    visible: true,
    eyebrow: { en: "The MEME Atelier", ar: "أتيليه ميم" },
    title: { en: "M-ake E-very M-oment", ar: "اجعلي كل لحظة" },
    italicTail: { en: "E-xceptional.", ar: "استثنائية." },
    body: {
      en: [
        "M-ake E-very M-oment E-xceptional. Suited by MEME believes that a tailored suit is more than clothing — it is posture, presence, and power.",
        "Our garments are built to give you effortless poise from high-powered business meetings to Nile-side evenings.",
      ],
      ar: [
        "اجعلي كل لحظة استثنائية. تؤمن سوتيد باي ميم أن البدلة الرسمية هي حضور وأناقة وقوة.",
        "تُصمم ملابسنا لتمنحك الثقة المطلقة من اجتماعات العمل إلى السهرات الخاصة.",
      ],
    },
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=85&auto=format&fit=crop",
    ctaLabel: { en: "Read our story", ar: "اقرأ قصتنا" },
    ctaHref: "/shop",
    stats: [
      { value: "Atelier", label: { en: "Craftsmanship", ar: "حرفية الأتيليه" } },
      { value: "100%", label: { en: "Tailored Fit", ar: "مُفصّلة بالكامل" } },
      { value: "Egypt", label: { en: "Nationwide shipping", ar: "شحن لجميع المحافظات" } },
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
  _lastFetch: number;

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
      _lastFetch: 0,

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
          set({ config: merged as HomepageConfig, loading: false, _lastFetch: Date.now() });
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
