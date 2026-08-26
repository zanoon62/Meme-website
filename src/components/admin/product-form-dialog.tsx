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
  ExternalLink,
  Tag,
  Folder,
  Layers,
  Link2,
  DollarSign,
  PackageCheck,
  Palette,
  Ruler,
  Info,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Product, ProductColor, ProductSize } from "@/components/providers/ui-provider";
import { useProductStore, useLiveProducts, type ProductInput } from "@/components/providers/product-store";
import { useAdminT } from "@/components/admin/admin-i18n";

const ALL_SIZES: ProductSize[] = ["XS", "S", "M", "L", "XL", "XXL", "ONE SIZE"];

const COLLECTION_OPTIONS = ["Atelier Noir", "Core Essentials", "Premium Brands"];

const DEFAULT_NEW_PRODUCT: ProductInput = {
  slug: "",
  name: "",
  subtitle: "",
  description: "",
  price: 0,
  compareAtPrice: undefined,
  currency: "EGP",
  category: "",
  collection: "",
  colors: [],
  sizes: [],
  images: [],
  badges: [],
  rating: 5,
  reviewCount: 0,
  inventory: 10,
  material: "",
  care: "",
  isNew: false,
  isBestSeller: false,
  isTrending: false,
  isLimited: false,
  tags: [],
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** when set, edit this product; otherwise add a new one */
  product?: Product | null;
};

