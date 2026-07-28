"use client";

import * as React from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { img } from "@/lib/img";
import {
  Plus,
  Trash2,
  X,
  Eye,
  Edit3,
  HelpCircle,
  Sparkles,
  Folder,
  Layers,
  Link2,
  Info,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Product, ProductColor, ProductSize } from "@/components/providers/ui-provider";
import { useProductStore, type ProductInput } from "@/components/providers/product-store";
import { useAdminT } from "@/components/admin/admin-i18n";

const ALL_SIZES: ProductSize[] = ["XS", "S", "M", "L", "XL", "XXL", "ONE SIZE"];

const CATEGORY_OPTIONS = [
  "Dresses",
  "Tailoring",
  "Outerwear",
  "Knitwear",
  "Hoodies & Sweatshirts",
  "Tops",
  "Skirts",
  "Pants",
  "Footwear",
  "Accessories",
];

const COLLECTION_OPTIONS = ["Atelier Noir", "Core Essentials", "Premium Brands"];

const DEFAULT_NEW_PRODUCT: ProductInput = {
  slug: "",
  name: "",
  subtitle: "",
  description: "",
  price: 0,
  compareAtPrice: undefined,
  currency: "EGP",
  category: "Dresses",
  collection: "Atelier Noir",
  colors: [{ name: "Noir", hex: "#0d0d0d" }],
  sizes: ["XS", "S", "M", "L"],
  images: [
    img("New Atelier Piece", "Dresses", "noir", 0),
    img("New Atelier Piece", "Dresses", "noir", 1),
  ],
  badges: [],
  rating: 5,
  reviewCount: 0,
  inventory: 10,
  material: "100% Premium Cotton / Wool",
  care: "Dry clean only. Steam to refresh.",
  isNew: true,
  isBestSeller: false,
  isTrending: false,
  isLimited: false,
  tags: [],
};

type Props = {
  product?: Product | null;
  onBack: () => void;
};

