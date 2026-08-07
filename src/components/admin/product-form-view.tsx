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
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Save,
  Upload,
  Ruler,
  Grid,
  FileText,
  ShoppingBag,
  RotateCcw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Product, ProductColor, ProductSize, SizeChartData } from "@/components/providers/ui-provider";
import { useProductStore, useLiveCategories, type ProductInput } from "@/components/providers/product-store";
import { useAdminT } from "@/components/admin/admin-i18n";
import { getDefaultSizeChart } from "@/lib/size-charts";

const ALL_SIZES: ProductSize[] = ["XS", "S", "M", "L", "XL", "XXL", "ONE SIZE"];



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
  images: [],
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
  sizeChart: getDefaultSizeChart("Dresses"),
};

type Props = {
  product?: Product | null;
  onBack: () => void;
};

export function ProductFormView({ product, onBack }: Props) {
  const addProduct = useProductStore((s) => s.addProduct);
  const updateProduct = useProductStore((s) => s.updateProduct);
  const { t, isAr, dir } = useAdminT();
  // Live categories from the product store — always reflects real state
  const liveCategories = useLiveCategories();

  const isEdit = !!product;
  const [form, setForm] = React.useState<ProductInput>(DEFAULT_NEW_PRODUCT);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = React.useState<"outer" | "inner">("inner");
  const [selectedPreviewImage, setSelectedPreviewImage] = React.useState(0);
  const [selectedPreviewColor, setSelectedPreviewColor] = React.useState(0);
  const [selectedPreviewSize, setSelectedPreviewSize] = React.useState<ProductSize>("M");
  const [sizeGuideModalOpen, setSizeGuideModalOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Hydrate form when product changes
  React.useEffect(() => {
    if (product) {
      setForm({
        ...product,
        sizeChart: product.sizeChart || getDefaultSizeChart(product.category),
      });
    } else {
      setForm({ ...DEFAULT_NEW_PRODUCT });
    }
    setErrors({});
  }, [product]);

  const update = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name") {
        next.slug = String(value).toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      }
      return next;
    });
  };

  // Handle Category Change -> Auto-load default category size chart if not customized
  const handleCategoryChange = (newCat: string) => {
    setForm((f) => ({
      ...f,
      category: newCat,
      sizeChart: getDefaultSizeChart(newCat),
    }));
  };

  // Image Upload File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setForm((f) => ({
            ...f,
            images: [...f.images, result],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    update("images", form.images.filter((_, i) => i !== idx));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = isAr ? "اسم المنتج مطلوب" : "Name is required";
    if (!form.subtitle.trim()) e.subtitle = isAr ? "العنوان الفرعي مطلوب" : "Subtitle is required";
    if (!form.description.trim()) e.description = isAr ? "الوصف مطلوب" : "Description is required";
    if (!form.price || form.price <= 0) e.price = isAr ? "يجب أن يكون السعر أكبر من صفر" : "Price must be greater than 0";
    if (!form.category) e.category = isAr ? "الفئة مطلوبة" : "Category is required";
    if (!form.colors.length) e.colors = isAr ? "أضف لوناً واحداً على الأقل" : "Add at least one color";
    if (!form.sizes.length) e.sizes = isAr ? "اختر مقاساً واحداً على الأقل" : "Select at least one size";
    if (!form.images.length) e.images = isAr ? "قم برفع صورة واحدة على الأقل" : "Upload at least one image";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      toast.error(isAr ? "يرجى تصحيح الأخطاء قبل الحفظ" : "Please fix errors before saving");
      return;
    }
    const finalSlug = form.slug || form.name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    const payload = { ...form, slug: finalSlug };

    if (isEdit && product) {
      updateProduct(product.id, payload);
      toast.success(isAr ? `تم تحديث "${form.name}" بنجاح!` : `Updated "${form.name}" successfully!`);
    } else {
      addProduct(payload);
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

  // Size Chart Cell Editor
  const updateSizeChartCell = (rowIndex: number, headerKey: string, val: string) => {
    if (!form.sizeChart) return;
    const newRows = [...form.sizeChart.rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [headerKey]: val };
    update("sizeChart", { ...form.sizeChart, rows: newRows });
  };

  const resetSizeChart = () => {
    update("sizeChart", getDefaultSizeChart(form.category));
    toast.success(isAr ? "تم إعادة ضبط جدول المقاسات حسب الفئة" : "Reset size chart to category defaults");
  };

  const discountPercent =
    form.compareAtPrice && form.compareAtPrice > form.price
      ? Math.round(((form.compareAtPrice - form.price) / form.compareAtPrice) * 100)
      : null;

  const currentCategoryLabel = liveCategories.find((c) => c.name === form.category)?.name ?? form.category;

  return (
    <div dir={dir} className="w-full min-h-screen pb-20 space-y-6 bg-background">
      
      {/* Top Bar with Back Button & Actions */}
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
              <Sparkles className="h-5 w-5 text-amber-500" />
              {isEdit ? (isAr ? `تعديل المنتج: ${product?.name}` : `Edit Product: ${product?.name}`) : (isAr ? "إضافة منتج جديد" : "Add New Product")}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onBack} className="h-9">
            {t("cancelBtn")}
          </Button>
          <Button type="button" size="sm" onClick={handleSubmit} className="h-9 bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 shadow">
            <Save className="h-4 w-4 mr-1.5" />
            {isEdit ? t("saveProductBtn") : t("createProductBtn")}
          </Button>
        </div>
      </div>

      {/* Main Full-Page Content: 2 Columns Side-By-Side on Desktop */}
      <div className="px-4 sm:px-8 max-w-[1700px] mx-auto">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Clean Input Form */}
          <div className="lg:col-span-7 space-y-8 bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xl">
            
            {/* ============ Section 1: Basic Information ============ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <div className="h-6 w-1 rounded bg-amber-500" />
                <h2 className="text-sm uppercase tracking-[0.2em] font-bold text-foreground">
                  {isAr ? "1. البيانات الأساسية" : "1. Basic information"}
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <Field label={`${t("productName")} *`} error={errors.name}>
                  <Input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder={isAr ? "مثال: فستان بليزر أسود فاخر" : "e.g. Noir Tailored Blazer Dress"}
                    className="h-10 text-sm font-medium"
                  />
                </Field>

                <Field label={`${t("productSubtitleLabel")} *`} error={errors.subtitle}>
                  <Input
                    value={form.subtitle}
                    onChange={(e) => update("subtitle", e.target.value)}
                    placeholder={isAr ? "سطر تعريفي موجز للمنتج" : "e.g. Single-button blazer dress in Italian wool"}
                    className="h-10 text-sm"
                  />
                </Field>
              </div>

              <Field label={`${t("descriptionLabel")} *`} error={errors.description}>
                <Textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={4}
                  placeholder={isAr ? "الوصف التفصيلي الكامل للمنتج والخامات والقَصّة..." : "Full detailed description..."}
                  className="text-sm leading-relaxed"
                />
              </Field>
            </section>

            <Separator />

            {/* ============ Section 2: Category Selection (Translated) ============ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <div className="h-6 w-1 rounded bg-amber-500" />
                <h2 className="text-sm uppercase tracking-[0.2em] font-bold text-foreground">
                  {isAr ? "2. فئة المنتج (الفئات مترجمة)" : "2. Product Category"}
                </h2>
              </div>

              <Field label={isAr ? "اختر الفئة الرئيسية للمنتج *" : "Select Category *"} error={errors.category}>
                {liveCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    {isAr
                      ? "لا توجد فئات حتى الآن — أضف منتجًا لإنشاء فئة جديدة"
                      : "No categories yet — add products to create categories"}
                  </p>
                ) : (
                  <select
                    value={form.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full h-11 rounded-lg border border-input bg-background px-4 text-base font-semibold text-foreground cursor-pointer shadow-sm hover:border-amber-500 transition-colors"
                  >
                    {!form.category && (
                      <option value="" disabled>
                        {isAr ? "— اختر الفئة —" : "— Select a category —"}
                      </option>
                    )}
                    {liveCategories.map((cat) => (
                      <option key={cat.slug} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </section>

            <Separator />

            {/* ============ Section 3: Pricing & Inventory ============ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <div className="h-6 w-1 rounded bg-amber-500" />
                <h2 className="text-sm uppercase tracking-[0.2em] font-bold text-foreground">
                  {isAr ? "3. الأسعار والمخزون والتخفيضات" : "3. Pricing & Inventory"}
                </h2>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <Field label={`${t("priceLabel")} (ج.م) *`} error={errors.price}>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={form.price || ""}
                    onChange={(e) => update("price", Number(e.target.value))}
                    placeholder="14500"
                    className="h-10 text-sm font-bold"
                  />
                </Field>

                <Field
                  label={t("compareAtPriceLabel")}
                  hint={discountPercent ? (isAr ? `خصم -${discountPercent}%` : `Save -${discountPercent}%`) : (isAr ? "السعر قبل الخصم" : "Original price")}
                >
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={form.compareAtPrice ?? ""}
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
              </div>
            </section>

            <Separator />

            {/* ============ Section 4: Colors & Sizes ============ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <div className="h-6 w-1 rounded bg-amber-500" />
                <h2 className="text-sm uppercase tracking-[0.2em] font-bold text-foreground">
                  {isAr ? "4. الألوان والمقاسات" : "4. Colors & Sizes"}
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
                        placeholder={isAr ? "اسم اللون" : "Color name"}
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
                    <Plus className="h-3.5 w-3.5 mr-1" /> {isAr ? "إضافة لون جديد" : "Add color"}
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
                          "h-10 min-w-10 px-4 rounded-lg border text-xs font-bold transition-all",
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

            {/* ============ Section 5: Smart Category-Based Size Chart Editor ============ */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-1 rounded bg-amber-500" />
                  <h2 className="text-sm uppercase tracking-[0.2em] font-bold text-foreground flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-amber-500" />
                    {isAr ? "5. جدول المقاسات الذكي (Size Chart)" : "5. Smart Category Size Chart"}
                  </h2>
                </div>

                <Button type="button" variant="ghost" size="sm" onClick={resetSizeChart} className="h-7 text-xs text-muted-foreground">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  {isAr ? "إعادة الضبط للفئة" : "Reset for category"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                {isAr
                  ? `جدول القياسات مخصص تلقائياً لفئة (${currentCategoryLabel}). يمكن التعديل المباشر على قيم المقاسات.`
                  : `Size measurements customized for ${currentCategoryLabel}. Edit cell values directly.`}
              </p>

              {form.sizeChart && (
                <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-background">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-accent/50 border-b border-border">
                          {form.sizeChart.headers.map((h, i) => (
                            <th key={i} className="p-3 text-start font-bold text-foreground">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {form.sizeChart.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-accent/20 transition-colors">
                            {form.sizeChart!.headers.map((h, cIdx) => (
                              <td key={cIdx} className="p-2">
                                <Input
                                  value={row[h] || ""}
                                  onChange={(e) => updateSizeChartCell(rIdx, h, e.target.value)}
                                  className="h-8 text-xs font-medium bg-transparent border-border/60 focus:border-amber-500"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            <Separator />

            {/* ============ Section 6: Image Upload (File Uploader) ============ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <div className="h-6 w-1 rounded bg-amber-500" />
                <h2 className="text-sm uppercase tracking-[0.2em] font-bold text-foreground">
                  {isAr ? "6. رفع صور المنتج من الجهاز" : "6. Product Image File Uploader"}
                </h2>
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

                {/* Drag and drop upload zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-amber-500/80 rounded-xl p-8 text-center cursor-pointer bg-accent/20 hover:bg-accent/40 transition-all space-y-2 group"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="font-bold text-sm text-foreground">
                    {isAr ? "انقر لرفع صور المنتج من جهازك" : "Click or drop product image files here"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? "يدعم صور (PNG, JPG, WEBP). يمكنك تحديد صور متعددة." : "Supports PNG, JPG, WEBP."}
                  </p>
                </div>

                {/* Image Gallery Cards */}
                {form.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                    {form.images.map((imgUrl, idx) => (
                      <div key={idx} className="relative group aspect-[3/4] rounded-xl border border-border/80 overflow-hidden shadow-sm">
                        <Image src={imgUrl} alt={`Img ${idx + 1}`} fill sizes="160px" className="object-cover" unoptimized />
                        {idx === 0 && (
                          <span className="absolute top-2 left-2 bg-amber-500 text-black font-bold text-[9px] uppercase px-2 py-0.5 rounded shadow">
                            {isAr ? "الغلاف الرئيسي" : "Main Cover"}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/90 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
            </section>

            <Separator />

            {/* ============ Section 7: Material & Care ============ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <div className="h-6 w-1 rounded bg-amber-500" />
                <h2 className="text-sm uppercase tracking-[0.2em] font-bold text-foreground">
                  {isAr ? "7. الخامات وتعليمات العناية" : "7. Material & Care"}
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={isAr ? "المادة والخامة" : "Material"}>
                  <Input
                    value={form.material}
                    onChange={(e) => update("material", e.target.value)}
                    placeholder="e.g. 100% Italian Virgin Wool"
                    className="h-10 text-sm"
                  />
                </Field>
                <Field label={isAr ? "تعليمات الغسيل والعناية" : "Care Instructions"}>
                  <Input
                    value={form.care}
                    onChange={(e) => update("care", e.target.value)}
                    placeholder="e.g. Dry clean only"
                    className="h-10 text-sm"
                  />
                </Field>
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: Interactive Real-Time Storefront Preview (Outer Card & Inner Product Page) */}
          <div className="lg:col-span-5 space-y-6 sticky top-24 self-start bg-card border border-border/80 rounded-2xl p-6 shadow-xl">
            
            {/* Preview Mode Switcher Bar */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-amber-500" />
                <span className="font-display font-bold text-sm text-foreground">
                  {isAr ? "المعاينة الحية للمتجر" : "Live Store Preview"}
                </span>
              </div>

              <div className="flex items-center bg-accent/60 p-1 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setPreviewMode("inner")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1",
                    previewMode === "inner" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                  )}
                >
                  <FileText className="h-3.5 w-3.5" />
                  {isAr ? "صفحة المنتج" : "Inner Page"}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("outer")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1",
                    previewMode === "outer" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                  )}
                >
                  <Grid className="h-3.5 w-3.5" />
                  {isAr ? "كارت المتجر" : "Grid Card"}
                </button>
              </div>
            </div>

            {/* PREVIEW OPTION 1: Inner Product Page Layout Preview */}
            {previewMode === "inner" ? (
              <div className="space-y-5 bg-background border border-border/80 rounded-xl p-5 shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <span>meme-eg.store/product/{form.slug || "slug"}</span>
                  <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-500">
                    {currentCategoryLabel}
                  </Badge>
                </div>

                {/* Main Product Image Display & Thumbnails */}
                <div className="space-y-2">
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-muted border border-border">
                    <Image
                      src={form.images[selectedPreviewImage] || form.images[0] || img("Preview", form.category, "noir", 0)}
                      alt={form.name || "Preview"}
                      fill
                      sizes="400px"
                      className="object-cover"
                      unoptimized
                    />
                    {discountPercent && (
                      <span className="absolute top-3 left-3 bg-red-600 text-white font-bold text-xs px-2.5 py-1 rounded shadow">
                        -{discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {form.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {form.images.map((imgUrl, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedPreviewImage(i)}
                          className={cn(
                            "relative aspect-[3/4] w-12 rounded border overflow-hidden shrink-0 transition-all",
                            selectedPreviewImage === i ? "border-amber-500 ring-1 ring-amber-500" : "border-border opacity-70"
                          )}
                        >
                          <Image src={imgUrl} alt="Thumb" fill sizes="48px" className="object-cover" unoptimized />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Title, Subtitle, Price */}
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-xl text-foreground">
                    {form.name || (isAr ? "اسم المنتج الفاخر" : "Product Title Here")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {form.subtitle || (isAr ? "سطر تعريفي موجز" : "Subtitle text here")}
                  </p>

                  <div className="flex items-baseline gap-3 pt-2">
                    <span className="font-bold text-lg text-foreground">
                      {formatPrice(form.price || 0)}
                    </span>
                    {form.compareAtPrice && form.compareAtPrice > form.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(form.compareAtPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Color Selector */}
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {isAr ? "اللون:" : "Color:"} <span className="text-foreground">{form.colors[selectedPreviewColor]?.name}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    {form.colors.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedPreviewColor(i)}
                        className={cn(
                          "w-6 h-6 rounded-full border border-white/20 shadow-sm transition-transform",
                          selectedPreviewColor === i && "ring-2 ring-amber-500 scale-110"
                        )}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Size Selector with Size Chart Modal Trigger */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">{isAr ? "المقاس:" : "Size:"}</p>
                    <button
                      type="button"
                      onClick={() => setSizeGuideModalOpen(true)}
                      className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"
                    >
                      <Ruler className="h-3.5 w-3.5" />
                      {isAr ? "جدول المقاسات 📏" : "Size Guide 📏"}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {form.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedPreviewSize(s)}
                        className={cn(
                          "h-8 px-3 rounded text-xs font-bold border transition-all",
                          selectedPreviewSize === s
                            ? "border-amber-500 bg-amber-500 text-black"
                            : "border-border text-foreground hover:border-foreground"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <Button className="w-full h-11 bg-foreground text-background font-bold text-sm rounded-lg shadow mt-3">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  {isAr ? "أضف للسلة" : "Add to Cart"}
                </Button>
              </div>
            ) : (
              /* PREVIEW OPTION 2: Outer Shop Grid Card */
              <div className="space-y-3">
                <div className="bg-background border border-border/80 rounded-xl overflow-hidden shadow-2xl p-4 max-w-[340px] mx-auto">
                  <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-muted mb-3">
                    <Image
                      src={form.images[0] || img("Preview", form.category, "noir", 0)}
                      alt={form.name || "Preview"}
                      fill
                      sizes="340px"
                      className="object-cover"
                      unoptimized
                    />

                    {discountPercent && (
                      <span className="absolute top-2.5 left-2.5 bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow">
                        -{discountPercent}%
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      {currentCategoryLabel}
                    </p>
                    <h4 className="font-display font-bold text-base line-clamp-1 text-foreground">
                      {form.name || (isAr ? "اسم المنتج سيظهر هنا" : "Product Title")}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {form.subtitle || (isAr ? "العنوان الفرعي" : "Subtitle")}
                    </p>

                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold text-base text-foreground">
                        {formatPrice(form.price || 0)}
                      </span>
                      <div className="flex items-center -space-x-1">
                        {form.colors.map((c, i) => (
                          <span
                            key={i}
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Pop-up Size Guide Preview Modal for Storefront */}
      <Dialog open={sizeGuideModalOpen} onOpenChange={setSizeGuideModalOpen}>
        <DialogContent dir={dir} className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              <Ruler className="h-5 w-5 text-amber-500" />
              {isAr ? `جدول المقاسات: ${currentCategoryLabel}` : `Size Guide: ${currentCategoryLabel}`}
            </DialogTitle>
          </DialogHeader>

          {form.sizeChart && (() => {
            const sizeHeader = form.sizeChart.headers.find((h) => h.toLowerCase().includes("size")) || form.sizeChart.headers[0];
            const filteredRows = (form.sizes && form.sizes.length > 0)
              ? form.sizeChart.rows.filter((row) => {
                  const rowSize = String(row[sizeHeader] || "").toUpperCase().trim();
                  return form.sizes.some((s) => String(s).toUpperCase().trim() === rowSize);
                })
              : form.sizeChart.rows;
            const finalRows = filteredRows.length > 0 ? filteredRows : form.sizeChart.rows;

            return (
              <div className="border border-border rounded-xl overflow-hidden shadow-sm my-2">
                <table className="w-full text-xs border-collapse text-center">
                  <thead>
                    <tr className="bg-accent/60 border-b border-border">
                      {form.sizeChart.headers.map((h, i) => (
                        <th key={i} className="p-3 font-bold text-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {finalRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-accent/20">
                        {form.sizeChart!.headers.map((h, cIdx) => (
                          <td key={cIdx} className="p-3 font-medium text-foreground">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
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
