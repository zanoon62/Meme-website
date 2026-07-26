// Egypt-first currency formatting.
// Default: EGP with en-US locale (English numerals, widely understood in Egypt).
// Pass "ar-EG" for Arabic numerals.

export function formatPrice(price: number, currency: string = "EGP", locale: string = "en-US"): string {
  if (currency === "EGP") {
    // Use Egyptian "LE" prefix matching Shopify en-EG locale convention
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    return `LE ${formatted}`;
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatPriceDetailed(price: number, currency: string = "EGP", locale: string = "en-US"): string {
  if (currency === "EGP") {
    // Use Egyptian "LE" prefix with 2 decimal places matching reference (e.g. LE 650.00)
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
    return `LE ${formatted}`;
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

// Egyptian Arabic display (ج.م)
export function formatPriceAr(price: number, currency: string = "EGP"): string {
  if (currency === "EGP") {
    const formatted = new Intl.NumberFormat("ar-EG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    return `${formatted} ج.م`;
  }
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function calculateDiscount(price: number, compareAtPrice?: number): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

// Free shipping threshold in EGP (was 250 USD ≈ 12,000 EGP)
export const FREE_SHIPPING_THRESHOLD = 7500;

export function getShippingProgress(subtotal: number) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  return { remaining, progress, qualified: subtotal >= FREE_SHIPPING_THRESHOLD };
}

// ============ Egypt Shipping Zones ============
export type ShippingZone = {
  id: string;
  name: string;
  nameAr: string;
  cost: number;
  estimatedDays: string;
  codAvailable: boolean;
};

export const SHIPPING_ZONES: ShippingZone[] = [
  {
    id: "cairo",
    name: "Cairo (Greater Cairo)",
    nameAr: "القاهرة الكبرى",
    cost: 75,
    estimatedDays: "1–2 days",
    codAvailable: true,
  },
  {
    id: "alex",
    name: "Alexandria",
    nameAr: "الإسكندرية",
    cost: 95,
    estimatedDays: "2–3 days",
    codAvailable: true,
  },
  {
    id: "delta",
    name: "Delta & Canal Cities (Giza, Mansoura, Tanta, Ismailia, Suez, Port Said)",
    nameAr: "الدلتا والقناة",
    cost: 110,
    estimatedDays: "2–4 days",
    codAvailable: true,
  },
  {
    id: "upper",
    name: "Upper Egypt (Luxor, Aswan, Asyut, Minya, Sohag)",
    nameAr: "الصعيد",
    cost: 145,
    estimatedDays: "3–5 days",
    codAvailable: true,
  },
  {
    id: "redsea",
    name: "Red Sea & Sinai (Hurghada, Sharm El-Sheikh, Dahab)",
    nameAr: "البحر الأحمر وسيناء",
    cost: 165,
    estimatedDays: "3–6 days",
    codAvailable: false,
  },
];

// ============ Egyptian Payment Methods ============
export type PaymentMethod = {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string; // emoji or short text
  processingFee?: number; // flat fee in EGP
  feePercent?: number; // percentage of total
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "card",
    name: "Credit / Debit Card",
    nameAr: "بطاقة ائتمان / خصم",
    description: "Visa, Mastercard, Meeza — instant payment",
    descriptionAr: "فيزا، ماستركارد، ميزا — دفع فوري",
    icon: "💳",
    feePercent: 2.5,
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    nameAr: "الدفع عند الاستلام",
    description: "Pay in cash when your order arrives — EGP only",
    descriptionAr: "ادفع نقدًا عند الاستلام — جنيه مصري فقط",
    icon: "💵",
    processingFee: 25,
  },
  {
    id: "fawry",
    name: "Fawry Reference Code",
    nameAr: "فوري",
    description: "Pay at any Fawry outlet using your reference code",
    descriptionAr: "ادفع في أي فرع فوري باستخدام كود المرجع",
    icon: "🟠",
    processingFee: 15,
  },
  {
    id: "vodafone",
    name: "Vodafone Cash",
    nameAr: "فودافون كاش",
    description: "Pay instantly via Vodafone Cash wallet",
    descriptionAr: "ادفع فورًا عبر محفظة فودافون كاش",
    icon: "🔴",
    processingFee: 12,
  },
  {
    id: "instapay",
    name: "InstaPay",
    nameAr: "إنستاباي",
    description: "Instant bank transfer via InstaPay app",
    descriptionAr: "تحويل بنكي فوري عبر تطبيق إنستاباي",
    icon: "⚡",
    processingFee: 0,
  },
];