export function ProductFormView({ product, onBack }: Props) {
  const addProduct = useProductStore((s) => s.addProduct);
  const updateProduct = useProductStore((s) => s.updateProduct);
  const { t, isAr, dir } = useAdminT();

  const isEdit = !!product;
  const [form, setForm] = React.useState<ProductInput>(DEFAULT_NEW_PRODUCT);
  const [newBadge, setNewBadge] = React.useState("");
  const [newTag, setNewTag] = React.useState("");
  const [newImage, setNewImage] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [activeMobileTab, setActiveMobileTab] = React.useState<"form" | "preview" | "guide">("form");
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  // Hydrate form when product changes
  React.useEffect(() => {
    if (product) {
      setForm({ ...product });
    } else {
      setForm({ ...DEFAULT_NEW_PRODUCT });
    }
    setErrors({});
    setNewBadge("");
    setNewTag("");
    setNewImage("");
    setActiveMobileTab("form");
    setFocusedField(null);
  }, [product]);

  const update = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && (!f.slug || f.slug === f.name.toLowerCase().replace(/\s+/g, "-"))) {
        next.slug = String(value).toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      }
      return next;
    });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = isAr ? "اسم المنتج مطلوب" : "Name is required";
    if (!form.subtitle.trim()) e.subtitle = isAr ? "العنوان الفرعي مطلوب" : "Subtitle is required";
    if (!form.description.trim()) e.description = isAr ? "الوصف مطلوب" : "Description is required";
    if (!form.price || form.price <= 0) e.price = isAr ? "يجب أن يكون السعر أكبر من صفر" : "Price must be greater than 0";
    if (!form.category) e.category = isAr ? "الفئة مطلوبة" : "Category is required";
    if (!form.collection) e.collection = isAr ? "المجموعة مطلوبة" : "Collection is required";
    if (!form.colors.length) e.colors = isAr ? "أضف لوناً واحداً على الأقل" : "Add at least one color";
    if (!form.sizes.length) e.sizes = isAr ? "اختر مقاساً واحداً على الأقل" : "Select at least one size";
    if (!form.images.length) e.images = isAr ? "أضف رابط صورة واحد على الأقل" : "Add at least one image URL";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      toast.error(isAr ? "يرجى تصحيح الأخطاء قبل الحفظ" : "Please fix the errors before saving");
      return;
    }
    const finalSlug = form.slug || form.name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    const payload = { ...form, slug: finalSlug };

    if (isEdit && product) {
      updateProduct(product.id, payload);
      toast.success(isAr ? `تم تحديث "${form.name}" بنجاح!` : `Updated "${form.name}" successfully!`);
    } else {
      const isDefaultImg =
        form.images.length === 2 &&
        form.images[0].includes("New%20Atelier%20Piece");
      const finalForm = isDefaultImg
        ? {
            ...payload,
            images: [
              img(form.name || "Atelier Piece", form.category, form.colors[0]?.name || "noir", 0),
              img(form.name || "Atelier Piece", form.category, form.colors[0]?.name || "noir", 1),
            ],
          }
        : payload;
      addProduct(finalForm);
      toast.success(isAr ? `تمت إضافة المنتج الجديد "${form.name}" بنجاح!` : `Added new product "${form.name}" successfully!`);
    }
    onBack();
  };

  // Colors
  const addColor = () => {
    update("colors", [...form.colors, { name: isAr ? "لون جديد" : "New Color", hex: "#888888" }]);
  };
  const updateColor = (idx: number, patch: Partial<ProductColor>) => {
    update(
      "colors",
      form.colors.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    );
  };
  const removeColor = (idx: number) => {
    update("colors", form.colors.filter((_, i) => i !== idx));
  };

  // Sizes
  const toggleSize = (size: ProductSize) => {
    update(
      "sizes",
      form.sizes.includes(size)
        ? form.sizes.filter((s) => s !== size)
        : [...form.sizes, size]
    );
  };

  // Images
  const addImage = () => {
    if (!newImage.trim()) return;
    update("images", [...form.images, newImage.trim()]);
    setNewImage("");
  };
  const removeImage = (idx: number) => {
    update("images", form.images.filter((_, i) => i !== idx));
  };

  // Badges
  const addBadge = () => {
    const v = newBadge.trim();
    if (!v) return;
    if (form.badges?.includes(v)) return;
    update("badges", [...(form.badges ?? []), v]);
    setNewBadge("");
  };
  const removeBadge = (b: string) => {
    update("badges", (form.badges ?? []).filter((x) => x !== b));
  };

  // Tags
  const addTag = () => {
    const v = newTag.trim().toLowerCase().replace(/\s+/g, "-");
    if (!v) return;
    if (form.tags.includes(v)) return;
    update("tags", [...form.tags, v]);
    setNewTag("");
  };
  const removeTag = (t: string) => {
    update("tags", form.tags.filter((x) => x !== t));
  };

  // Discount percentage calculation
  const discountPercent =
    form.compareAtPrice && form.compareAtPrice > form.price
      ? Math.round(((form.compareAtPrice - form.price) / form.compareAtPrice) * 100)
      : null;

  return (
    <div dir={dir} className="w-full min-h-screen pb-20 space-y-6">
      
      {/* Top Navigation Bar with Back Button & Actions */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/60 py-4 px-4 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="h-9 px-3 rounded-lg border-border hover:bg-accent"
          >
            {isAr ? <ArrowRight className="h-4 w-4 ml-1" /> : <ArrowLeft className="h-4 w-4 mr-1" />}
            {isAr ? "العودة لقائمة المنتجات" : "Back to Products"}
          </Button>
          <div className="h-4 w-[1px] bg-border hidden sm:block" />
          <div>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-foreground tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
              {isEdit ? (isAr ? `تعديل المنتج: ${product?.name}` : `Edit Product: ${product?.name}`) : (isAr ? "صفحة إضافة منتج جديد مع المعاينة الحية" : "Add New Product Page with Live Preview")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isAr ? "مساحة عمل كاملة مع التمرير الحر والمعاينة التفاعلية المباشرة للمتجر." : "Full-screen workspace with unconstrained scrolling & real-time storefront preview."}
            </p>
          </div>
        </div>

        {/* Action Buttons & Mobile Tabs */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {/* Mobile view switcher */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border lg:hidden">
            <Button
              type="button"
              variant={activeMobileTab === "form" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setActiveMobileTab("form")}
            >
              <Edit3 className="h-3.5 w-3.5 mr-1" />
              {isAr ? "النموذج" : "Form"}
            </Button>
            <Button
              type="button"
              variant={activeMobileTab === "preview" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setActiveMobileTab("preview")}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              {isAr ? "المعاينة" : "Preview"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onBack} className="h-9">
              {t("cancelBtn")}
            </Button>
            <Button type="button" size="sm" onClick={handleSubmit} className="h-9 bg-amber-500 hover:bg-amber-600 text-black font-semibold px-5">
              <Save className="h-4 w-4 mr-1.5" />
              {isEdit ? t("saveProductBtn") : t("createProductBtn")}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Full-Page Content: 2 Columns Side-By-Side on Desktop */}
      <div className="px-4 sm:px-8 max-w-[1700px] mx-auto">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Input Form (Spacious, Free Scrolling) */}
          <div className={cn(
            "lg:col-span-7 space-y-8 bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xl",
            activeMobileTab === "preview" ? "hidden lg:block" : "block"
          )}>
            
            {/* Visual Guide Header Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 font-bold">
                <Info className="h-5 w-5" />
              </div>
              <div className="space-y-1 text-xs text-muted-foreground leading-relaxed">
                <h3 className="font-bold text-sm text-foreground">
                  {isAr ? "💡 كيف تم تنظيم شاشة إضافة المنتجات لك ولإداري المتجر؟" : "💡 How store categories and collections work"}
                </h3>
                <p>
                  {isAr
                    ? "• **الفئة (Category)**: تظهر في صفحة المتجر (/shop) لفلترة وتصنيف المنتجات حسب نوعها (فساتين، بدل، ملابس خارجية).\n• **المجموعة (Collection)**: المعرض الترويجي المميز المعروض مباشرة على الصفحة الرئيسية للمتجر."
                    : "• Category filters items on /shop page.\n• Collection places items into homepage featured showcases."}
                </p>
              </div>
            </div>

            {/* ============ Section 1: Basic Information ============ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <div className="h-6 w-1 rounded bg-amber-500" />
                <h2 className="text-sm uppercase tracking-[0.2em] font-bold text-foreground">
                  {isAr ? "1. المعلومات الأساسية للمنتج" : "1. Basic product information"}
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <Field
                  label={`${t("productName")} *`}
                  error={errors.name}
                  hint={isAr ? "اسم المنتج الرئيسي الظاهر في الكارت وفي الصفحة" : "Main product title"}
                >
                  <Input
                    value={form.name}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder={t("productNamePlaceholder")}
                    className={cn("h-10 text-sm", focusedField === "name" && "border-amber-500 ring-1 ring-amber-500")}
                  />
                </Field>

                <Field
                  label={`${t("productSubtitleLabel")} *`}
                  error={errors.subtitle}
                  hint={isAr ? "سطر تعريفي موجز أسفل اسم المنتج" : "Short subtext line"}
                >
                  <Input
                    value={form.subtitle}
                    onFocus={() => setFocusedField("subtitle")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => update("subtitle", e.target.value)}
                    placeholder="e.g. Single-button blazer dress in Italian wool"
                    className={cn("h-10 text-sm", focusedField === "subtitle" && "border-amber-500 ring-1 ring-amber-500")}
                  />
                </Field>
              </div>

              <Field label={`${t("descriptionLabel")} *`} error={errors.description}>
                <Textarea
                  value={form.description}
                  onFocus={() => setFocusedField("description")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => update("description", e.target.value)}
                  rows={4}
                  placeholder="A sharply tailored blazer dress cut from…"
                  className="text-sm leading-relaxed"
                />
              </Field>

              {/* Slug with visual link explanation */}
              <Field
                label={t("slugLabel")}
                hint={
                  isAr
                    ? `🔗 رابط الإنترنت المستهدف: https://meme-eg.store/product/${form.slug || "auto-generated-slug"}`
                    : `🔗 Target URL: https://meme-eg.store/product/${form.slug || "auto-generated-slug"}`
                }
              >
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={form.slug}
                    onFocus={() => setFocusedField("slug")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => update("slug", e.target.value)}
                    placeholder="auto-generated-slug"
                    className="pl-9 h-10 font-mono text-xs"
                  />
                </div>
              </Field>
            </section>

            <Separator />

            {/* ============ Section 2: Pricing & Inventory ============ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <div className="h-6 w-1 rounded bg-amber-500" />
                <h2 className="text-sm uppercase tracking-[0.2em] font-bold text-foreground">
                  {isAr ? "2. الأسعار والمخزون والتخفيضات" : "2. Pricing & inventory"}
                </h2>
              </div>

              <div className="grid sm:grid-cols-4 gap-4">
                <Field label={`${t("priceLabel")} (ج.م) *`} error={errors.price}>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={form.price || ""}
                    onFocus={() => setFocusedField("price")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => update("price", Number(e.target.value))}
                    placeholder="14500"
                    className="h-10 text-sm font-semibold"
                  />
                </Field>

                <Field
                  label={t("compareAtPriceLabel")}
                  hint={discountPercent ? (isAr ? `تخفيض -${discountPercent}%` : `Save -${discountPercent}%`) : (isAr ? "السعر قبل الخصم" : "Original price")}
                >
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={form.compareAtPrice ?? ""}
                    onFocus={() => setFocusedField("compareAtPrice")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) =>
                      update(
                        "compareAtPrice",
                        e.target.value === "" ? undefined : Number(e.target.value)
                      )
                    }
                    placeholder="18500"
                    className="h-10 text-sm"
                  />
                </Field>

                <Field label={`${t("inventoryCol")} *`} error={errors.inventory}>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={form.inventory}
                    onChange={(e) => update("inventory", Number(e.target.value))}
                    className="h-10 text-sm"
                  />
                </Field>

                <Field label={t("currencyLabel")}>
                  <Input
                    value={form.currency}
                    onChange={(e) => update("currency", e.target.value)}
                    placeholder="EGP"
                    className="h-10 text-sm"
                  />
                </Field>
              </div>
            </section>

            <Separator />

            {/* ============ Section 3: Organization (Category & Collection EXPLAINED) ============ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <div className="h-6 w-1 rounded bg-amber-500" />
                <h2 className="text-sm uppercase tracking-[0.2em] font-bold text-foreground">
                  {isAr ? "3. الفئة والمجموعة (موضحة بالكامل)" : "3. Category & Collection Organization"}
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                {/* Category Field Box */}
                <div className="space-y-2.5 p-4 rounded-xl border border-border/80 bg-accent/10">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Folder className="h-4 w-4 text-amber-500" />
                    <span>{t("categoryLabel")} *</span>
                  </div>
                  <select
                    value={form.category}
                    onFocus={() => setFocusedField("category")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => update("category", e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-medium"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isAr
                      ? "📌 **الفئة (Category)**: تظهر في القائمة الجانبية لصفحة المتجر (`/shop`). تمكن العميل من تصفية المنتجات حسب النوع (مثل: فساتين، بدل، ملابس خارجية)."
                      : "📌 **Category**: Filters products on the `/shop` grid by product type."}
                  </p>
                </div>

                {/* Collection Field Box */}
                <div className="space-y-2.5 p-4 rounded-xl border border-border/80 bg-accent/10">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Layers className="h-4 w-4 text-amber-500" />
                    <span>{t("collectionLabel")} *</span>
                  </div>
                  <select
                    value={form.collection}
                    onFocus={() => setFocusedField("collection")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => update("collection", e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-medium"
                  >
                    {COLLECTION_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isAr
                      ? "🌟 **المجموعة (Collection)**: المعرض الترويجي المميز المعروض مباشرة على الصفحة الرئيسية للمتجر (مثل: Atelier Noir أو Core Essentials)."
                      : "🌟 **Collection**: Featured promotional showcase sections displayed directly on the homepage."}
                  </p>
                </div>
              </div>

              {/* Tags & Badges */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <Field label={t("tagsLabel")} hint={isAr ? "وسوم للبحث والتصفية (أحرف صغيرة)" : "Search tags"}>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="e.g. evening, silk"
                      className="h-9 text-sm"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag} className="h-9">
                      <Plus className="h-3.5 w-3.5 mr-1" /> {t("addNew")}
                    </Button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                          <button onClick={() => removeTag(t)} className="ml-1 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </Field>

                <Field label={t("badgesLabel")} hint={isAr ? "شارات ترويجية مثل 'Best Seller'" : "Promotional badges"}>
                  <div className="flex gap-2">
                    <Input
                      value={newBadge}
                      onChange={(e) => setNewBadge(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addBadge();
                        }
                      }}
                      placeholder="e.g. Best Seller"
                      className="h-9 text-sm"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addBadge} className="h-9">
                      <Plus className="h-3.5 w-3.5 mr-1" /> {t("addNew")}
                    </Button>
                  </div>
                  {form.badges && form.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.badges.map((b) => (
                        <Badge key={b} variant="outline" className="text-xs">
                          {b}
                          <button onClick={() => removeBadge(b)} className="ml-1 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </Field>
              </div>
            </section>

            <Separator />

            {/* ============ Section 4: Colors & Sizes ============ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <div className="h-6 w-1 rounded bg-amber-500" />
                <h2 className="text-sm uppercase tracking-[0.2em] font-bold text-foreground">
                  {isAr ? "4. خيارات الألوان والمقاسات" : "4. Colors & Sizes"}
                </h2>
              </div>

              <Field label={`${t("colorsLabel")} *`} error={errors.colors}>
                <div className="space-y-2.5">
                  {form.colors.map((color, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color.hex}
                        onChange={(e) => updateColor(idx, { hex: e.target.value })}
                        className="w-10 h-10 rounded border border-input cursor-pointer bg-background p-0.5"
                      />
                      <Input
                        value={color.name}
                        onChange={(e) => updateColor(idx, { name: e.target.value })}
                        placeholder="Color name"
                        className="flex-1 h-10 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-destructive"
                        onClick={() => removeColor(idx)}
                        disabled={form.colors.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addColor} className="h-9">
                    <Plus className="h-3.5 w-3.5 mr-1" /> {isAr ? "إضافة لون" : "Add color"}
                  </Button>
                </div>
              </Field>

              <Field label={`${t("sizesLabel")} *`} error={errors.sizes}>
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((size) => {
                    const selected = form.sizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={cn(
                          "h-10 min-w-10 px-3.5 rounded border text-xs font-semibold transition-all",
                          selected
                            ? "border-amber-500 bg-amber-500/10 text-amber-500"
                            : "border-border hover:border-foreground"
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </section>

            <Separator />

            {/* ============ Section 5: Media & Images ============ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <div className="h-6 w-1 rounded bg-amber-500" />
                <h2 className="text-sm uppercase tracking-[0.2em] font-bold text-foreground">
                  {isAr ? "5. صور وتصاميم المنتج" : "5. Product Images"}
                </h2>
              </div>

              <Field label={`${t("imagesLabel")} *`} error={errors.images}>
                <div className="flex gap-2">
                  <Input
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addImage();
                      }
                    }}
                    placeholder="https://images.unsplash.com/…"
                    className="h-10 text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addImage} className="h-10">
                    <Plus className="h-3.5 w-3.5 mr-1" /> {t("addNew")}
                  </Button>
                </div>
                {form.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                    {form.images.map((imgUrl, idx) => (
                      <div key={idx} className="relative group aspect-[3/4] rounded-lg border border-border overflow-hidden">
                        <Image src={imgUrl} alt={`Img ${idx + 1}`} fill sizes="160px" className="object-cover" unoptimized />
                        {idx === 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-amber-500 text-black font-bold text-[9px] uppercase px-2 py-0.5 rounded shadow">
                            {isAr ? "الغلاف" : "Cover"}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-background/90 text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
            </section>

            <Separator />

            {/* ============ Section 6: Homepage Merchandising Flags ============ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <div className="h-6 w-1 rounded bg-amber-500" />
                <h2 className="text-sm uppercase tracking-[0.2em] font-bold text-foreground">
                  {isAr ? "6. أماكن العرض الترويجي بالصفحة الرئيسية" : "6. Homepage merchandising"}
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <FlagRow
                  label={t("isNewFlag")}
                  hint={isAr ? "يظهر في قسم 'المنتجات الجديدة' بالصفحة الرئيسية" : "Shows in 'New Arrivals' on homepage"}
                  checked={!!form.isNew}
                  onChange={(v) => update("isNew", v)}
                />
                <FlagRow
                  label={t("isBestSellerFlag")}
                  hint={isAr ? "يظهر في قسم 'الأكثر مبيعاً' بالصفحة الرئيسية" : "Shows in 'Best Sellers' on homepage"}
                  checked={!!form.isBestSeller}
                  onChange={(v) => update("isBestSeller", v)}
                />
                <FlagRow
                  label={t("isTrendingFlag")}
                  hint={isAr ? "يظهر في قسم 'الرائج الآن' بالصفحة الرئيسية" : "Shows in 'Trending Now' on homepage"}
                  checked={!!form.isTrending}
                  onChange={(v) => update("isTrending", v)}
                />
                <FlagRow
                  label={t("isLimitedFlag")}
                  hint={isAr ? "يظهر في قسم 'التشكيلة المحدودة' بالصفحة الرئيسية" : "Shows in 'Limited Drop' on homepage"}
                  checked={!!form.isLimited}
                  onChange={(v) => update("isLimited", v)}
                />
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: Real-Time Live Visual Storefront Preview (Sticky & Full Scrollable) */}
          <div className={cn(
            "lg:col-span-5 space-y-6 sticky top-24 self-start bg-card border border-border/80 rounded-2xl p-6 shadow-xl",
            activeMobileTab === "form" ? "hidden lg:block" : "block"
          )}>
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-amber-500 animate-pulse" />
                <span className="font-display font-bold text-base tracking-tight text-foreground">
                  {isAr ? "المعاينة الحية التفاعلية للمتجر" : "Interactive Storefront Preview"}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold border-amber-500/40 text-amber-500 bg-amber-500/10">
                {isAr ? "تحديث مباشر Live" : "Real-time Live"}
              </Badge>
            </div>

            {/* Visual Card Preview 1: Shop Grid Product Card */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {isAr ? "1. كارت المنتج كما يظهر للعميل في المتجر:" : "1. Product Card in Shop Grid:"}
              </p>
              
              <div className="bg-background border border-border/80 rounded-xl overflow-hidden shadow-2xl p-4 max-w-[340px] mx-auto transition-all duration-300 hover:border-amber-500/50">
                {/* Image & Badges */}
                <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-muted mb-3 group">
                  <Image
                    src={form.images[0] || img("Preview", form.category, "noir", 0)}
                    alt={form.name || "Preview"}
                    fill
                    sizes="340px"
                    className="object-cover"
                    unoptimized
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                    {discountPercent && (
                      <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow">
                        -{discountPercent}%
                      </span>
                    )}
                    {form.isNew && (
                      <span className="bg-foreground text-background font-bold text-[10px] px-2 py-0.5 rounded shadow">
                        NEW
                      </span>
                    )}
                  </div>

                  {/* Collection Label Tag */}
                  <div className="absolute bottom-2.5 left-2.5 bg-background/90 backdrop-blur-md text-foreground font-mono text-[9px] px-2.5 py-0.5 rounded border border-white/10">
                    {form.collection}
                  </div>
                </div>

                {/* Info Text */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    <span>{form.category}</span>
                    <span>{form.inventory > 0 ? (isAr ? "متوفر" : "In Stock") : (isAr ? "نفد" : "Sold out")}</span>
                  </div>

                  <h4 className={cn(
                    "font-display font-bold text-base line-clamp-1 text-foreground transition-colors",
                    focusedField === "name" && "text-amber-500"
                  )}>
                    {form.name || (isAr ? "اسم المنتج سيظهر هنا" : "Product Title Here")}
                  </h4>

                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {form.subtitle || (isAr ? "العنوان الفرعي سيظهر هنا" : "Subtitle text here")}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-base text-foreground">
                        {formatPrice(form.price || 0)}
                      </span>
                      {form.compareAtPrice && form.compareAtPrice > form.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(form.compareAtPrice)}
                        </span>
                      )}
                    </div>

                    {/* Colors preview */}
                    <div className="flex items-center -space-x-1">
                      {form.colors.map((c, i) => (
                        <span
                          key={i}
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Preview 2: Live URL & Store Metadata */}
            <div className="p-4 rounded-xl bg-background border border-border/80 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {isAr ? "2. مظهر رابط وتصنيفات المنتج:" : "2. Live Product Link & Metadata:"}
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded bg-card border border-border/50">
                  <span className="text-muted-foreground">{isAr ? "رابط الصفحات:" : "Store URL:"}</span>
                  <span className="font-mono text-amber-500 font-bold truncate max-w-[200px]">
                    /product/{form.slug || "slug"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-card border border-border/50">
                  <span className="text-muted-foreground">{isAr ? "فئة التصفية (/shop):" : "Category Filter:"}</span>
                  <Badge variant="secondary" className="font-bold text-[11px]">
                    {form.category}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-card border border-border/50">
                  <span className="text-muted-foreground">{isAr ? "المجموعة الرئيسية:" : "Featured Collection:"}</span>
                  <Badge variant="outline" className="font-bold text-[11px] border-amber-500/40 text-amber-500">
                    {form.collection}
                  </Badge>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold">{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
      {error && <p className="text-xs text-destructive font-semibold">{error}</p>}
    </div>
  );
}

function FlagRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 p-3.5 border border-border/80 rounded-xl cursor-pointer hover:bg-accent/40 transition-colors">
      <Switch checked={checked} onCheckedChange={onChange} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold">{label}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </label>
  );
}
