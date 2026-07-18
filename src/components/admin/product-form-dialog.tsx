"use client";

import * as React from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { Plus, Trash2, X, GripVertical } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Product, ProductColor, ProductSize } from "@/components/providers/ui-provider";
import { useProductStore, type ProductInput } from "@/components/providers/product-store";

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

const COLLECTION_OPTIONS = ["Atelier Noir", "Core Essentials"];

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
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=85&auto=format&fit=crop",
  ],
  badges: [],
  rating: 5,
  reviewCount: 0,
  inventory: 0,
  material: "",
  care: "",
  isNew: true,
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

  const isEdit = !!product;
  const [form, setForm] = React.useState<ProductInput>(DEFAULT_NEW_PRODUCT);
  const [newBadge, setNewBadge] = React.useState("");
  const [newTag, setNewTag] = React.useState("");
  const [newImage, setNewImage] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

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
  }, [open, product]);

  const update = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.subtitle.trim()) e.subtitle = "Subtitle is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.price || form.price <= 0) e.price = "Price must be greater than 0";
    if (!form.category) e.category = "Category is required";
    if (!form.collection) e.collection = "Collection is required";
    if (!form.material.trim()) e.material = "Material is required";
    if (!form.care.trim()) e.care = "Care instructions are required";
    if (form.inventory < 0) e.inventory = "Inventory cannot be negative";
    if (!form.colors.length) e.colors = "Add at least one color";
    if (!form.sizes.length) e.sizes = "Select at least one size";
    if (!form.images.length) e.images = "Add at least one image URL";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      toast.error("Please fix the errors before saving");
      return;
    }
    if (isEdit && product) {
      updateProduct(product.id, form);
      toast.success(`Updated "${form.name}"`);
    } else {
      addProduct(form);
      toast.success(`Added new product "${form.name}"`);
    }
    onOpenChange(false);
  };

  // Colors
  const addColor = () => {
    update("colors", [...form.colors, { name: "New Color", hex: "#888888" }]);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60">
          <DialogTitle className="font-display text-2xl tracking-tight">
            {isEdit ? `Edit product` : "Add new product"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEdit
              ? `Editing "${product?.name}" — changes are saved to the live storefront instantly.`
              : "Fill in the details below. Required fields are marked with *."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(92vh-180px)]">
          <div className="px-6 py-6 space-y-8">
            {/* ============ Basic info ============ */}
            <section className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">
                Basic information
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Product name *" error={errors.name}>
                  <Input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="e.g. Noir Tailored Blazer Dress"
                  />
                </Field>
                <Field label="Subtitle *" error={errors.subtitle}>
                  <Input
                    value={form.subtitle}
                    onChange={(e) => update("subtitle", e.target.value)}
                    placeholder="e.g. Single-button blazer dress in Italian wool"
                  />
                </Field>
              </div>
              <Field label="Description *" error={errors.description}>
                <Textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={4}
                  placeholder="A sharply tailored blazer dress cut from…"
                />
              </Field>
              <Field label="URL slug (optional)" hint="Auto-generated from name if left blank">
                <Input
                  value={form.slug}
                  onChange={(e) => update("slug", e.target.value)}
                  placeholder="auto-generated from name"
                />
              </Field>
            </section>

            <Separator />

            {/* ============ Pricing & inventory ============ */}
            <section className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">
                Pricing & inventory
              </h3>
              <div className="grid sm:grid-cols-4 gap-4">
                <Field label="Price ($) *" error={errors.price}>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={form.price}
                    onChange={(e) => update("price", Number(e.target.value))}
                  />
                </Field>
                <Field label="Compare-at ($)" hint="Original price for sale items">
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
                  />
                </Field>
                <Field label="Inventory *" error={errors.inventory}>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={form.inventory}
                    onChange={(e) => update("inventory", Number(e.target.value))}
                  />
                </Field>
                <Field label="Currency">
                  <Input
                    value={form.currency}
                    onChange={(e) => update("currency", e.target.value)}
                    placeholder="EGP"
                  />
                </Field>
              </div>
            </section>

            <Separator />

            {/* ============ Organization ============ */}
            <section className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">
                Organization
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Category *" error={errors.category}>
                  <select
                    value={form.category}
                    onChange={(e) => update("category", e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Collection *" error={errors.collection}>
                  <select
                    value={form.collection}
                    onChange={(e) => update("collection", e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {COLLECTION_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Tags */}
              <Field label="Tags" hint="Used for search & filtering (lowercase, hyphenated)">
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
                    placeholder="e.g. evening, silk, tailored"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        {t}
                        <button
                          onClick={() => removeTag(t)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </Field>

              {/* Badges */}
              <Field label="Badges" hint="Display labels like 'New', 'Best Seller', 'Premium'">
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
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {form.badges && form.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.badges.map((b) => (
                      <Badge key={b} variant="outline" className="text-xs">
                        {b}
                        <button
                          onClick={() => removeBadge(b)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </Field>
            </section>

            <Separator />

            {/* ============ Variants ============ */}
            <section className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">
                Variants
              </h3>

              {/* Colors */}
              <Field label="Colors *" error={errors.colors}>
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addColor}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add color
                  </Button>
                </div>
              </Field>

              {/* Sizes */}
              <Field label="Sizes *" error={errors.sizes} hint="Click to toggle availability">
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((size) => {
                    const selected = form.sizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={cn(
                          "h-10 min-w-10 px-3 rounded-sm border text-xs font-medium transition-all",
                          selected
                            ? "border-foreground bg-foreground text-background"
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

            {/* ============ Media ============ */}
            <section className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">
                Media
              </h3>
              <Field
                label="Image URLs *"
                error={errors.images}
                hint="Paste full image URLs. First image is used as the thumbnail."
              >
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
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addImage}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {form.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                    {form.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group aspect-[3/4] rounded-sm overflow-hidden border border-border"
                      >
                        <Image
                          src={img}
                          alt={`Image ${idx + 1}`}
                          fill
                          sizes="120px"
                          className="object-cover"
                          unoptimized
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-foreground text-background text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                            Cover
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

            {/* ============ Material & care ============ */}
            <section className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">
                Material & care
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Material *" error={errors.material}>
                  <Input
                    value={form.material}
                    onChange={(e) => update("material", e.target.value)}
                    placeholder="e.g. 100% Italian Virgin Wool"
                  />
                </Field>
                <Field label="Care instructions *" error={errors.care}>
                  <Input
                    value={form.care}
                    onChange={(e) => update("care", e.target.value)}
                    placeholder="e.g. Dry clean only"
                  />
                </Field>
              </div>
            </section>

            <Separator />

            {/* ============ Status flags ============ */}
            <section className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">
                Visibility & merchandising
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <FlagRow
                  label="New arrival"
                  hint="Shows in 'New Arrivals' on homepage"
                  checked={!!form.isNew}
                  onChange={(v) => update("isNew", v)}
                />
                <FlagRow
                  label="Best seller"
                  hint="Shows in 'Best Sellers' on homepage"
                  checked={!!form.isBestSeller}
                  onChange={(v) => update("isBestSeller", v)}
                />
                <FlagRow
                  label="Trending"
                  hint="Shows in 'Trending Now' on homepage"
                  checked={!!form.isTrending}
                  onChange={(v) => update("isTrending", v)}
                />
                <FlagRow
                  label="Limited drop"
                  hint="Shows in 'Limited Drop' feature on homepage"
                  checked={!!form.isLimited}
                  onChange={(v) => update("isLimited", v)}
                />
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border/60 bg-accent/20">
          <div className="flex items-center justify-between w-full gap-2">
            <p className="text-xs text-muted-foreground hidden sm:block">
              {isEdit
                ? "Changes are saved to the live storefront instantly."
                : "New product will appear on the storefront immediately."}
            </p>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {isEdit ? "Save changes" : "Create product"}
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
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
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
    <label className="flex items-start gap-3 p-3 border border-border/60 rounded-sm cursor-pointer hover:bg-accent/40 transition-colors">
      <Switch checked={checked} onCheckedChange={onChange} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </label>
  );
}
