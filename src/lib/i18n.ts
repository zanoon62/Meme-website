"use client";

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
  "nav.returns": { en: "Returns", ar: "الاسترجاع" },

  // Hero
  "hero.shop_now": { en: "Shop Now", ar: "تسوق الآن" },
  "hero.discover": { en: "Discover", ar: "اكتشف" },

  // Sections
  "section.best_sellers": { en: "Our BestSellers.", ar: "الأكثر مبيعاً." },
  "section.new_arrivals": { en: "Newarrivals.", ar: "وصل حديثاً." },
  "section.trending": { en: "Trending now", ar: "الرائج الآن" },
  "section.view_all": { en: "View all", ar: "عرض الكل" },
  "section.shop_all": { en: "Shop all", ar: "تسوق الكل" },

  // Shop Page
  "shop.all_products": { en: "All Products", ar: "جميع المنتجات" },
  "shop.tagline": { en: "SHOP", ar: "المتجر" },
  "shop.category": { en: "CATEGORY", ar: "الفئة" },
  "shop.all": { en: "All", ar: "الكل" },
  "shop.sort_by": { en: "Sort by", ar: "ترتيب حسب" },
  "shop.featured": { en: "Featured", ar: "المميزة" },
  "shop.price_low_high": { en: "Price: Low to High", ar: "السعر: من الأقل للأعلى" },
  "shop.price_high_low": { en: "Price: High to Low", ar: "السعر: من الأعلى للأقل" },
  "shop.newest": { en: "Newest", ar: "الأحدث" },
  "shop.price": { en: "PRICE", ar: "السعر" },
  "shop.pieces": { en: "pieces", ar: "منتج" },
  "shop.clear_filters": { en: "Clear filters", ar: "مسح التصفية" },
  "shop.no_products": { en: "No products match your filters.", ar: "لا توجد منتجات تطابق اختياراتك." },

  // Categories
  "cat.all": { en: "All", ar: "الكل" },
  "cat.Dresses": { en: "Dresses", ar: "فساتين" },
  "cat.Tailoring": { en: "Tailoring", ar: "بدل وبليزر" },
  "cat.Outerwear": { en: "Outerwear", ar: "ملابس خارجية وجاكيتات" },
  "cat.Knitwear": { en: "Knitwear", ar: "تريكو وصوف" },
  "cat.Hoodies & Sweatshirts": { en: "Hoodies & Sweatshirts", ar: "هوديز وسويت شيرت" },
  "cat.Hoodies": { en: "Hoodies", ar: "هوديز" },
  "cat.Tops": { en: "Tops", ar: "بلوزات وتوب" },
  "cat.Skirts": { en: "Skirts", ar: "تنانير" },
  "cat.Pants": { en: "Pants", ar: "بنطلونات" },
  "cat.Footwear": { en: "Footwear", ar: "أحذية" },
  "cat.Accessories": { en: "Accessories", ar: "إكسسوارات" },

  // Collections
  "col.Atelier Noir": { en: "Atelier Noir", ar: "أتيليه نوار" },
  "col.Core Essentials": { en: "Core Essentials", ar: "الأساسيات" },
  "col.Premium Brands": { en: "Premium Brands", ar: "الماركات الفاخرة" },

  // Product Card & Detail
  "product.add_to_cart": { en: "Add to cart", ar: "أضف للسلة" },
  "product.quick_add": { en: "Quick add", ar: "إضافة سريعة" },
  "product.add_to_wishlist": { en: "Add to wishlist", ar: "أضف للمفضلة" },
  "product.new": { en: "NEW", ar: "جديد" },
  "product.limited": { en: "LIMITED", ar: "محدود" },
  "product.best_seller": { en: "Best Seller", ar: "الأكثر مبيعاً" },
  "product.save": { en: "Save", ar: "وفّر" },
  "product.in_stock": { en: "In Stock", ar: "متوفر بالمخزون" },
  "product.out_of_stock": { en: "Out of Stock", ar: "غير متوفر" },
  "product.select_size": { en: "Select Size", ar: "اختر المقاس" },
  "product.select_color": { en: "Color", ar: "اللون" },

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

  // Admin Panel General & Sections
  "admin.dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "admin.analytics": { en: "Analytics", ar: "التحليلات" },
  "admin.products": { en: "Products", ar: "المنتجات" },
  "admin.inventory": { en: "Inventory", ar: "المخزون" },
  "admin.categories": { en: "Categories", ar: "الفئات" },
  "admin.collections": { en: "Collections", ar: "المجموعات" },
  "admin.orders": { en: "Orders", ar: "الطلبات" },
  "admin.customers": { en: "Customers", ar: "العملاء" },
  "admin.reviews": { en: "Reviews", ar: "التقييمات" },
  "admin.marketing": { en: "Marketing", ar: "التسويق" },
  "admin.guide": { en: "Admin Guide", ar: "دليل المشرف" },
  "admin.settings": { en: "Settings", ar: "الإعدادات" },
  "admin.homepage": { en: "Homepage Editor", ar: "الصفحة الرئيسية" },

  "admin.new_product": { en: "New product", ar: "منتج جديد" },
  "admin.new_category": { en: "New category", ar: "فئة جديدة" },
  "admin.new_collection": { en: "New collection", ar: "مجموعة جديدة" },
  "admin.new_coupon": { en: "New coupon", ar: "كوبون جديد" },

  "admin.search_categories": { en: "Search categories…", ar: "البحث عن الفئات..." },
  "admin.search_products": { en: "Search products…", ar: "البحث عن المنتجات..." },
  "admin.search_orders": { en: "Search orders…", ar: "البحث عن الطلبات..." },
  "admin.search_customers": { en: "Search customers…", ar: "البحث عن العملاء..." },

  "admin.active": { en: "Active", ar: "نشط" },
  "admin.hidden": { en: "Hidden", ar: "مخفي" },
  "admin.featured": { en: "Featured", ar: "مميزة" },
  "admin.collections_count": { en: "collections", ar: "مجموعة" },
  "admin.products_count": { en: "products", ar: "منتج" },
  "admin.loading": { en: "Loading…", ar: "جاري التحميل..." },
  "admin.save_changes": { en: "Save changes", ar: "حفظ التغييرات" },
  "admin.create_category": { en: "Create category", ar: "إنشاء الفئة" },
  "admin.edit_category": { en: "Edit category", ar: "تعديل الفئة" },
  "admin.create_collection": { en: "Create collection", ar: "إنشاء المجموعة" },
  "admin.cancel": { en: "Cancel", ar: "إلغاء" },

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
