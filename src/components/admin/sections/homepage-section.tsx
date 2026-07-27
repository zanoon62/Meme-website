"use client";

import * as React from "react";
import {
  Eye,
  EyeOff,
  Pencil,
  RotateCcw,
  Save,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  X,
  Megaphone,
  Sparkles,
  Award,
  ShoppingBag,
  LayoutGrid,
  Flame,
  ShieldCheck,
  MessageSquareQuote,
  Instagram as InstagramIcon,
  HelpCircle,
  FileText,
  Monitor,
  Check,
  ArrowRight,
  Star,
  Truck,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAdminT } from "@/components/admin/admin-i18n";
import {
  useHomepageStore,
  useHomepageConfig,
  type HomepageConfig,
  type HeroSlide,
  type BiLang,
} from "@/components/providers/homepage-store";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// MAIN SECTION (VISUAL PAGE BUILDER)
// ─────────────────────────────────────────────

export function HomepageSection() {
  const { t, isAr } = useAdminT();
  const config = useHomepageConfig();
  const { toggleVisibility, resetToDefaults, saving } = useHomepageStore();
  const [expandedKey, setExpandedKey] = React.useState<keyof HomepageConfig | null>("hero");
  const [builderMode, setBuilderMode] = React.useState<"builder" | "list">("builder");

  const sections: Array<{
    key: keyof HomepageConfig;
    label: string;
    description: string;
    icon: React.ElementType;
    previewType: string;
  }> = [
    {
      key: "announcement",
      label: t("announcementBar"),
      description: isAr ? "شريط الإعلانات المتحرك في أعلى الموقع" : "The scrolling marquee bar at the top of every page",
      icon: Megaphone,
      previewType: "marquee",
    },
    {
      key: "hero",
      label: t("heroCarousel"),
      description: isAr ? "شرائح البانر الرئيسي الكبير" : "The large full-screen hero carousel slides",
      icon: Sparkles,
      previewType: "hero",
    },
    {
      key: "sponsors",
      label: t("sponsorLogos"),
      description: isAr ? "شريط الماركات المتحرك تحت البانر" : "Scrolling brand logos strip below the hero",
      icon: Award,
      previewType: "sponsors",
    },
    {
      key: "bestSellers",
      label: t("bestSellersSection"),
      description: isAr ? "قسم الأكثر مبيعاً" : "Best Sellers product showcase",
      icon: ShoppingBag,
      previewType: "grid",
    },
    {
      key: "editorialPremium",
      label: t("premiumBrandsEditorial"),
      description: isAr ? "قسم الماركات الفاخرة المقسوم (صورة + نص)" : "Premium Brands split editorial (image + text)",
      icon: LayoutGrid,
      previewType: "split",
    },
    {
      key: "newArrivals",
      label: t("newArrivalsSection"),
      description: isAr ? "قسم المنتجات الجديدة" : "New Arrivals product showcase",
      icon: ShoppingBag,
      previewType: "grid",
    },
    {
      key: "limitedDrop",
      label: t("limitedDropSpotlight"),
      description: isAr ? "قسم التشكيلة المحدودة" : "Limited drop product spotlight",
      icon: Flame,
      previewType: "spotlight",
    },
    {
      key: "trending",
      label: t("trendingSection"),
      description: isAr ? "قسم الرائج الآن" : "Trending products showcase",
      icon: Flame,
      previewType: "grid",
    },
    {
      key: "editorialStory",
      label: t("brandStoryEditorial"),
      description: isAr ? "قسم قصة الماركة (صورة + نص داكن)" : "Brand story dark editorial (image + text)",
      icon: LayoutGrid,
      previewType: "split",
    },
    {
      key: "valueProps",
      label: t("valuePropSection"),
      description: isAr ? "شريط مميزات الخدمة الأربعة" : "4-column service value propositions strip",
      icon: ShieldCheck,
      previewType: "valueProps",
    },
    {
      key: "reviews",
      label: t("reviewsSection"),
      description: isAr ? "تقييمات العملاء" : "Customer reviews showcase",
      icon: MessageSquareQuote,
      previewType: "reviews",
    },
    {
      key: "instagram",
      label: t("instagramSection"),
      description: isAr ? "شريط صور انستاغرام" : "Instagram photo grid strip",
      icon: InstagramIcon,
      previewType: "instagram",
    },
    {
      key: "faq",
      label: t("faqSection"),
      description: isAr ? "قسم الأسئلة الشائعة" : "FAQ accordion",
      icon: HelpCircle,
      previewType: "faq",
    },
    {
      key: "manifesto",
      label: t("manifestoSection"),
      description: isAr ? "البيان والنشرة البريدية في الأسفل" : "Bottom manifesto & newsletter block",
      icon: FileText,
      previewType: "manifesto",
    },
  ];

  const handleReset = () => {
    if (!window.confirm(t("resetDefaultsConfirm"))) return;
    resetToDefaults();
    toast.success(isAr ? "تم إعادة الضبط الافتراضي" : "Reset to factory defaults");
  };

  const activeSectionInfo = sections.find((s) => s.key === expandedKey);

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl tracking-tight">{t("homepageSections")}</h2>
            <Badge variant="outline" className="text-xs border-[#f6ec91]/50 text-[#f6ec91] bg-[#f6ec91]/10">
              {isAr ? "مُحرّر واجهة الأتيليه التفاعلي" : "Visual Page Builder"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t("manageHomepage")}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Builder / List View Toggle */}
          <div className="inline-flex p-1 rounded-lg bg-accent/40 border border-border/60">
            <button
              onClick={() => setBuilderMode("builder")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                builderMode === "builder"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Monitor className="h-3.5 w-3.5" />
              {isAr ? "المعاينة التفاعلية المباشرة" : "Visual Page Builder"}
            </button>
            <button
              onClick={() => setBuilderMode("list")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                builderMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {isAr ? "عرض قائمة الأقسام" : "Section List"}
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="shrink-0"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            {t("resetDefaults")}
          </Button>
        </div>
      </div>

      {/* Saving indicator */}
      {saving && (
        <p className="text-xs text-muted-foreground animate-pulse flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#f6ec91] animate-ping" />
          {isAr ? "جاري حفظ التغييرات وتحديث المتجر المباشر…" : "Saving changes and updating live storefront…"}
        </p>
      )}

      {/* Mode 1: Split-Screen Visual Builder */}
      {builderMode === "builder" ? (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Live Homepage Viewport */}
          <div className="lg:col-span-5 space-y-3 sticky top-4 max-h-[85vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between px-2 mb-1">
              <p className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">
                {isAr ? "خريطة الموقع التفاعلية (انقر للتعديل)" : "Live Page Outline (Click section to edit)"}
              </p>
              <Badge variant="secondary" className="text-[10px]">14 {isAr ? "أقسام" : "sections"}</Badge>
            </div>

            {sections.map(({ key, label, description, icon: Icon, previewType }) => {
              const sectionConfig = config[key] as { visible: boolean };
              const isSelected = expandedKey === key;

              return (
                <div
                  key={key}
                  onClick={() => setExpandedKey(key)}
                  className={cn(
                    "group relative p-3.5 rounded-xl border transition-all cursor-pointer overflow-hidden",
                    isSelected
                      ? "border-[#f6ec91] bg-card shadow-lg ring-1 ring-[#f6ec91]/50"
                      : "border-border/60 bg-card/50 hover:border-border hover:bg-card/80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "bg-[#f6ec91] text-zinc-950" : "bg-muted text-muted-foreground group-hover:text-foreground"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold truncate">{label}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={sectionConfig.visible ? "default" : "secondary"}
                            className="text-[9px] px-1.5 py-0"
                          >
                            {sectionConfig.visible ? t("sectionVisible") : t("sectionHidden")}
                          </Badge>
                          <Switch
                            id={`builder-toggle-${key}`}
                            checked={sectionConfig.visible}
                            onCheckedChange={() => toggleVisibility(key)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{description}</p>
                    </div>
                  </div>

                  {/* Visual Wireframe Graphic Preview Badge */}
                  <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between">
                    <SectionMiniWireframe type={previewType} isVisible={sectionConfig.visible} />
                    {isSelected && (
                      <span className="text-[10px] text-[#f6ec91] font-medium flex items-center gap-1">
                        <Pencil className="h-3 w-3" />
                        {isAr ? "قيد التعديل الآن" : "Editing now"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Visual Section Live Preview + Form Editor */}
          <div className="lg:col-span-7 space-y-4">
            {expandedKey ? (
              <Card className="overflow-hidden border-border/80 shadow-xl bg-card">
                {/* Editor Header Banner */}
                <div className="bg-zinc-900 text-white p-5 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activeSectionInfo && (
                      <div className="w-10 h-10 rounded-lg bg-[#f6ec91] text-zinc-950 flex items-center justify-center shrink-0">
                        <activeSectionInfo.icon className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg tracking-tight text-white">
                          {activeSectionInfo?.label}
                        </h3>
                        <Badge
                          variant={(config[expandedKey] as { visible: boolean }).visible ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {(config[expandedKey] as { visible: boolean }).visible ? t("sectionVisible") : t("sectionHidden")}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{activeSectionInfo?.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={(config[expandedKey] as { visible: boolean }).visible}
                      onCheckedChange={() => toggleVisibility(expandedKey)}
                    />
                  </div>
                </div>

                {/* Real-time Interactive Section Live Preview Card */}
                <div className="p-4 bg-black/90 border-b border-zinc-800">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#f6ec91]">
                      {isAr ? "معاينة القسم المباشرة" : "Live Section Preview"}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {isAr ? "تتغير المحتويات تلقائياً عند الكتابة" : "Updates in real-time as you edit"}
                    </span>
                  </div>

                  <div className="rounded-lg border border-zinc-800 overflow-hidden bg-background">
                    <LiveSectionPreview sectionKey={expandedKey} />
                  </div>
                </div>

                {/* Form Fields Editor */}
                <div className="p-6">
                  <SectionEditor sectionKey={expandedKey} onSaved={() => {}} />
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center text-muted-foreground border-dashed">
                <Monitor className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm font-medium">{isAr ? "اختر أي قسم من القائمة على اليسار لتعديله مباشرة" : "Select any section from the left list to edit"}</p>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Mode 2: Enhanced Section List View */
        <div className="space-y-3">
          {sections.map(({ key, label, description, icon: Icon, previewType }) => {
            const section = config[key] as { visible: boolean };
            const isExpanded = expandedKey === key;

            return (
              <Card key={key} className={cn(
                "overflow-hidden transition-all",
                isExpanded && "ring-1 ring-[#f6ec91]/60 border-[#f6ec91]/50"
              )}>
                {/* Card header row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <Switch
                    id={`list-toggle-${key}`}
                    checked={section.visible}
                    onCheckedChange={() => toggleVisibility(key)}
                  />
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{label}</p>
                      <Badge
                        variant={section.visible ? "default" : "secondary"}
                        className="text-[10px] shrink-0"
                      >
                        {section.visible ? t("sectionVisible") : t("sectionHidden")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
                  </div>
                  {/* Expand/collapse edit */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedKey(isExpanded ? null : key)}
                    className="shrink-0"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    {t("editSection")}
                    {isExpanded
                      ? <ChevronUp className="h-3.5 w-3.5 ml-1" />
                      : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
                  </Button>
                </div>

                {/* Inline editor + Live Preview */}
                {isExpanded && (
                  <div className="border-t border-border/60 px-5 pb-6 pt-4 bg-accent/15 space-y-5">
                    {/* Live preview header */}
                    <div className="rounded-lg border border-border/80 overflow-hidden bg-black/90 p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#f6ec91] mb-2">
                        {isAr ? "معاينة القسم المباشرة" : "Live Section Preview"}
                      </p>
                      <div className="rounded border border-zinc-800 bg-background overflow-hidden">
                        <LiveSectionPreview sectionKey={key} />
                      </div>
                    </div>

                    <SectionEditor sectionKey={key} onSaved={() => setExpandedKey(null)} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MINI SECTION WIREFRAME GRAPHIC BADGES
// ─────────────────────────────────────────────

function SectionMiniWireframe({ type, isVisible }: { type: string; isVisible: boolean }) {
  if (!isVisible) {
    return <span className="text-[10px] text-muted-foreground italic">مخفي من الصفحة الرئيسية</span>;
  }

  switch (type) {
    case "hero":
      return (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-12 h-3 rounded bg-amber-400/30 border border-amber-400/50 block" />
          <span>بانر رئيسي ملء الشاشة</span>
        </div>
      );
    case "marquee":
      return (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-16 h-2 rounded bg-[#f6ec91]/40 block" />
          <span>شريط متحرك</span>
        </div>
      );
    case "grid":
      return (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <div className="grid grid-cols-4 gap-0.5 w-12">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className="h-2 bg-muted rounded-xs block" />
            ))}
          </div>
          <span>عرض منتجات</span>
        </div>
      );
    case "split":
      return (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-5 h-3 bg-muted rounded-xs block" />
          <span className="w-6 h-2 bg-muted-foreground/30 rounded-xs block" />
          <span>مقسوم (صورة + نص)</span>
        </div>
      );
    case "valueProps":
      return (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-3 h-3 rounded-full bg-emerald-400/30 block" />
          <span className="w-3 h-3 rounded-full bg-emerald-400/30 block" />
          <span className="w-3 h-3 rounded-full bg-emerald-400/30 block" />
          <span>المميزات</span>
        </div>
      );
    default:
      return <span className="text-[10px] text-muted-foreground">قسم تفاعلي</span>;
  }
}

// ─────────────────────────────────────────────
// REAL-TIME INTERACTIVE LIVE SECTION PREVIEW
// ─────────────────────────────────────────────

function LiveSectionPreview({ sectionKey }: { sectionKey: keyof HomepageConfig }) {
  const config = useHomepageConfig();
  const { isAr } = useAdminT();

  switch (sectionKey) {
    case "announcement": {
      const items = config.announcement.items.filter((i) => i.visible);
      return (
        <div className="bg-black text-[#f6ec91] text-xs py-2.5 px-4 font-mono truncate text-center">
          {items.map((it) => (isAr ? it.ar : it.en)).join("  •  ") || "—"}
        </div>
      );
    }
    case "hero": {
      const slide = config.hero.slides[0];
      if (!slide) return null;
      return (
        <div className="relative aspect-[21/9] bg-zinc-950 text-white flex flex-col justify-end p-5 overflow-hidden">
          {slide.image && (
            <Image src={slide.image} alt="Hero" fill sizes="600px" className="object-cover opacity-50" />
          )}
          <div className="relative z-10">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#f6ec91] mb-1">
              {isAr ? slide.eyebrow.ar : slide.eyebrow.en}
            </p>
            <h4 className="font-display text-xl sm:text-2xl leading-tight">
              {isAr ? slide.headline.ar : slide.headline.en}{" "}
              <span className="italic font-light text-[#f6ec91]">
                {isAr ? slide.italicTail.ar : slide.italicTail.en}
              </span>
            </h4>
          </div>
        </div>
      );
    }
    case "sponsors": {
      const s = config.sponsors;
      return (
        <div className="bg-black text-white p-4 text-center">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#f6ec91]">
            {isAr ? s.eyebrow.ar : s.eyebrow.en}
          </p>
          <p className="text-xs text-zinc-400 mt-1">{isAr ? s.subtext.ar : s.subtext.en}</p>
        </div>
      );
    }
    case "bestSellers":
    case "newArrivals":
    case "trending": {
      const s = config[sectionKey];
      return (
        <div className="p-4 bg-background text-foreground space-y-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {isAr ? s.eyebrow.ar : s.eyebrow.en}
          </p>
          <h4 className="font-display text-lg">
            {isAr ? s.title.ar : s.title.en}{" "}
            <span className="italic font-light opacity-80">
              {isAr ? s.italicTail.ar : s.italicTail.en}
            </span>
          </h4>
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-muted rounded-sm flex items-center justify-center text-[10px] text-muted-foreground">
                منتج {i}
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "editorialPremium":
    case "editorialStory": {
      const s = config[sectionKey];
      const isDark = sectionKey === "editorialStory";
      return (
        <div className={cn("p-5 grid grid-cols-2 gap-4 items-center", isDark ? "bg-zinc-950 text-white" : "bg-background text-foreground")}>
          <div className="relative aspect-[4/3] rounded overflow-hidden bg-muted">
            {s.image && <Image src={s.image} alt="Preview" fill sizes="300px" className="object-cover" />}
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] opacity-70 mb-1">
              {isAr ? s.eyebrow.ar : s.eyebrow.en}
            </p>
            <h4 className="font-display text-lg leading-tight mb-2">
              {isAr ? s.title.ar : s.title.en}
            </h4>
            <p className="text-xs opacity-80 line-clamp-2">
              {isAr ? s.body.ar[0] : s.body.en[0]}
            </p>
          </div>
        </div>
      );
    }
    case "valueProps": {
      const items = config.valueProps.items.filter((i) => i.visible);
      return (
        <div className="p-4 bg-accent/30 grid grid-cols-4 gap-2">
          {items.map((it, idx) => (
            <div key={idx} className="p-2 border border-border/50 rounded bg-background text-center space-y-1">
              <ShieldCheck className="h-4 w-4 mx-auto text-[#f6ec91]" />
              <p className="text-[10px] font-medium truncate">{isAr ? it.ar : it.en}</p>
            </div>
          ))}
        </div>
      );
    }
    case "manifesto": {
      const s = config.manifesto;
      return (
        <div className="bg-black text-white p-6 text-center">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#f6ec91] mb-1">
            {isAr ? s.eyebrow.ar : s.eyebrow.en}
          </p>
          <h4 className="font-display text-xl leading-tight">
            {isAr ? s.headline.ar : s.headline.en}
          </h4>
        </div>
      );
    }
    default:
      return <div className="p-4 text-xs text-center text-muted-foreground">معاينة تفاعلية قسم الصفحة الرئيسية</div>;
  }
}

// ─────────────────────────────────────────────
// SECTION EDITOR DISPATCHER
// ─────────────────────────────────────────────

function SectionEditor({
  sectionKey,
  onSaved,
}: {
  sectionKey: keyof HomepageConfig;
  onSaved: () => void;
}) {
  switch (sectionKey) {
    case "announcement": return <AnnouncementEditor onSaved={onSaved} />;
    case "hero": return <HeroEditor onSaved={onSaved} />;
    case "sponsors": return <SponsorsEditor onSaved={onSaved} />;
    case "bestSellers": return <ShowcaseEditor sectionKey="bestSellers" onSaved={onSaved} />;
    case "editorialPremium": return <EditorialEditor sectionKey="editorialPremium" onSaved={onSaved} />;
    case "newArrivals": return <ShowcaseEditor sectionKey="newArrivals" onSaved={onSaved} />;
    case "limitedDrop": return <SimpleVisibilityEditor sectionKey="limitedDrop" onSaved={onSaved} />;
    case "trending": return <ShowcaseEditor sectionKey="trending" onSaved={onSaved} />;
    case "editorialStory": return <EditorialEditor sectionKey="editorialStory" onSaved={onSaved} />;
    case "valueProps": return <ValuePropsEditor onSaved={onSaved} />;
    case "reviews": return <ReviewsEditor onSaved={onSaved} />;
    case "instagram": return <InstagramEditor onSaved={onSaved} />;
    case "faq": return <FAQEditor onSaved={onSaved} />;
    case "manifesto": return <ManifestoEditor onSaved={onSaved} />;
    default: return null;
  }
}

// ─────────────────────────────────────────────
// SHARED SUB-COMPONENTS
// ─────────────────────────────────────────────

function BiLangField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: BiLang;
  onChange: (v: BiLang) => void;
  multiline?: boolean;
}) {
  const { t } = useAdminT();
  const Field = multiline ? Textarea : Input;
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</Label>
      <Tabs defaultValue="en">
        <TabsList className="h-7">
          <TabsTrigger value="en" className="text-xs h-6 px-3">{t("englishContent")}</TabsTrigger>
          <TabsTrigger value="ar" className="text-xs h-6 px-3">{t("arabicContent")}</TabsTrigger>
        </TabsList>
        <TabsContent value="en" className="mt-2">
          <Field
            value={value.en}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
            dir="ltr"
            className={multiline ? "min-h-[80px]" : ""}
          />
        </TabsContent>
        <TabsContent value="ar" className="mt-2">
          <Field
            value={value.ar}
            onChange={(e) => onChange({ ...value, ar: e.target.value })}
            dir="rtl"
            className={multiline ? "min-h-[80px]" : ""}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const { t, isAr } = useAdminT();
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/homepage-image", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      onChange(url);
      toast.success(isAr ? "تم رفع الصورة بنجاح" : "Image uploaded successfully");
    } catch {
      toast.error(isAr ? "فشل رفع الصورة" : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="flex-1 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="shrink-0"
        >
          {uploading
            ? <><span className="animate-spin mr-1">⟳</span>{t("uploading")}</>
            : <><Upload className="h-3.5 w-3.5 mr-1.5" />{t("uploadImage")}</>}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
      {value && (
        <div className="relative w-28 h-16 rounded overflow-hidden border border-border/60">
          <Image src={value} alt="Preview" fill sizes="112px" className="object-cover" />
        </div>
      )}
    </div>
  );
}

function SaveRow({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const { t } = useAdminT();
  return (
    <div className="flex gap-2 pt-4 border-t border-border/40">
      <Button size="sm" onClick={onSave} className="bg-[#f6ec91] text-zinc-950 hover:bg-[#f6ec91]/90 font-medium">
        <Save className="h-3.5 w-3.5 mr-1.5" />
        {t("saveSection")}
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>{t("cancel")}</Button>
    </div>
  );
}

// ─────────────────────────────────────────────
// ANNOUNCEMENT EDITOR
// ─────────────────────────────────────────────

function AnnouncementEditor({ onSaved }: { onSaved: () => void }) {
  const { t, isAr } = useAdminT();
  const config = useHomepageConfig();
  const { updateSection } = useHomepageStore();
  const [items, setItems] = React.useState(config.announcement.items);

  const save = async () => {
    await updateSection("announcement", { ...config.announcement, items });
    toast.success(t("sectionSaved"));
    onSaved();
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {isAr ? "كل إعلان يظهر كعنصر في الشريط الدوار. يمكنك إخفاء أي منها أو تعديل نصه." : "Each announcement appears as one item in the marquee. Toggle visibility or edit text."}
      </p>
      {items.map((item, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">{t("itemN")} {i + 1}</p>
            <div className="flex items-center gap-3">
              <Switch
                checked={item.visible}
                onCheckedChange={(v) => {
                  const next = [...items];
                  next[i] = { ...next[i], visible: v };
                  setItems(next);
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => setItems(items.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t("englishContent")}</Label>
              <Input
                value={item.en}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], en: e.target.value };
                  setItems(next);
                }}
                dir="ltr"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">{t("arabicContent")}</Label>
              <Input
                value={item.ar}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], ar: e.target.value };
                  setItems(next);
                }}
                dir="rtl"
                className="mt-1 text-xs"
              />
            </div>
          </div>
        </Card>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setItems([...items, { en: "", ar: "", visible: true }])}
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />{t("addItem")}
      </Button>
      <SaveRow onSave={save} onCancel={onSaved} />
    </div>
  );
}

// ─────────────────────────────────────────────
// HERO CAROUSEL EDITOR
// ─────────────────────────────────────────────

const EMPTY_SLIDE = (): HeroSlide => ({
  id: "slide-" + Date.now(),
  visible: true,
  eyebrow: { en: "", ar: "" },
  headline: { en: "", ar: "" },
  italicTail: { en: "", ar: "" },
  subheading: { en: "", ar: "" },
  image: "",
  ctaLabel: { en: "Shop Now", ar: "تسوق الآن" },
  ctaHref: "/shop",
  align: "left",
});

function HeroEditor({ onSaved }: { onSaved: () => void }) {
  const { t, isAr } = useAdminT();
  const config = useHomepageConfig();
  const { updateSection } = useHomepageStore();
  const [slides, setSlides] = React.useState<HeroSlide[]>(config.hero.slides);
  const [expandedSlide, setExpandedSlide] = React.useState<string | null>(slides[0]?.id ?? null);

  const updateSlide = (idx: number, patch: Partial<HeroSlide>) => {
    const next = [...slides];
    next[idx] = { ...next[idx], ...patch };
    setSlides(next);
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const next = [...slides];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSlides(next);
  };

  const save = async () => {
    await updateSection("hero", { ...config.hero, slides });
    toast.success(t("sectionSaved"));
    onSaved();
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {isAr ? "أضف أو أزل أو رتب شرائح البانر الرئيسي. كل شريحة يمكن إخفاؤها بشكل مستقل." : "Add, remove, or reorder hero carousel slides. Each slide can be individually hidden."}
      </p>
      {slides.map((slide, i) => (
        <Card key={slide.id} className="overflow-hidden border-border/60">
          {/* Slide header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-card/60">
            <Switch
              checked={slide.visible}
              onCheckedChange={(v) => updateSlide(i, { visible: v })}
            />
            <p className="text-sm font-medium flex-1 truncate">
              {t("slideN")} {i + 1}: {slide.headline.en || (isAr ? "شريحة جديدة" : "New Slide")}
            </p>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveSlide(i, -1)} disabled={i === 0}>
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1}>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setExpandedSlide(expandedSlide === slide.id ? null : slide.id)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => setSlides(slides.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Slide editor */}
          {expandedSlide === slide.id && (
            <div className="border-t border-border/60 px-4 pb-4 pt-3 space-y-4 bg-accent/10">
              <BiLangField label={t("eyebrow")} value={slide.eyebrow} onChange={(v) => updateSlide(i, { eyebrow: v })} />
              <BiLangField label={t("headline")} value={slide.headline} onChange={(v) => updateSlide(i, { headline: v })} />
              <BiLangField label={t("italicTail")} value={slide.italicTail} onChange={(v) => updateSlide(i, { italicTail: v })} />
              <BiLangField label={t("subtitleLabel")} value={slide.subheading} onChange={(v) => updateSlide(i, { subheading: v })} />
              <BiLangField label={t("ctaLabel")} value={slide.ctaLabel} onChange={(v) => updateSlide(i, { ctaLabel: v })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t("ctaLink")}</Label>
                  <Input
                    value={slide.ctaHref}
                    onChange={(e) => updateSlide(i, { ctaHref: e.target.value })}
                    className="mt-1 text-xs"
                    placeholder="/shop"
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("alignment")}</Label>
                  <Select
                    value={slide.align}
                    onValueChange={(v) => updateSlide(i, { align: v as "left" | "center" })}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">{t("alignLeft")}</SelectItem>
                      <SelectItem value="center">{t("alignCenter")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <ImageUploadField
                label={t("imageUrl")}
                value={slide.image}
                onChange={(url) => updateSlide(i, { image: url })}
              />
            </div>
          )}
        </Card>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const s = EMPTY_SLIDE();
          setSlides([...slides, s]);
          setExpandedSlide(s.id);
        }}
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />{t("addSlide")}
      </Button>
      <SaveRow onSave={save} onCancel={onSaved} />
    </div>
  );
}

// ─────────────────────────────────────────────
// SPONSORS EDITOR
// ─────────────────────────────────────────────

function SponsorsEditor({ onSaved }: { onSaved: () => void }) {
  const { t } = useAdminT();
  const config = useHomepageConfig();
  const { updateSection } = useHomepageStore();
  const [eyebrow, setEyebrow] = React.useState(config.sponsors.eyebrow);
  const [subtext, setSubtext] = React.useState(config.sponsors.subtext);

  const save = async () => {
    await updateSection("sponsors", { ...config.sponsors, eyebrow, subtext });
    toast.success(t("sectionSaved"));
    onSaved();
  };

  return (
    <div className="space-y-4">
      <BiLangField label={t("eyebrow")} value={eyebrow} onChange={setEyebrow} />
      <BiLangField label={t("subtitleLabel")} value={subtext} onChange={setSubtext} />
      <SaveRow onSave={save} onCancel={onSaved} />
    </div>
  );
}

// ─────────────────────────────────────────────
// SHOWCASE SECTION EDITOR
// ─────────────────────────────────────────────

type ShowcaseKey = "bestSellers" | "newArrivals" | "trending";

function ShowcaseEditor({ sectionKey, onSaved }: { sectionKey: ShowcaseKey; onSaved: () => void }) {
  const { t } = useAdminT();
  const config = useHomepageConfig();
  const { updateSection } = useHomepageStore();
  const section = config[sectionKey] as HomepageConfig[ShowcaseKey];

  const [eyebrow, setEyebrow] = React.useState(section.eyebrow);
  const [title, setTitle] = React.useState(section.title);
  const [italicTail, setItalicTail] = React.useState(section.italicTail);
  const [description, setDescription] = React.useState(section.description);

  const save = async () => {
    await updateSection(sectionKey, { ...section, eyebrow, title, italicTail, description });
    toast.success(t("sectionSaved"));
    onSaved();
  };

  return (
    <div className="space-y-4">
      <BiLangField label={t("eyebrow")} value={eyebrow} onChange={setEyebrow} />
      <BiLangField label={t("headline")} value={title} onChange={setTitle} />
      <BiLangField label={t("italicTail")} value={italicTail} onChange={setItalicTail} />
      <BiLangField label={t("bodyText")} value={description} onChange={setDescription} multiline />
      <SaveRow onSave={save} onCancel={onSaved} />
    </div>
  );
}

// ─────────────────────────────────────────────
// EDITORIAL EDITOR
// ─────────────────────────────────────────────

type EditorialKey = "editorialPremium" | "editorialStory";

function EditorialEditor({ sectionKey, onSaved }: { sectionKey: EditorialKey; onSaved: () => void }) {
  const { t } = useAdminT();
  const config = useHomepageConfig();
  const { updateSection } = useHomepageStore();
  const section = config[sectionKey] as HomepageConfig[EditorialKey];

  const [eyebrow, setEyebrow] = React.useState(section.eyebrow);
  const [title, setTitle] = React.useState(section.title);
  const [italicTail, setItalicTail] = React.useState(section.italicTail);
  const [bodyEn, setBodyEn] = React.useState(section.body.en);
  const [bodyAr, setBodyAr] = React.useState(section.body.ar);
  const [image, setImage] = React.useState(section.image);
  const [ctaLabel, setCtaLabel] = React.useState(section.ctaLabel);
  const [ctaHref, setCtaHref] = React.useState(section.ctaHref);
  const [stats, setStats] = React.useState(section.stats);

  const save = async () => {
    await updateSection(sectionKey, {
      ...section,
      eyebrow,
      title,
      italicTail,
      body: { en: bodyEn, ar: bodyAr },
      image,
      ctaLabel,
      ctaHref,
      stats,
    });
    toast.success(t("sectionSaved"));
    onSaved();
  };

  return (
    <div className="space-y-5">
      <BiLangField label={t("eyebrow")} value={eyebrow} onChange={setEyebrow} />
      <BiLangField label={t("headline")} value={title} onChange={setTitle} />
      <BiLangField label={t("italicTail")} value={italicTail} onChange={setItalicTail} />

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("bodyText")} (English)</Label>
        {bodyEn.map((para, i) => (
          <div key={i} className="flex gap-2">
            <Textarea
              value={para}
              onChange={(e) => {
                const next = [...bodyEn];
                next[i] = e.target.value;
                setBodyEn(next);
              }}
              dir="ltr"
              className="min-h-[60px] text-xs flex-1"
            />
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 mt-1 text-destructive" onClick={() => setBodyEn(bodyEn.filter((_, j) => j !== i))}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setBodyEn([...bodyEn, ""])}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />{t("addParagraph")}
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("bodyText")} (Arabic)</Label>
        {bodyAr.map((para, i) => (
          <div key={i} className="flex gap-2">
            <Textarea
              value={para}
              onChange={(e) => {
                const next = [...bodyAr];
                next[i] = e.target.value;
                setBodyAr(next);
              }}
              dir="rtl"
              className="min-h-[60px] text-xs flex-1"
            />
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 mt-1 text-destructive" onClick={() => setBodyAr(bodyAr.filter((_, j) => j !== i))}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setBodyAr([...bodyAr, ""])}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />{t("addParagraph")}
        </Button>
      </div>

      <ImageUploadField label={t("imageUrl")} value={image} onChange={setImage} />
      <BiLangField label={t("ctaLabel")} value={ctaLabel} onChange={setCtaLabel} />
      <div>
        <Label className="text-xs">{t("ctaLink")}</Label>
        <Input value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} className="mt-1 text-xs" placeholder="/shop" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stats</Label>
        {stats.map((s, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              value={s.value}
              onChange={(e) => {
                const next = [...stats];
                next[i] = { ...next[i], value: e.target.value };
                setStats(next);
              }}
              className="w-20 text-xs"
              placeholder="30+"
            />
            <Input
              value={s.label.en}
              onChange={(e) => {
                const next = [...stats];
                next[i] = { ...next[i], label: { ...next[i].label, en: e.target.value } };
                setStats(next);
              }}
              dir="ltr"
              className="flex-1 text-xs"
              placeholder="Label EN"
            />
            <Input
              value={s.label.ar}
              onChange={(e) => {
                const next = [...stats];
                next[i] = { ...next[i], label: { ...next[i].label, ar: e.target.value } };
                setStats(next);
              }}
              dir="rtl"
              className="flex-1 text-xs"
              placeholder="Label AR"
            />
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setStats(stats.filter((_, j) => j !== i))}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setStats([...stats, { value: "", label: { en: "", ar: "" } }])}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />{t("addItem")}
        </Button>
      </div>

      <SaveRow onSave={save} onCancel={onSaved} />
    </div>
  );
}

// ─────────────────────────────────────────────
// VALUE PROPS EDITOR
// ─────────────────────────────────────────────

function ValuePropsEditor({ onSaved }: { onSaved: () => void }) {
  const { t } = useAdminT();
  const config = useHomepageConfig();
  const { updateSection } = useHomepageStore();
  const [items, setItems] = React.useState(config.valueProps.items);

  const save = async () => {
    await updateSection("valueProps", { ...config.valueProps, items });
    toast.success(t("sectionSaved"));
    onSaved();
  };

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">{t("itemN")} {i + 1}</p>
            <div className="flex items-center gap-2">
              <Switch
                checked={item.visible}
                onCheckedChange={(v) => {
                  const next = [...items];
                  next[i] = { ...next[i], visible: v };
                  setItems(next);
                }}
              />
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setItems(items.filter((_, j) => j !== i))}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t("headline")} (EN)</Label>
              <Input value={item.en} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], en: e.target.value }; setItems(n); }} dir="ltr" className="mt-1 text-xs" />
            </div>
            <div>
              <Label className="text-xs">{t("headline")} (AR)</Label>
              <Input value={item.ar} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], ar: e.target.value }; setItems(n); }} dir="rtl" className="mt-1 text-xs" />
            </div>
            <div>
              <Label className="text-xs">{t("bodyText")} (EN)</Label>
              <Textarea value={item.descEn} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], descEn: e.target.value }; setItems(n); }} dir="ltr" className="mt-1 text-xs min-h-[60px]" />
            </div>
            <div>
              <Label className="text-xs">{t("bodyText")} (AR)</Label>
              <Textarea value={item.descAr} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], descAr: e.target.value }; setItems(n); }} dir="rtl" className="mt-1 text-xs min-h-[60px]" />
            </div>
          </div>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={() => setItems([...items, { en: "", ar: "", descEn: "", descAr: "", visible: true }])}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />{t("addItem")}
      </Button>
      <SaveRow onSave={save} onCancel={onSaved} />
    </div>
  );
}

// ─────────────────────────────────────────────
// REVIEWS EDITOR
// ─────────────────────────────────────────────

function ReviewsEditor({ onSaved }: { onSaved: () => void }) {
  const { t } = useAdminT();
  const config = useHomepageConfig();
  const { updateSection } = useHomepageStore();
  const section = config.reviews;
  const [eyebrow, setEyebrow] = React.useState(section.eyebrow);
  const [title, setTitle] = React.useState(section.title);
  const [subtitle, setSubtitle] = React.useState(section.subtitle);

  const save = async () => {
    await updateSection("reviews", { ...section, eyebrow, title, subtitle });
    toast.success(t("sectionSaved"));
    onSaved();
  };

  return (
    <div className="space-y-4">
      <BiLangField label={t("eyebrow")} value={eyebrow} onChange={setEyebrow} />
      <BiLangField label={t("headline")} value={title} onChange={setTitle} />
      <BiLangField label={t("subtitleLabel")} value={subtitle} onChange={setSubtitle} />
      <SaveRow onSave={save} onCancel={onSaved} />
    </div>
  );
}

// ─────────────────────────────────────────────
// INSTAGRAM EDITOR
// ─────────────────────────────────────────────

function InstagramEditor({ onSaved }: { onSaved: () => void }) {
  const { t } = useAdminT();
  const config = useHomepageConfig();
  const { updateSection } = useHomepageStore();
  const section = config.instagram;
  const [handle, setHandle] = React.useState(section.handle);
  const [eyebrow, setEyebrow] = React.useState(section.eyebrow);
  const [title, setTitle] = React.useState(section.title);

  const save = async () => {
    await updateSection("instagram", { ...section, handle, eyebrow, title });
    toast.success(t("sectionSaved"));
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">{t("instagramHandle")}</Label>
        <Input value={handle} onChange={(e) => setHandle(e.target.value)} className="mt-1 text-xs" placeholder="@suited_by_meme" />
      </div>
      <BiLangField label={t("eyebrow")} value={eyebrow} onChange={setEyebrow} />
      <BiLangField label={t("headline")} value={title} onChange={setTitle} />
      <SaveRow onSave={save} onCancel={onSaved} />
    </div>
  );
}

// ─────────────────────────────────────────────
// FAQ EDITOR
// ─────────────────────────────────────────────

function FAQEditor({ onSaved }: { onSaved: () => void }) {
  const { t } = useAdminT();
  const config = useHomepageConfig();
  const { updateSection } = useHomepageStore();
  const [items, setItems] = React.useState(config.faq.items);

  const save = async () => {
    await updateSection("faq", { ...config.faq, items });
    toast.success(t("sectionSaved"));
    onSaved();
  };

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">{t("itemN")} {i + 1}</p>
            <div className="flex items-center gap-2">
              <Switch checked={item.visible} onCheckedChange={(v) => { const n = [...items]; n[i] = { ...n[i], visible: v }; setItems(n); }} />
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setItems(items.filter((_, j) => j !== i))}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t("questionEn")}</Label>
              <Input value={item.qEn} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], qEn: e.target.value }; setItems(n); }} dir="ltr" className="mt-1 text-xs" />
            </div>
            <div>
              <Label className="text-xs">{t("questionAr")}</Label>
              <Input value={item.qAr} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], qAr: e.target.value }; setItems(n); }} dir="rtl" className="mt-1 text-xs" />
            </div>
            <div>
              <Label className="text-xs">{t("answerEn")}</Label>
              <Textarea value={item.aEn} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], aEn: e.target.value }; setItems(n); }} dir="ltr" className="mt-1 text-xs min-h-[80px]" />
            </div>
            <div>
              <Label className="text-xs">{t("answerAr")}</Label>
              <Textarea value={item.aAr} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], aAr: e.target.value }; setItems(n); }} dir="rtl" className="mt-1 text-xs min-h-[80px]" />
            </div>
          </div>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={() => setItems([...items, { qEn: "", qAr: "", aEn: "", aAr: "", visible: true }])}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />{t("addItem")}
      </Button>
      <SaveRow onSave={save} onCancel={onSaved} />
    </div>
  );
}

