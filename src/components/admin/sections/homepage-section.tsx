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
  DEFAULT_HOMEPAGE_CONFIG,
  type HomepageConfig,
  type HeroSlide,
  type BiLang,
} from "@/components/providers/homepage-store";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// MAIN SECTION
// ─────────────────────────────────────────────

export function HomepageSection() {
  const { t, isAr } = useAdminT();
  const config = useHomepageConfig();
  const { toggleVisibility, resetToDefaults, saving } = useHomepageStore();
  const [expandedKey, setExpandedKey] = React.useState<keyof HomepageConfig | null>(null);

  const sections: Array<{
    key: keyof HomepageConfig;
    label: string;
    description: string;
  }> = [
    { key: "announcement", label: t("announcementBar"), description: isAr ? "شريط الإعلانات المتحرك في أعلى الموقع" : "The scrolling marquee bar at the top of every page" },
    { key: "hero", label: t("heroCarousel"), description: isAr ? "شرائح البانر الرئيسي الكبير" : "The large full-screen hero carousel slides" },
    { key: "sponsors", label: t("sponsorLogos"), description: isAr ? "شريط الماركات المتحرك تحت البانر" : "Scrolling brand logos strip below the hero" },
    { key: "bestSellers", label: t("bestSellersSection"), description: isAr ? "قسم الأكثر مبيعاً" : "Best Sellers product showcase" },
    { key: "editorialPremium", label: t("premiumBrandsEditorial"), description: isAr ? "قسم الماركات الفاخرة المقسوم (صورة + نص)" : "Premium Brands split editorial (image + text)" },
    { key: "newArrivals", label: t("newArrivalsSection"), description: isAr ? "قسم المنتجات الجديدة" : "New Arrivals product showcase" },
    { key: "limitedDrop", label: t("limitedDropSpotlight"), description: isAr ? "قسم التشكيلة المحدودة" : "Limited drop product spotlight" },
    { key: "trending", label: t("trendingSection"), description: isAr ? "قسم الرائج الآن" : "Trending products showcase" },
    { key: "editorialStory", label: t("brandStoryEditorial"), description: isAr ? "قسم قصة الماركة (صورة + نص داكن)" : "Brand story dark editorial (image + text)" },
    { key: "valueProps", label: t("valuePropSection"), description: isAr ? "شريط مميزات الخدمة الأربعة" : "4-column service value propositions strip" },
    { key: "reviews", label: t("reviewsSection"), description: isAr ? "تقييمات العملاء" : "Customer reviews showcase" },
    { key: "instagram", label: t("instagramSection"), description: isAr ? "شريط صور انستاغرام" : "Instagram photo grid strip" },
    { key: "faq", label: t("faqSection"), description: isAr ? "قسم الأسئلة الشائعة" : "FAQ accordion" },
    { key: "manifesto", label: t("manifestoSection"), description: isAr ? "البيان والنشرة البريدية في الأسفل" : "Bottom manifesto & newsletter block" },
  ];

  const handleReset = () => {
    if (!window.confirm(t("resetDefaultsConfirm"))) return;
    resetToDefaults();
    toast.success(isAr ? "تم إعادة الضبط الافتراضي" : "Reset to factory defaults");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">{t("homepageSections")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("manageHomepage")}</p>
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

      {/* Saving indicator */}
      {saving && (
        <p className="text-xs text-muted-foreground animate-pulse">
          {isAr ? "جاري الحفظ…" : "Saving changes to Supabase…"}
        </p>
      )}

      {/* Section cards */}
      <div className="space-y-3">
        {sections.map(({ key, label, description }) => {
          const section = config[key] as { visible: boolean };
          const isExpanded = expandedKey === key;

          return (
            <Card key={key} className="overflow-hidden">
              {/* Card header row */}
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Visibility toggle */}
                <Switch
                  id={`toggle-${key}`}
                  checked={section.visible}
                  onCheckedChange={() => toggleVisibility(key)}
                />
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

              {/* Inline editor */}
              {isExpanded && (
                <div className="border-t border-border/60 px-5 pb-6 pt-4 bg-accent/20">
                  <SectionEditor sectionKey={key} onSaved={() => setExpandedKey(null)} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
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
        <div className="relative w-24 h-16 rounded overflow-hidden border border-border/60">
          <Image src={value} alt="Preview" fill sizes="96px" className="object-cover" />
        </div>
      )}
    </div>
  );
}

function SaveRow({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const { t } = useAdminT();
  return (
    <div className="flex gap-2 pt-4 border-t border-border/40">
      <Button size="sm" onClick={onSave}>
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
// HERO CAROUSEL EDITOR (full CRUD per slide)
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
  const [expandedSlide, setExpandedSlide] = React.useState<string | null>(null);

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
        <Card key={slide.id} className="overflow-hidden">
          {/* Slide header */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Switch
              checked={slide.visible}
              onCheckedChange={(v) => updateSlide(i, { visible: v })}
            />
            <p className="text-sm font-medium flex-1 truncate">
              {t("slideN")} {i + 1}: {slide.headline.en || "—"}
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
// SHOWCASE SECTION EDITOR (bestSellers, newArrivals, trending)
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
// EDITORIAL EDITOR (editorialPremium, editorialStory)
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

      {/* Body paragraphs */}
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

      {/* Stats */}
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
// SIMPLE VISIBILITY (limitedDrop — no editable text)
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
