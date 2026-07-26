"use client";

/**
 * Lightweight i18n dictionary for the storefront.
 *
 * Usage:
 *   const t = useT();
 *   t("shop")
 *
 * Language is controlled by the LanguageToggle component (in language-toggle.tsx)
 * which stores the choice in localStorage and sets <html dir> and <html lang>.
 */

import * as React from "react";
import { useLang } from "@/components/layout/language-toggle";

export type Lang = "en" | "ar";

type Dict = Record<string, { en: string; ar: string }>;

const DICT: Dict = {
  // Nav
  "nav.home": { en: "Home", ar: "الرئيسية" },
  "nav.shop": { en: "Shop", ar: "المتجر" },
  "nav.collections": { en: "Collections", ar: "التشكيلات" },
  "nav.contact": { en: "Contact", ar: "اتصل" },
  "nav.admin": { en: "Admin", ar: "المشرف" },
  "nav.account": { en: "Account", ar: "الحساب" },
  "nav.wishlist": { en: "Wishlist", ar: "المفضلة" },
  "nav.cart": { en: "Cart", ar: "السلة" },
  "nav.search": { en: "Search", ar: "بحث" },

  // Hero
  "hero.shop_now": { en: "Shop Now", ar: "تسوق الآن" },
  "hero.discover": { en: "Discover", ar: "اكتشف" },

  // Sections
  "section.best_sellers": { en: "Our BestSellers.", ar: "الأكثر مبيعاً." },
  "section.new_arrivals": { en: "Newarrivals.", ar: "وصل حديثاً." },
  "section.trending": { en: "Trending now", ar: "الرائج الآن" },
  "section.view_all": { en: "View all", ar: "عرض الكل" },
  "section.shop_all": { en: "Shop all", ar: "تسوق الكل" },

  // Product card
  "product.add_to_cart": { en: "Add to cart", ar: "أضف للسلة" },
  "product.quick_add": { en: "Quick add", ar: "إضافة سريعة" },
  "product.add_to_wishlist": { en: "Add to wishlist", ar: "أضف للمفضلة" },
  "product.new": { en: "NEW", ar: "جديد" },
  "product.limited": { en: "LIMITED", ar: "محدود" },
  "product.best_seller": { en: "Best Seller", ar: "الأكثر مبيعاً" },
  "product.save": { en: "Save", ar: "وفّر" },

  // Cart
  "cart.title": { en: "Your Cart", ar: "سلتك" },
  "cart.empty": { en: "Your cart is empty", ar: "سلتك فارغة" },
  "cart.explore": { en: "Explore the collection", ar: "استكشف التشكيلة" },
  "cart.continue_shopping": { en: "Continue shopping", ar: "متابعة التسوق" },
  "cart.checkout": { en: "Checkout", ar: "إتمام الشراء" },
  "cart.subtotal": { en: "Subtotal", ar: "المجموع الفرعي" },
  "cart.shipping": { en: "Shipping", ar: "الشحن" },
  "cart.total": { en: "Total", ar: "الإجمالي" },

  // Footer
  "footer.shop": { en: "SHOP", ar: "المتجر" },
  "footer.info": { en: "INFO", ar: "معلومات" },
  "footer.connect": { en: "CONNECT", ar: "تواصل" },
  "footer.newsletter": { en: "JOIN THE INNER CIRCLE", ar: "انضم للدائرة الخاصة" },
  "footer.newsletter_cta": { en: "Subscribe for early access to new drops, atelier stories, and members-only offers.", ar: "اشترك للوصول المبكر للتشكيلات الجديدة وقصص الأتيليه والعروض الحصرية." },
  "footer.subscribe": { en: "SUBMIT", ar: "اشتراك" },
  "footer.email_placeholder": { en: "Enter your email", ar: "أدخل بريدك الإلكتروني" },
  "footer.rights": { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },
  "footer.privacy": { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  "footer.terms": { en: "Terms of Service", ar: "شروط الخدمة" },
  "footer.cookies": { en: "Cookies", ar: "ملفات الارتباط" },

  // Account
  "account.welcome": { en: "Welcome back", ar: "مرحباً بعودتك" },
  "account.sign_in": { en: "Sign in", ar: "تسجيل الدخول" },
  "account.sign_up": { en: "Sign up", ar: "إنشاء حساب" },
  "account.email": { en: "Email", ar: "البريد الإلكتروني" },
  "account.password": { en: "Password", ar: "كلمة المرور" },

  // Checkout
  "checkout.title": { en: "Checkout", ar: "إتمام الشراء" },
  "checkout.information": { en: "INFORMATION", ar: "المعلومات" },
  "checkout.shipping": { en: "SHIPPING", ar: "الشحن" },
  "checkout.payment": { en: "PAYMENT", ar: "الدفع" },
  "checkout.place_order": { en: "Place order", ar: "تأكيد الطلب" },
  "checkout.order_confirmed": { en: "Order confirmed", ar: "تم تأكيد الطلب" },
  "checkout.continue_shopping": { en: "Continue shopping", ar: "متابعة التسوق" },
};

export function useT() {
  const [lang] = useLang();
  return React.useCallback(
    (key: string): string => {
      const entry = DICT[key];
      if (!entry) return key;
      return entry[lang] ?? entry.en;
    },
    [lang],
  );
}

export function useLangDir(): "ltr" | "rtl" {
  const [lang] = useLang();
  return lang === "ar" ? "rtl" : "ltr";
}