// ─────────────────────────────────────────────
// MANIFESTO EDITOR
// ─────────────────────────────────────────────

function ManifestoEditor({ onSaved }: { onSaved: () => void }) {
  const { t } = useAdminT();
  const config = useHomepageConfig();
  const { updateSection } = useHomepageStore();
  const section = config.manifesto;

  const [eyebrow, setEyebrow] = React.useState(section.eyebrow);
  const [headline, setHeadline] = React.useState(section.headline);
  const [italicTail, setItalicTail] = React.useState(section.italicTail);
  const [body, setBody] = React.useState(section.body);
  const [newsletterEyebrow, setNewsletterEyebrow] = React.useState(section.newsletterEyebrow);
  const [newsletterTitle, setNewsletterTitle] = React.useState(section.newsletterTitle);
  const [newsletterItalic, setNewsletterItalic] = React.useState(section.newsletterItalic);
  const [newsletterBody, setNewsletterBody] = React.useState(section.newsletterBody);

  const save = async () => {
    await updateSection("manifesto", {
      ...section,
      eyebrow, headline, italicTail, body,
      newsletterEyebrow, newsletterTitle, newsletterItalic, newsletterBody,
    });
    toast.success(t("sectionSaved"));
    onSaved();
  };

  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Manifesto</p>
      <BiLangField label={t("eyebrow")} value={eyebrow} onChange={setEyebrow} />
      <BiLangField label={t("headline")} value={headline} onChange={setHeadline} />
      <BiLangField label={t("italicTail")} value={italicTail} onChange={setItalicTail} />
      <BiLangField label={t("bodyText")} value={body} onChange={setBody} multiline />
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">Newsletter</p>
      <BiLangField label={t("eyebrow")} value={newsletterEyebrow} onChange={setNewsletterEyebrow} />
      <BiLangField label={t("headline")} value={newsletterTitle} onChange={setNewsletterTitle} />
      <BiLangField label={t("italicTail")} value={newsletterItalic} onChange={setNewsletterItalic} />
      <BiLangField label={t("bodyText")} value={newsletterBody} onChange={setNewsletterBody} multiline />
      <SaveRow onSave={save} onCancel={onSaved} />
    </div>
  );
}

// ─────────────────────────────────────────────
// SIMPLE VISIBILITY
// ─────────────────────────────────────────────

function SimpleVisibilityEditor({ sectionKey, onSaved }: { sectionKey: keyof HomepageConfig; onSaved: () => void }) {
  const { isAr } = useAdminT();
  return (
    <div className="text-sm text-muted-foreground py-2">
      {isAr
        ? "هذا القسم يعرض المنتج المحدود الأول تلقائياً. استخدم الزر أعلاه لإظهاره أو إخفائه."
        : "This section automatically displays the first limited product. Use the toggle above to show or hide it."}
      <div className="pt-3">
        <Button size="sm" variant="ghost" onClick={onSaved}>
          {isAr ? "إغلاق" : "Close"}
        </Button>
      </div>
    </div>
  );
}