export function ProductFormDialog({ open, onOpenChange, product }: Props) {
  const addProduct = useProductStore((s) => s.addProduct);
  const updateProduct = useProductStore((s) => s.updateProduct);
  const { t, isAr, dir } = useAdminT();
  const allProducts = useLiveProducts();

  // Derive unique categories from live products so the dropdown stays in sync
  const liveCategories = React.useMemo(() => {
    const seen = new Set<string>();
    const cats: string[] = [];
    for (const p of allProducts) {
      if (p.category && !seen.has(p.category)) {
        seen.add(p.category);
        cats.push(p.category);
      }
    }
    return cats;
  }, [allProducts]);

  const isEdit = !!product;
  const [form, setForm] = React.useState<ProductInput>(DEFAULT_NEW_PRODUCT);
  const [newBadge, setNewBadge] = React.useState("");
  const [newTag, setNewTag] = React.useState("");
  const [newImage, setNewImage] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = React.useState<"form" | "preview" | "guide">("form");
  const [focusedField, setFocusedField] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [uploadingImages, setUploadingImages] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Hydrate form when dialog opens or product changes
  React.useEffect(() => {
    if (!open) return;
    if (product) {
      setForm({ ...product });
    } else {
      setForm({ ...DEFAULT_NEW_PRODUCT });
    }
    setErrors({});
    setNewBadge("");
    setNewTag("");
    setNewImage("");
    setActiveTab("form");
    setFocusedField(null);
  }, [open, product]);

  const update = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && (!f.slug || f.slug === f.name.toLowerCase().replace(/\s+/g, "-"))) {
        next.slug = String(value).toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      }
      return next;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/product-image", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) uploadedUrls.push(data.url);
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    if (uploadedUrls.length > 0) {
      setForm((f) => ({
        ...f,
        images: [...f.images, ...uploadedUrls],
      }));
      toast.success(isAr ? `تم رفع ${uploadedUrls.length} صورة بنجاح ✓` : `Uploaded ${uploadedUrls.length} image(s) ✓`);
    }
    setUploadingImages(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error(isAr ? "يرجى تصحيح الأخطاء قبل الحفظ" : "Please fix the errors before saving");
      return;
    }
    setIsSaving(true);
    try {
      const finalSlug = form.slug || form.name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      const payload = { ...form, slug: finalSlug };

      if (isEdit && product) {
        await updateProduct(product.id, payload);
        toast.success(isAr ? `تم تحديث "${form.name}"` : `Updated "${form.name}"`);
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
        await addProduct(finalForm);
        toast.success(isAr ? `تمت إضافة المنتج الجديد "${form.name}" بنجاح!` : `Added new product "${form.name}" successfully!`);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Save product dialog error:", err);
      toast.error(isAr ? "فشل حفظ المنتج" : "Failed to save product");
    } finally {
      setIsSaving(false);
    }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="max-w-6xl w-[96vw] max-h-[94vh] p-0 gap-0 overflow-hidden bg-background border-white/10">
        {/* Header with Live Mode Switcher */}
        <DialogHeader className="px-6 py-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/50">
          <div>
            <DialogTitle className="font-display text-xl sm:text-2xl tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
              {isEdit ? (isAr ? `تعديل المنتج: ${product?.name}` : `Edit Product: ${product?.name}`) : (isAr ? "إضافة منتج جديد مع المعاينة الحية" : "Add New Product with Live Preview")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {isAr
                ? "أدخل بيانات المنتج وشاهد شكلاً تفاعلياً حياً لكيفية ظهوره للعملاء في المتجر مباشرة أثناء الكتابة."
                : "Fill in product fields and preview exactly how it appears to customers on the live storefront in real-time."}
            </DialogDescription>
          </div>

          {/* View mode buttons (mobile & desktop) */}
          <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border border-border/60 self-start sm:self-auto">
            <Button
              type="button"
              variant={activeTab === "form" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setActiveTab("form")}
            >
              <Edit3 className="h-3.5 w-3.5 mr-1" />
              {isAr ? "النموذج" : "Form"}
            </Button>
            <Button
              type="button"
              variant={activeTab === "preview" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-3 lg:hidden"
              onClick={() => setActiveTab("preview")}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              {isAr ? "المعاينة الحية" : "Live Preview"}
            </Button>
            <Button
              type="button"
              variant={activeTab === "guide" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setActiveTab("guide")}
            >
              <HelpCircle className="h-3.5 w-3.5 mr-1 text-amber-500" />
              {isAr ? "دليل المصطلحات" : "Field Guide"}
            </Button>
          </div>
        </DialogHeader>

        {/* Content Body: Split 2-Column on Desktop (Form Left, Live Preview Right) */}
        <div className="grid lg:grid-cols-12 h-[calc(94vh-140px)] divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-border/60">
          
          {/* LEFT COLUMN: Input Form */}
          <ScrollArea className={cn(
            "lg:col-span-7 h-full",
            activeTab === "preview" ? "hidden lg:block" : "block"
          )}>
            <div className="px-6 py-6 space-y-8">
              
              {/* Field Explanation Alert Bar */}
              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs">
                <Info className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    {isAr ? "💡 كيف تساعدك الحقول في تنظيم متجرك؟" : "💡 How fields organize your store"}
                  </p>
                  <p>
                    {isAr
                      ? "• الفئة (Category): تظهر في صفحة المتجر (/shop) لفلترة المنتجات.\n• المجموعة (Collection): تظهر كقسم مميز بالصفحة الرئيسية للمتجر."
                      : "• Category filters items in /shop.\n• Collection features items in homepage sections."}
                  </p>
                </div>
              </div>

              {/* ============ Section 1: Basic Information ============ */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-1 rounded bg-amber-500" />
                  <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                    {isAr ? "1. المعلومات الأساسية" : "1. Basic information"}
                  </h3>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    label={`${t("productName")} *`}
                    error={errors.name}
                    hint={isAr ? "اسم المنتج الرئيسي الظاهر للعملاء" : "Main product title"}
                  >
                    <Input
                      value={form.name}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder={t("productNamePlaceholder")}
                      className={cn(focusedField === "name" && "border-amber-500 ring-1 ring-amber-500")}
                    />
                  </Field>

                  <Field
                    label={`${t("productSubtitleLabel")} *`}
                    error={errors.subtitle}
                    hint={isAr ? "سطر تعريفي موجز أسفل العنوان" : "Short subtext line under title"}
                  >
                    <Input
                      value={form.subtitle}
                      onFocus={() => setFocusedField("subtitle")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => update("subtitle", e.target.value)}
                      placeholder="e.g. Single-button blazer dress in Italian wool"
                      className={cn(focusedField === "subtitle" && "border-amber-500 ring-1 ring-amber-500")}
                    />
                  </Field>
                </div>

                <Field label={`${t("descriptionLabel")} *`} error={errors.description}>
                  <Textarea
                    value={form.description}
                    onFocus={() => setFocusedField("description")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => update("description", e.target.value)}
                    rows={3}
                    placeholder="A sharply tailored blazer dress cut from…"
                  />
                </Field>

                {/* Slug with visual link explanation */}
                <Field
                  label={t("slugLabel")}
                  hint={
                    isAr
                      ? `🔗 رابط الإنترنت: meme-eg.store/product/${form.slug || "auto-generated-slug"}`
                      : `🔗 URL: meme-eg.store/product/${form.slug || "auto-generated-slug"}`
                  }
                >
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={form.slug}
                      onFocus={() => setFocusedField("slug")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => update("slug", e.target.value)}
                      placeholder="auto-generated-slug"
                      className="pl-9 font-mono text-xs"
                    />
                  </div>
                </Field>
              </section>

              <Separator />

              {/* ============ Section 2: Pricing & Inventory ============ */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-1 rounded bg-amber-500" />
                  <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                    {isAr ? "2. الأسعار والمخزون والتخفيضات" : "2. Pricing, inventory & discounts"}
                  </h3>
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
                    />
                  </Field>

                  <Field label={`${t("inventoryCol")} *`} error={errors.inventory}>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={form.inventory}
                      onChange={(e) => update("inventory", Number(e.target.value))}
                    />
                  </Field>

                  <Field label={t("currencyLabel")}>
                    <Input
                      value={form.currency}
                      onChange={(e) => update("currency", e.target.value)}
                      placeholder="EGP"
                    />
                  </Field>
                </div>
              </section>

              <Separator />

              {/* ============ Section 3: Organization (Category & Collection EXPLAINED) ============ */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-1 rounded bg-amber-500" />
                  <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                    {isAr ? "3. التصنيف والمجموعات (مُوضحة بالكامل)" : "3. Category & Collection"}
                  </h3>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Category Field with Visual Guide Box */}
                  <div className="space-y-2 p-3 rounded-lg border border-border/80 bg-accent/10">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Folder className="h-4 w-4 text-amber-500" />
                      <span>{t("categoryLabel")} *</span>
                    </div>
                    <select
                      value={form.category}
                      onFocus={() => setFocusedField("category")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => update("category", e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">— Select category —</option>
                      {liveCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      {/* Allow typing a custom category if none exist yet */}
                      {liveCategories.length === 0 && (
                        <option value={form.category || ""} disabled>
                          {form.category || "No categories yet — type below"}
                        </option>
                      )}
                    </select>
                    {/* Free-text input — lets admin create brand new categories inline */}
                    <Input
                      value={form.category}
                      onChange={(e) => update("category", e.target.value)}
                      placeholder="Or type a new category name…"
                      className="h-8 text-xs mt-1.5"
                    />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {isAr
                        ? "📌 **الفئة (Category)**: تظهر في القائمة الجانبية لصفحة المتجر (`/shop`). تمكن العميل من تصفية المنتجات حسب النوع (مثل: فساتين، بدل، ملابس خارجية)."
                        : "📌 **Category**: Used in store filter page (`/shop`) to group items by type."}
                    </p>

                  </div>

                  {/* Collection Field with Visual Guide Box */}
                  <div className="space-y-2 p-3 rounded-lg border border-border/80 bg-accent/10">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Layers className="h-4 w-4 text-amber-500" />
                      <span>{t("collectionLabel")} *</span>
                    </div>
                    <select
                      value={form.collection}
                      onFocus={() => setFocusedField("collection")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => update("collection", e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {COLLECTION_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {isAr
                        ? "🌟 **المجموعة (Collection)**: القسم الترويجي الخاص بالصفحة الرئيسية للمتجر (مثل: Atelier Noir أو Core Essentials)."
                        : "🌟 **Collection**: Promotional sections featured directly on the storefront home page."}
                    </p>
                  </div>
                </div>

                {/* Tags & Badges */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={t("tagsLabel")} hint={isAr ? "وسوم للبحث والتصفية" : "Search tags"}>
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
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addTag}>
                        <Plus className="h-3 w-3 mr-1" /> {t("addNew")}
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

                  <Field label={t("badgesLabel")} hint={isAr ? "شارات تميز كـ 'Best Seller'" : "Promotional badges"}>
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
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addBadge}>
                        <Plus className="h-3 w-3 mr-1" /> {t("addNew")}
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

              {/* ============ Section 4: Variants & Colors ============ */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-1 rounded bg-amber-500" />
                  <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                    {isAr ? "4. الألوان والمقاسات" : "4. Colors & Sizes"}
                  </h3>
                </div>

                <Field label={`${t("colorsLabel")} *`} error={errors.colors}>
                  <div className="space-y-2">
                    {form.colors.map((color, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={color.hex}
                          onChange={(e) => updateColor(idx, { hex: e.target.value })}
                          className="w-9 h-9 rounded border border-input cursor-pointer bg-background p-0.5"
                        />
                        <Input
                          value={color.name}
                          onChange={(e) => updateColor(idx, { name: e.target.value })}
                          placeholder="Color name"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          onClick={() => removeColor(idx)}
                          disabled={form.colors.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addColor}>
                      <Plus className="h-3 w-3 mr-1" /> {isAr ? "إضافة لون" : "Add color"}
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
                            "h-9 min-w-9 px-3 rounded border text-xs font-medium transition-all",
                            selected
                              ? "border-amber-500 bg-amber-500/10 text-amber-500 font-semibold"
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
                <div className="flex items-center gap-2">
                  <div className="h-6 w-1 rounded bg-amber-500" />
                  <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                    {isAr ? "5. صور المنتج" : "5. Product Images"}
                  </h3>
                </div>

                <Field label={`${t("imagesLabel")} *`} error={errors.images}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex gap-2">
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
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addImage}>
                        <Plus className="h-3 w-3 mr-1" /> {t("addNew")}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={uploadingImages}
                      onClick={() => fileInputRef.current?.click()}
                      className="shrink-0"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      {uploadingImages ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع صور من الجهاز" : "Upload Files")}
                    </Button>
                  </div>
                  {form.images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                      {form.images.map((imgUrl, idx) => (
                        <div key={idx} className="relative group aspect-[3/4] rounded border border-border overflow-hidden">
                          <Image src={imgUrl} alt={`Img ${idx + 1}`} fill sizes="120px" className="object-cover" unoptimized />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 bg-amber-500 text-black font-bold text-[9px] uppercase px-1.5 py-0.5 rounded">
                              {isAr ? "الغلاف" : "Cover"}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/90 text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
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
                <div className="flex items-center gap-2">
                  <div className="h-6 w-1 rounded bg-amber-500" />
                  <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                    {isAr ? "6. أماكن العرض على الصفحة الرئيسية للمتجر" : "6. Homepage merchandising"}
                  </h3>
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
          </ScrollArea>

          {/* RIGHT COLUMN: Real-Time Live Visual Storefront Preview */}
          <div className={cn(
            "lg:col-span-5 bg-accent/20 h-full overflow-y-auto p-6 space-y-6",
            activeTab === "form" ? "hidden lg:block" : "block"
          )}>
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-amber-500 animate-pulse" />
                <span className="font-display font-semibold text-sm tracking-tight text-foreground">
                  {isAr ? "المعاينة الحية التفاعلية للمتجر" : "Interactive Storefront Preview"}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-500 bg-amber-500/10">
                {isAr ? "تحديث مباشر Live" : "Real-time Live"}
              </Badge>
            </div>

            {/* Visual Card Preview 1: Shop Grid Product Card */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {isAr ? "1. كارت المنتج كما يظهر للعميل في المتجر:" : "1. Product Card in Shop Grid:"}
              </p>
              
              <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-2xl p-3 max-w-[320px] mx-auto transition-all duration-300 hover:border-amber-500/50">
                {/* Image & Badges */}
                <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-muted mb-3 group">
                  <Image
                    src={form.images[0] || img("Preview", form.category, "noir", 0)}
                    alt={form.name || "Preview"}
                    fill
                    sizes="320px"
                    className="object-cover"
                    unoptimized
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
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
                  <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-md text-foreground font-mono text-[9px] px-2 py-0.5 rounded border border-white/10">
                    {form.collection}
                  </div>
                </div>

                {/* Info Text */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                    <span>{form.category}</span>
                    <span>{form.inventory > 0 ? (isAr ? "متوفر" : "In Stock") : (isAr ? "نفد" : "Sold out")}</span>
                  </div>

                  <h4 className={cn(
                    "font-display font-semibold text-base line-clamp-1 text-foreground transition-colors",
                    focusedField === "name" && "text-amber-500"
                  )}>
                    {form.name || (isAr ? "اسم المنتج سيظهر هنا" : "Product Title Here")}
                  </h4>

                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {form.subtitle || (isAr ? "العنوان الفرعي سيظهر هنا" : "Subtitle text here")}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-sm text-foreground">
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
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
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
            <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {isAr ? "2. مظهر رابط وتصنيفات المنتج:" : "2. Live Product Link & Metadata:"}
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-background border border-border/50">
                  <span className="text-muted-foreground">{isAr ? "رابط الصفحات:" : "Store URL:"}</span>
                  <span className="font-mono text-amber-500 font-medium truncate max-w-[200px]">
                    /product/{form.slug || "slug"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-background border border-border/50">
                  <span className="text-muted-foreground">{isAr ? "فئة التصفية (/shop):" : "Category Filter:"}</span>
                  <Badge variant="secondary" className="font-medium text-[10px]">
                    {form.category}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-background border border-border/50">
                  <span className="text-muted-foreground">{isAr ? "المجموعة الرئيسية:" : "Featured Collection:"}</span>
                  <Badge variant="outline" className="font-medium text-[10px] border-amber-500/40 text-amber-500">
                    {form.collection}
                  </Badge>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3.5 border-t border-border/60 bg-accent/20">
          <div className="flex items-center justify-between w-full gap-2">
            <p className="text-xs text-muted-foreground hidden sm:block">
              {isEdit
                ? isAr ? "تتم المزامنة وحفظ التعديلات فوراً على المتجر المباشر." : "Changes save to storefront immediately."
                : isAr ? "سيظهر المنتج الجديد في المتجر مباشرة بعد الحفظ." : "New product appears on storefront immediately."}
            </p>
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancelBtn")}
              </Button>
              <Button
                type="button"
                disabled={isSaving || uploadingImages}
                onClick={handleSubmit}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold disabled:opacity-50"
              >
                {isSaving
                  ? (isAr ? "جاري الحفظ..." : "Saving...")
                  : uploadingImages
                  ? (isAr ? "جاري الرفع..." : "Uploading...")
                  : (isEdit ? t("saveProductBtn") : t("createProductBtn"))}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>}
      {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
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
    <label className="flex items-start gap-3 p-3 border border-border/60 rounded-lg cursor-pointer hover:bg-accent/40 transition-colors">
      <Switch checked={checked} onCheckedChange={onChange} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </label>
  );
}
