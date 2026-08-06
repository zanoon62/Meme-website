"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { allSizes } from "@/data/products";
import { useLiveProducts } from "@/components/providers/product-store";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductSize } from "@/components/providers/ui-provider";
import { useT, useLangDir } from "@/lib/i18n";

export default function ShopPage() {
  return (
    <React.Suspense fallback={<ShopFallback />}>
      <ShopContent />
    </React.Suspense>
  );
}

function ShopFallback() {
  return (
    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-12 max-w-[1600px] mx-auto">
      <div className="h-10 w-48 bg-muted animate-pulse rounded mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded" />
        ))}
      </div>
    </main>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const query = searchParams.get("q") || "";
  const filter = searchParams.get("filter") || "";

  const products = useLiveProducts();
  const t = useT();
  const dir = useLangDir();

  const [category, setCategory] = React.useState(initialCategory);
  const [selectedColors, setSelectedColors] = React.useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = React.useState<ProductSize[]>([]);
  const [priceMax, setPriceMax] = React.useState<number | null>(null);
  const [sort, setSort] = React.useState("featured");
  const [visible, setVisible] = React.useState(12);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // ─── Derive categories, colors, and price range from live products ────────
  const liveCategories = React.useMemo(() => {
    const slugSet = new Set<string>();
    const cats: { slug: string; name: string }[] = [{ slug: "all", name: "All" }];
    for (const p of products) {
      if (p.category && !slugSet.has(p.category)) {
        slugSet.add(p.category);
        cats.push({ slug: p.category, name: p.category });
      }
    }
    return cats;
  }, [products]);

  const liveColors = React.useMemo(
    () =>
      Array.from(
        new Set(products.flatMap((p) => p.colors?.map((c) => c.name) ?? []))
      ).sort(),
    [products]
  );

  const livePriceRange = React.useMemo(() => {
    if (products.length === 0) return { min: 0, max: 100_000 };
    const prices = products.map((p) => p.price).filter(Boolean);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [products]);

  // Set priceMax once products load for the first time
  React.useEffect(() => {
    setPriceMax((prev) => (prev === null ? livePriceRange.max : prev));
  }, [livePriceRange.max]);

  const effectivePriceMax = priceMax ?? livePriceRange.max;

  const sortOptions = [
    { value: "featured", label: t("shop.featured") },
    { value: "newest", label: t("shop.newest") },
    { value: "price-asc", label: t("shop.price_low_high") },
    { value: "price-desc", label: t("shop.price_high_low") },
    { value: "rating", label: t("product.best_seller") },
  ];

  // Sync category with URL search params
  React.useEffect(() => {
    setCategory(searchParams.get("category") || "all");
  }, [searchParams]);

  const filtered = React.useMemo(() => {
    let result = [...products];

    if (category !== "all") {
      result = result.filter((p) => p.category === category);
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle?.toLowerCase().includes(q) ||
          p.tags?.some((tag) => tag.includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }
    if (filter === "new") result = result.filter((p) => p.isNew);
    if (filter === "best") result = result.filter((p) => p.isBestSeller);
    if (filter === "sale") result = result.filter((p) => p.compareAtPrice);

    if (selectedColors.length) {
      result = result.filter((p) =>
        p.colors?.some((c) => selectedColors.includes(c.name))
      );
    }
    if (selectedSizes.length) {
      result = result.filter((p) =>
        p.sizes?.some((s) => selectedSizes.includes(s))
      );
    }
    result = result.filter((p) => p.price <= effectivePriceMax);

    switch (sort) {
      case "newest":
        result = result.sort(
          (a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)
        );
        break;
      case "price-asc":
        result = result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result = result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result = result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [
    products,
    category,
    query,
    filter,
    selectedColors,
    selectedSizes,
    effectivePriceMax,
    sort,
  ]);

  const visibleProducts = filtered.slice(0, visible);
  const activeFilterCount =
    selectedColors.length +
    selectedSizes.length +
    (effectivePriceMax < livePriceRange.max ? 1 : 0);

  const clearAll = () => {
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceMax(livePriceRange.max);
    setCategory("all");
  };

  const getCategoryLabel = (name: string) => {
    const key = `cat.${name}`;
    const translated = t(key);
    return translated !== key ? translated : name;
  };

  const FiltersContent = (
    <div className="space-y-8">
      {/* Category */}
      <div>
        <h3 className="text-xs uppercase tracking-[0.2em] font-medium mb-4">
          {t("shop.category")}
        </h3>
        <div className="space-y-2.5">
          {liveCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              className={cn(
                "block text-sm py-1 transition-colors text-start w-full",
                category === cat.slug
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {getCategoryLabel(cat.name)}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-xs uppercase tracking-[0.2em] font-medium mb-4">
          {t("shop.price")}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatPrice(livePriceRange.min)}</span>
            <span>{formatPrice(effectivePriceMax)}</span>
          </div>
          {livePriceRange.max > livePriceRange.min ? (
            <Slider
              value={[effectivePriceMax]}
              min={livePriceRange.min}
              max={livePriceRange.max}
              step={50}
              onValueChange={(v) => setPriceMax(v[0])}
            />
          ) : (
            <div className="h-1.5 bg-muted rounded-full" />
          )}
        </div>
      </div>

      {/* Colors — only shown if any product has colors */}
      {liveColors.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] font-medium mb-4">
            {t("product.select_color")}
          </h3>
          <div className="space-y-2.5">
            {liveColors.map((color) => (
              <label
                key={color}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <Checkbox
                  checked={selectedColors.includes(color)}
                  onCheckedChange={(checked) => {
                    setSelectedColors((prev) =>
                      checked
                        ? [...prev, color]
                        : prev.filter((c) => c !== color)
                    );
                  }}
                />
                <span className="text-sm group-hover:text-foreground transition-colors">
                  {color}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      <div>
        <h3 className="text-xs uppercase tracking-[0.2em] font-medium mb-4">
          {t("product.select_size")}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {allSizes.map((size) => (
            <button
              key={size}
              onClick={() =>
                setSelectedSizes((prev) =>
                  prev.includes(size)
                    ? prev.filter((s) => s !== size)
                    : [...prev, size]
                )
              }
              className={cn(
                "h-10 rounded-sm border text-xs font-medium transition-all",
                selectedSizes.includes(size)
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearAll}>
          {t("shop.clear_filters")} ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <main
      dir={dir}
      className="flex-1 mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 py-10 lg:py-16"
    >
      {/* Header */}
      <div className="mb-8 lg:mb-12">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
          {query ? `${t("nav.search")}: "${query}"` : t("shop.tagline")}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <h1 className="font-display text-4xl lg:text-6xl tracking-tight">
            {category === "all"
              ? t("shop.all_products")
              : getCategoryLabel(category)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} {t("shop.pieces")}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-10">
        {/* Desktop sidebar filters */}
        <aside className="hidden lg:block sticky top-28 self-start">
          {FiltersContent}
        </aside>

        <div>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/60">
            {/* Mobile filter trigger */}
            <Sheet
              open={mobileFiltersOpen}
              onOpenChange={setMobileFiltersOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden rounded-full"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  {t("shop.category")}
                  {activeFilterCount > 0 && (
                    <span className="ml-2 bg-foreground text-background rounded-full text-[10px] px-1.5 py-0.5">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[85vw] sm:w-[380px] overflow-y-auto"
              >
                <SheetHeader className="mb-4">
                  <SheetTitle>{t("shop.category")}</SheetTitle>
                </SheetHeader>
                {FiltersContent}
              </SheetContent>
            </Sheet>

            {/* Active filter chips */}
            <div className="hidden lg:flex items-center gap-2 flex-wrap">
              {selectedColors.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-border rounded-full"
                >
                  {c}
                  <button
                    onClick={() =>
                      setSelectedColors((p) => p.filter((x) => x !== c))
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {selectedSizes.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-border rounded-full"
                >
                  {s}
                  <button
                    onClick={() =>
                      setSelectedSizes((p) => p.filter((x) => x !== s))
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {t("shop.sort_by")}
              </span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none bg-transparent border border-border rounded-full pl-4 pr-9 py-2 text-xs font-medium cursor-pointer hover:border-foreground transition-colors"
                >
                  {sortOptions.map((o) => (
                    <option
                      key={o.value}
                      value={o.value}
                      className="bg-background text-foreground"
                    >
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Product grid */}
          {products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                {t("shop.no_products")}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Add products from the admin panel to see them here.
              </p>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg font-medium">{t("shop.no_products")}</p>
              <Button
                variant="outline"
                className="mt-4 rounded-full"
                onClick={clearAll}
              >
                {t("shop.clear_filters")}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 lg:gap-x-6">
                {visibleProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>

              {visible < filtered.length && (
                <div className="mt-16 text-center">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full h-12 px-8"
                    onClick={() => setVisible((v) => v + 8)}
                  >
                    {t("section.view_all")} ({filtered.length - visible})
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
