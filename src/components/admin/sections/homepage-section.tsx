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
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  const storeConfig = useHomepageConfig();
  const { toggleVisibility, resetToDefaults, saving, updateSection } = useHomepageStore();

  // Local draft state for 100% real-time instant keystroke updates
  const [draftConfig, setDraftConfig] = React.useState<HomepageConfig>(storeConfig);
  const [expandedKey, setExpandedKey] = React.useState<keyof HomepageConfig | null>("hero");
  const [builderMode, setBuilderMode] = React.useState<"builder" | "list">("builder");

  // Keep draft in sync if store reloads from server
  React.useEffect(() => {
    setDraftConfig(storeConfig);
  }, [storeConfig]);

  const updateDraft = <K extends keyof HomepageConfig>(key: K, data: HomepageConfig[K]) => {
    setDraftConfig((prev) => ({
      ...prev,
      [key]: data,
    }));
  };

  const saveSectionToStore = async (key: keyof HomepageConfig) => {
    await updateSection(key, draftConfig[key]);
    toast.success(isAr ? "تم حفظ التغييرات ونشرها للمتجر" : "Section saved & updated on live store");
  };

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
            <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500 bg-amber-500/10">
              {isAr ? "مُحرّر الأتيليه التفاعلي المباشر" : "Interactive Live Page Builder"}
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
              const sectionConfig = draftConfig[key] as { visible: boolean };
              const isSelected = expandedKey === key;

              return (
                <div
                  key={key}
                  onClick={() => setExpandedKey(key)}
                  className={cn(
                    "group relative p-3.5 rounded-xl border transition-all cursor-pointer overflow-hidden",
                    isSelected
                      ? "border-amber-500 bg-card shadow-lg ring-1 ring-amber-500/50"
                      : "border-border/60 bg-card/50 hover:border-border hover:bg-card/80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "bg-amber-500 text-black font-bold" : "bg-muted text-muted-foreground group-hover:text-foreground"
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
                            onCheckedChange={() => {
                              toggleVisibility(key);
                              updateDraft(key, { ...draftConfig[key], visible: !sectionConfig.visible });
                            }}
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
                        {isAr ? "قيد التعديل المباشر" : "Editing now"}
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
                          variant={(draftConfig[expandedKey] as { visible: boolean }).visible ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {(draftConfig[expandedKey] as { visible: boolean }).visible ? t("sectionVisible") : t("sectionHidden")}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{activeSectionInfo?.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={(draftConfig[expandedKey] as { visible: boolean }).visible}
                      onCheckedChange={(v) => {
                        toggleVisibility(expandedKey);
                        updateDraft(expandedKey, { ...draftConfig[expandedKey], visible: v });
                      }}
                    />
                  </div>
                </div>

                {/* ⚡ 100% Real-time Keystroke Live Preview Banner */}
                <div className="p-4 bg-black/95 border-b border-zinc-800">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#f6ec91] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {isAr ? "معاينة القسم الحية المباشرة (تحديث لحظي عند الكتابة)" : "Live Instant Preview (Keystroke Updated)"}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {isAr ? "يتغير الشكل فور كتابة أي حرف" : "Updates on every single keypress"}
                    </span>
                  </div>

                  <div className="rounded-lg border border-zinc-800 overflow-hidden bg-background">
                    <LiveSectionPreview sectionKey={expandedKey} config={draftConfig} />
                  </div>
                </div>

                {/* Form Fields Editor */}
                <div className="p-6">
                  <SectionEditor
                    sectionKey={expandedKey}
                    draftConfig={draftConfig}
                    updateDraft={updateDraft}
                    onSave={() => saveSectionToStore(expandedKey)}
                    onClose={() => {}}
                  />
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
            const section = draftConfig[key] as { visible: boolean };
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
                    onCheckedChange={(v) => {
                      toggleVisibility(key);
                      updateDraft(key, { ...draftConfig[key], visible: v });
                    }}
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
                      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#f6ec91] mb-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {isAr ? "معاينة القسم الحية المباشرة" : "Live Section Preview"}
                      </p>
                      <div className="rounded border border-zinc-800 bg-background overflow-hidden">
                        <LiveSectionPreview sectionKey={key} config={draftConfig} />
                      </div>
                    </div>

                    <SectionEditor
                      sectionKey={key}
                      draftConfig={draftConfig}
                      updateDraft={updateDraft}
                      onSave={() => saveSectionToStore(key)}
                      onClose={() => setExpandedKey(null)}
                    />
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

function LiveSectionPreview({ sectionKey, config }: { sectionKey: keyof HomepageConfig; config: HomepageConfig }) {
  const { isAr } = useAdminT();

  switch (sectionKey) {
    case "announcement": {
      const items = config.announcement.items.filter((i) => i.visible);
      return (
        <div className="bg-black text-[#f6ec91] text-xs py-2.5 px-4 font-mono truncate text-center transition-all">
          {items.map((it) => (isAr ? (it.ar || it.en) : (it.en || it.ar))).join("  •  ") || "—"}
        </div>
      );
    }
    case "hero": {
      const slide = config.hero.slides[0];
      if (!slide) return null;
      return (
        <div className="relative aspect-[21/9] bg-zinc-950 text-white flex flex-col justify-end p-5 overflow-hidden transition-all">
          {slide.image && (
            <Image src={slide.image} alt="Hero" fill sizes="600px" className="object-cover opacity-50" />
          )}
          <div className="relative z-10">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#f6ec91] mb-1">
              {isAr ? (slide.eyebrow.ar || slide.eyebrow.en) : (slide.eyebrow.en || slide.eyebrow.ar)}
            </p>
            <h4 className="font-display text-xl sm:text-2xl leading-tight">
              {isAr ? (slide.headline.ar || slide.headline.en) : (slide.headline.en || slide.headline.ar)}{" "}
              <span className="italic font-light text-[#f6ec91]">
                {isAr ? (slide.italicTail.ar || slide.italicTail.en) : (slide.italicTail.en || slide.italicTail.ar)}
              </span>
            </h4>
          </div>
        </div>
      );
    }
    case "sponsors": {
      const s = config.sponsors;
      return (
        <div className="bg-black text-white p-4 text-center transition-all">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#f6ec91]">
            {isAr ? (s.eyebrow.ar || s.eyebrow.en) : (s.eyebrow.en || s.eyebrow.ar)}
          </p>
          <p className="text-xs text-zinc-400 mt-1">{isAr ? (s.subtext.ar || s.subtext.en) : (s.subtext.en || s.subtext.ar)}</p>
        </div>
      );
    }
    case "bestSellers":
    case "newArrivals":
    case "trending": {
      const s = config[sectionKey];
      return (
        <div className="p-4 bg-background text-foreground space-y-3 transition-all">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {isAr ? (s.eyebrow.ar || s.eyebrow.en) : (s.eyebrow.en || s.eyebrow.ar)}
          </p>
          <h4 className="font-display text-lg">
            {isAr ? (s.title.ar || s.title.en) : (s.title.en || s.title.ar)}{" "}
            <span className="italic font-light opacity-80">
              {isAr ? (s.italicTail.ar || s.italicTail.en) : (s.italicTail.en || s.italicTail.ar)}
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
        <div className={cn("p-5 grid grid-cols-2 gap-4 items-center transition-all", isDark ? "bg-zinc-950 text-white" : "bg-background text-foreground")}>
          <div className="relative aspect-[4/3] rounded overflow-hidden bg-muted">
            {s.image && <Image src={s.image} alt="Preview" fill sizes="300px" className="object-cover" />}
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] opacity-70 mb-1">
              {isAr ? (s.eyebrow.ar || s.eyebrow.en) : (s.eyebrow.en || s.eyebrow.ar)}
            </p>
            <h4 className="font-display text-lg leading-tight mb-2">
              {isAr ? (s.title.ar || s.title.en) : (s.title.en || s.title.ar)}
            </h4>
            <p className="text-xs opacity-80 line-clamp-2">
              {isAr ? (s.body.ar[0] || s.body.en[0]) : (s.body.en[0] || s.body.ar[0])}
            </p>
          </div>
        </div>
      );
    }
    case "valueProps": {
      const items = config.valueProps.items.filter((i) => i.visible);
      return (
        <div className="p-4 bg-accent/30 grid grid-cols-4 gap-2 transition-all">
          {items.map((it, idx) => (
            <div key={idx} className="p-2 border border-border/50 rounded bg-background text-center space-y-1">
              <ShieldCheck className="h-4 w-4 mx-auto text-[#f6ec91]" />
              <p className="text-[10px] font-medium truncate">{isAr ? (it.ar || it.en) : (it.en || it.ar)}</p>
            </div>
          ))}
        </div>
      );
    }
    case "manifesto": {
      const s = config.manifesto;
      return (
        <div className="bg-black text-white p-6 text-center transition-all">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#f6ec91] mb-1">
            {isAr ? (s.eyebrow.ar || s.eyebrow.en) : (s.eyebrow.en || s.eyebrow.ar)}
          </p>
          <h4 className="font-display text-xl leading-tight">
            {isAr ? (s.headline.ar || s.headline.en) : (s.headline.en || s.headline.ar)}
          </h4>
        </div>
      );
    }
    default:
      return <div className="p-4 text-xs text-center text-muted-foreground">معاينة تفاعلية قسم الصفحة الرئيسية</div>;
  }
}

// ─────────────────────────────────────────────
// SMART SIDE-BY-SIDE DUAL LANGUAGE FIELD
// ─────────────────────────────────────────────

function SmartBiLangField({
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
  const { isAr } = useAdminT();
  const Field = multiline ? Textarea : Input;

  const handleEnChange = (newEn: string) => {
    // Smart Mirror: If AR is empty or identical to EN, auto-populate AR so user types ONCE!
    const shouldMirror = !value.ar || value.ar === value.en;
    onChange({
      en: newEn,
      ar: shouldMirror ? newEn : value.ar,
    });
  };

  const handleArChange = (newAr: string) => {
    onChange({
      ...value,
      ar: newAr,
    });
  };

  const handleSmartSync = () => {
    if (value.en && !value.ar) onChange({ ...value, ar: value.en });
    else if (value.ar && !value.en) onChange({ ...value, en: value.ar });
    else onChange({ ...value, ar: value.en });
    toast.success(isAr ? "تم إكمال النص الثاني تلقائياً 🪄" : "Smart mirror synced 🪄");
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSmartSync}
          className="h-6 px-2 text-[10px] text-[#f6ec91] hover:text-[#f6ec91]/80 hover:bg-[#f6ec91]/10 gap-1 font-medium"
        >
          <Wand2 className="h-3 w-3" />
          {isAr ? "نسخ النص للغتين 🪄" : "Smart Mirror 🪄"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <span className="text-[10px] font-mono text-muted-foreground block mb-1">English (EN)</span>
          <Field
            value={value.en}
            onChange={(e) => handleEnChange(e.target.value)}
            dir="ltr"
            className={multiline ? "min-h-[70px] text-xs" : "h-9 text-xs"}
          />
        </div>
        <div>
          <span className="text-[10px] font-mono text-muted-foreground block mb-1">العربية (AR)</span>
          <Field
            value={value.ar}
            onChange={(e) => handleArChange(e.target.value)}
            dir="rtl"
            className={multiline ? "min-h-[70px] text-xs" : "h-9 text-xs"}
          />
        </div>
      </div>
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
// SECTION EDITORS (KESTROKE LIVE UPDATES)
// ─────────────────────────────────────────────

interface SectionEditorProps<K extends keyof HomepageConfig> {
  sectionKey: K;
  draftConfig: HomepageConfig;
  updateDraft: <T extends keyof HomepageConfig>(key: T, data: HomepageConfig[T]) => void;
  onSave: () => void;
  onClose: () => void;
}

function SectionEditor({
  sectionKey,
  draftConfig,
  updateDraft,
  onSave,
  onClose,
}: SectionEditorProps<keyof HomepageConfig>) {
  switch (sectionKey) {
    case "announcement":
      return <AnnouncementEditor config={draftConfig.announcement} update={(d) => updateDraft("announcement", d)} onSave={onSave} onClose={onClose} />;
    case "hero":
      return <HeroEditor config={draftConfig.hero} update={(d) => updateDraft("hero", d)} onSave={onSave} onClose={onClose} />;
    case "sponsors":
      return <SponsorsEditor config={draftConfig.sponsors} update={(d) => updateDraft("sponsors", d)} onSave={onSave} onClose={onClose} />;
    case "bestSellers":
    case "newArrivals":
    case "trending":
      return <ShowcaseEditor sectionKey={sectionKey} config={draftConfig[sectionKey]} update={(d) => updateDraft(sectionKey, d)} onSave={onSave} onClose={onClose} />;
    case "editorialPremium":
    case "editorialStory":
      return <EditorialEditor sectionKey={sectionKey} config={draftConfig[sectionKey]} update={(d) => updateDraft(sectionKey, d)} onSave={onSave} onClose={onClose} />;
    case "valueProps":
      return <ValuePropsEditor config={draftConfig.valueProps} update={(d) => updateDraft("valueProps", d)} onSave={onSave} onClose={onClose} />;
    case "reviews":
      return <ReviewsEditor config={draftConfig.reviews} update={(d) => updateDraft("reviews", d)} onSave={onSave} onClose={onClose} />;
    case "instagram":
      return <InstagramEditor config={draftConfig.instagram} update={(d) => updateDraft("instagram", d)} onSave={onSave} onClose={onClose} />;
    case "faq":
      return <FAQEditor config={draftConfig.faq} update={(d) => updateDraft("faq", d)} onSave={onSave} onClose={onClose} />;
    case "manifesto":
      return <ManifestoEditor config={draftConfig.manifesto} update={(d) => updateDraft("manifesto", d)} onSave={onSave} onClose={onClose} />;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────
// ANNOUNCEMENT EDITOR
// ─────────────────────────────────────────────

function AnnouncementEditor({
  config,
  update,
  onSave,
  onClose,
}: {
  config: HomepageConfig["announcement"];
  update: (d: HomepageConfig["announcement"]) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const { t, isAr } = useAdminT();

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {isAr ? "كل إعلان يظهر كعنصر في الشريط الدوار. يمكن إخفاء أي عنصر أو تعديله." : "Each announcement appears in the marquee strip."}
      </p>
      {config.items.map((item, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">{t("itemN")} {i + 1}</p>
            <div className="flex items-center gap-3">
              <Switch
                checked={item.visible}
                onCheckedChange={(v) => {
                  const next = [...config.items];
                  next[i] = { ...next[i], visible: v };
                  update({ ...config, items: next });
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={() => {
                  update({ ...config, items: config.items.filter((_, j) => j !== i) });
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">English (EN)</Label>
              <Input
                value={item.en}
                onChange={(e) => {
                  const next = [...config.items];
                  const newEn = e.target.value;
                  const newAr = (!item.ar || item.ar === item.en) ? newEn : item.ar;
                  next[i] = { ...next[i], en: newEn, ar: newAr };
                  update({ ...config, items: next });
                }}
                dir="ltr"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">العربية (AR)</Label>
              <Input
                value={item.ar}
                onChange={(e) => {
                  const next = [...config.items];
                  next[i] = { ...next[i], ar: e.target.value };
                  update({ ...config, items: next });
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
        onClick={() => update({ ...config, items: [...config.items, { en: "", ar: "", visible: true }] })}
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />{t("addItem")}
      </Button>
      <SaveRow onSave={onSave} onCancel={onClose} />
    </div>
  );
}

// ─────────────────────────────────────────────
// HERO CAROUSEL EDITOR
// ─────────────────────────────────────────────

function HeroEditor({
  config,
  update,
  onSave,
  onClose,
}: {
  config: HomepageConfig["hero"];
  update: (d: HomepageConfig["hero"]) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const { t, isAr } = useAdminT();
  const [expandedSlide, setExpandedSlide] = React.useState<string | null>(config.slides[0]?.id ?? null);

  const updateSlide = (idx: number, patch: Partial<HeroSlide>) => {
    const next = [...config.slides];
    next[idx] = { ...next[idx], ...patch };
    update({ ...config, slides: next });
  };

  return (
    <div className="space-y-4">
      {config.slides.map((slide, i) => (
        <Card key={slide.id} className="overflow-hidden border-border/60">
          <div className="flex items-center gap-3 px-4 py-3 bg-card/60">
            <Switch
              checked={slide.visible}
              onCheckedChange={(v) => updateSlide(i, { visible: v })}
            />
            <p className="text-sm font-medium flex-1 truncate">
              {t("slideN")} {i + 1}: {slide.headline.en || (isAr ? "شريحة جديدة" : "New Slide")}
            </p>
            <div className="flex items-center gap-1">
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
                className="h-7 w-7 text-destructive"
                onClick={() => update({ ...config, slides: config.slides.filter((_, j) => j !== i) })}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {expandedSlide === slide.id && (
            <div className="border-t border-border/60 px-4 pb-4 pt-3 space-y-4 bg-accent/10">
              <SmartBiLangField label={t("eyebrow")} value={slide.eyebrow} onChange={(v) => updateSlide(i, { eyebrow: v })} />
              <SmartBiLangField label={t("headline")} value={slide.headline} onChange={(v) => updateSlide(i, { headline: v })} />
              <SmartBiLangField label={t("italicTail")} value={slide.italicTail} onChange={(v) => updateSlide(i, { italicTail: v })} />
              <SmartBiLangField label={t("subtitleLabel")} value={slide.subheading} onChange={(v) => updateSlide(i, { subheading: v })} />
              <SmartBiLangField label={t("ctaLabel")} value={slide.ctaLabel} onChange={(v) => updateSlide(i, { ctaLabel: v })} />
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

      <SaveRow onSave={onSave} onCancel={onClose} />
    </div>
  );
}

// ─────────────────────────────────────────────
// SPONSORS EDITOR
// ─────────────────────────────────────────────

function SponsorsEditor({
  config,
  update,
  onSave,
  onClose,
}: {
  config: HomepageConfig["sponsors"];
  update: (d: HomepageConfig["sponsors"]) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <SmartBiLangField label="Eyebrow" value={config.eyebrow} onChange={(v) => update({ ...config, eyebrow: v })} />
      <SmartBiLangField label="Subtext" value={config.subtext} onChange={(v) => update({ ...config, subtext: v })} />
      <SaveRow onSave={onSave} onCancel={onClose} />
    </div>
  );
}

// ─────────────────────────────────────────────
// SHOWCASE EDITOR
// ─────────────────────────────────────────────

function ShowcaseEditor({
  sectionKey,
  config,
  update,
  onSave,
  onClose,
}: {
  sectionKey: "bestSellers" | "newArrivals" | "trending";
  config: HomepageConfig["bestSellers"];
  update: (d: HomepageConfig["bestSellers"]) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <SmartBiLangField label="Eyebrow" value={config.eyebrow} onChange={(v) => update({ ...config, eyebrow: v })} />
      <SmartBiLangField label="Title" value={config.title} onChange={(v) => update({ ...config, title: v })} />
      <SmartBiLangField label="Italic Tail" value={config.italicTail} onChange={(v) => update({ ...config, italicTail: v })} />
      <SmartBiLangField label="Description" value={config.description} onChange={(v) => update({ ...config, description: v })} multiline />
      <SaveRow onSave={onSave} onCancel={onClose} />
    </div>
  );
}

// ─────────────────────────────────────────────
// EDITORIAL EDITOR
// ─────────────────────────────────────────────

function EditorialEditor({
  sectionKey,
  config,
  update,
  onSave,
  onClose,
}: {
  sectionKey: "editorialPremium" | "editorialStory";
  config: HomepageConfig["editorialPremium"];
  update: (d: HomepageConfig["editorialPremium"]) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <SmartBiLangField label="Eyebrow" value={config.eyebrow} onChange={(v) => update({ ...config, eyebrow: v })} />
      <SmartBiLangField label="Headline" value={config.title} onChange={(v) => update({ ...config, title: v })} />
      <SmartBiLangField label="Italic Tail" value={config.italicTail} onChange={(v) => update({ ...config, italicTail: v })} />
      <ImageUploadField label="Image" value={config.image} onChange={(url) => update({ ...config, image: url })} />
      <SmartBiLangField label="CTA Label" value={config.ctaLabel} onChange={(v) => update({ ...config, ctaLabel: v })} />
      <SaveRow onSave={onSave} onCancel={onClose} />
    </div>
  );
}

// ─────────────────────────────────────────────
// VALUE PROPS EDITOR
// ─────────────────────────────────────────────

function ValuePropsEditor({
  config,
  update,
  onSave,
  onClose,
}: {
  config: HomepageConfig["valueProps"];
  update: (d: HomepageConfig["valueProps"]) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const { t } = useAdminT();

  return (
    <div className="space-y-4">
      {config.items.map((item, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">{t("itemN")} {i + 1}</p>
            <Switch
              checked={item.visible}
              onCheckedChange={(v) => {
                const next = [...config.items];
                next[i] = { ...next[i], visible: v };
                update({ ...config, items: next });
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">English Headline</Label>
              <Input
                value={item.en}
                onChange={(e) => {
                  const next = [...config.items];
                  const newEn = e.target.value;
                  const newAr = (!item.ar || item.ar === item.en) ? newEn : item.ar;
                  next[i] = { ...next[i], en: newEn, ar: newAr };
                  update({ ...config, items: next });
                }}
                dir="ltr"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">العنوان بالعربية</Label>
              <Input
                value={item.ar}
                onChange={(e) => {
                  const next = [...config.items];
                  next[i] = { ...next[i], ar: e.target.value };
                  update({ ...config, items: next });
                }}
                dir="rtl"
                className="mt-1 text-xs"
              />
            </div>
          </div>
        </Card>
      ))}
      <SaveRow onSave={onSave} onCancel={onClose} />
    </div>
  );
}

// ─────────────────────────────────────────────
// REVIEWS EDITOR
// ─────────────────────────────────────────────

function ReviewsEditor({
  config,
  update,
  onSave,
  onClose,
}: {
  config: HomepageConfig["reviews"];
  update: (d: HomepageConfig["reviews"]) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <SmartBiLangField label="Eyebrow" value={config.eyebrow} onChange={(v) => update({ ...config, eyebrow: v })} />
      <SmartBiLangField label="Title" value={config.title} onChange={(v) => update({ ...config, title: v })} />
      <SmartBiLangField label="Subtitle" value={config.subtitle} onChange={(v) => update({ ...config, subtitle: v })} />
      <SaveRow onSave={onSave} onCancel={onClose} />
    </div>
  );
}

// ─────────────────────────────────────────────
// INSTAGRAM EDITOR
// ─────────────────────────────────────────────

function InstagramEditor({
  config,
  update,
  onSave,
  onClose,
}: {
  config: HomepageConfig["instagram"];
  update: (d: HomepageConfig["instagram"]) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Instagram Handle</Label>
        <Input value={config.handle} onChange={(e) => update({ ...config, handle: e.target.value })} className="mt-1 text-xs" />
      </div>
      <SmartBiLangField label="Eyebrow" value={config.eyebrow} onChange={(v) => update({ ...config, eyebrow: v })} />
      <SmartBiLangField label="Title" value={config.title} onChange={(v) => update({ ...config, title: v })} />
      <SaveRow onSave={onSave} onCancel={onClose} />
    </div>
  );
}

// ─────────────────────────────────────────────
// FAQ EDITOR
// ─────────────────────────────────────────────

function FAQEditor({
  config,
  update,
  onSave,
  onClose,
}: {
  config: HomepageConfig["faq"];
  update: (d: HomepageConfig["faq"]) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      {config.items.map((item, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Question (EN)</Label>
              <Input
                value={item.qEn}
                onChange={(e) => {
                  const next = [...config.items];
                  const newEn = e.target.value;
                  const newAr = (!item.qAr || item.qAr === item.qEn) ? newEn : item.qAr;
                  next[i] = { ...next[i], qEn: newEn, qAr: newAr };
                  update({ ...config, items: next });
                }}
                dir="ltr"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">السؤال (AR)</Label>
              <Input
                value={item.qAr}
                onChange={(e) => {
                  const next = [...config.items];
                  next[i] = { ...next[i], qAr: e.target.value };
                  update({ ...config, items: next });
                }}
                dir="rtl"
                className="mt-1 text-xs"
              />
            </div>
          </div>
        </Card>
      ))}
      <SaveRow onSave={onSave} onCancel={onClose} />
    </div>
  );
}

// ─────────────────────────────────────────────
// MANIFESTO EDITOR
// ─────────────────────────────────────────────

function ManifestoEditor({
  config,
  update,
  onSave,
  onClose,
}: {
  config: HomepageConfig["manifesto"];
  update: (d: HomepageConfig["manifesto"]) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <SmartBiLangField label="Eyebrow" value={config.eyebrow} onChange={(v) => update({ ...config, eyebrow: v })} />
      <SmartBiLangField label="Headline" value={config.headline} onChange={(v) => update({ ...config, headline: v })} />
      <SmartBiLangField label="Italic Tail" value={config.italicTail} onChange={(v) => update({ ...config, italicTail: v })} />
      <SmartBiLangField label="Body" value={config.body} onChange={(v) => update({ ...config, body: v })} multiline />
      <SaveRow onSave={onSave} onCancel={onClose} />
    </div>
  );
}
