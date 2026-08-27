"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  Package,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useT, useLangDir } from "@/lib/i18n";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ReturnStatus = "pending" | "reviewing" | "approved" | "rejected" | "refunded";

type ReturnRecord = {
  id: string;
  order_number: string;
  reason: string;
  description: string | null;
  image_url: string | null;
  status: ReturnStatus;
  admin_note: string | null;
  created_at: string;
};

const REASON_KEYS = [
  "wrong_size",
  "wrong_item",
  "damaged",
  "not_as_described",
  "changed_mind",
  "other",
] as const;
type ReturnReason = (typeof REASON_KEYS)[number];

const STATUS_COLORS: Record<ReturnStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  reviewing: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  rejected: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  refunded: "bg-violet-500/10 text-violet-600 border-violet-500/30",
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export function ReturnsClient() {
  const t = useT();
  const dir = useLangDir();
  const router = useRouter();
  const isAr = dir === "rtl";

  const [authChecked, setAuthChecked] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState("");

  // Form state
  const [orderNumber, setOrderNumber] = React.useState("");
  const [reason, setReason] = React.useState<ReturnReason | "">("");
  const [description, setDescription] = React.useState("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  // Existing returns
  const [myReturns, setMyReturns] = React.useState<ReturnRecord[]>([]);
  const [loadingReturns, setLoadingReturns] = React.useState(false);

  // ── Auth check
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.user) {
          setIsLoggedIn(true);
          setUserEmail(data.user.email ?? "");
          fetchMyReturns();
        }
      } catch {
        setIsLoggedIn(false);
      }
      setAuthChecked(true);
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyReturns = async () => {
    setLoadingReturns(true);
    try {
      const res = await fetch("/api/returns");
      if (res.ok) {
        const data = await res.json();
        setMyReturns(data.returns ?? []);
      }
    } finally {
      setLoadingReturns(false);
    }
  };

  // ── Image handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error(isAr ? "الصورة أكبر من 8 ميجا" : "Image must be under 8MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // ── Upload image via the server-mediated returns upload route
  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/returns/image-upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        toast.error(isAr ? "فشل رفع الصورة" : "Failed to upload image");
        return null;
      }
      return data.url as string;
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      toast.error(isAr ? "أدخل رقم الأوردر" : "Enter order number");
      return;
    }
    if (!reason) {
      toast.error(isAr ? "اختر سبب الاسترجاع" : "Select a return reason");
      return;
    }

    setSubmitting(true);
    try {
      let image_url = "";
      if (imageFile) {
        const url = await uploadImageToStorage(imageFile);
        if (url) image_url = url;
      }

      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_number: orderNumber.trim(),
          reason,
          description: description.trim() || undefined,
          image_url: image_url || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "WINDOW_EXPIRED") {
          toast.error(
            isAr
              ? `انتهت مدة الاسترجاع. مضى على الطلب ${data.days_elapsed} يوم (الحد الأقصى 14 يوم).`
              : data.error
          );
        } else if (data.code === "ALREADY_EXISTS") {
          toast.error(
            isAr
              ? "يوجد طلب استرجاع بالفعل لهذا الأوردر."
              : "A return for this order already exists."
          );
        } else {
          toast.error(data.error || (isAr ? "حدث خطأ" : "Something went wrong"));
        }
        return;
      }

      setSubmitted(true);
      toast.success(isAr ? "تم إرسال طلب الاسترجاع بنجاح!" : "Return request submitted!");
      fetchMyReturns();
    } finally {
      setSubmitting(false);
    }
  };

  const reasonLabels: Record<ReturnReason, { en: string; ar: string }> = {
    wrong_size: { en: "Wrong size", ar: "مقاس غلط" },
    wrong_item: { en: "Wrong item received", ar: "منتج غير صحيح" },
    damaged: { en: "Item arrived damaged", ar: "المنتج وصل تالف" },
    not_as_described: { en: "Not as described", ar: "مختلف عن الوصف" },
    changed_mind: { en: "Changed my mind", ar: "غيّرت رأيي" },
    other: { en: "Other", ar: "سبب آخر" },
  };

  const statusLabels: Record<ReturnStatus, { en: string; ar: string }> = {
    pending: { en: "Pending Review", ar: "في انتظار المراجعة" },
    reviewing: { en: "Under Review", ar: "قيد المراجعة" },
    approved: { en: "Approved", ar: "تمت الموافقة" },
    rejected: { en: "Rejected", ar: "مرفوض" },
    refunded: { en: "Refunded", ar: "تم الاسترداد" },
  };

  // ─────────────────────────────────────────────
  // Loading skeleton
  // ─────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Not logged in
  // ─────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div dir={dir} className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
            <RotateCcw className="h-10 w-10 text-amber-500" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {isAr ? "الاسترجاع والاستبدال" : "Returns & Refunds"}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {isAr
                ? "لتقديم طلب استرجاع، يجب تسجيل الدخول بحسابك أولاً."
                : "Please log in to your account to submit a return request."}
            </p>
          </div>
          <Link href="/account">
            <Button className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8">
              {isAr ? "تسجيل الدخول" : "Log In"} <ChevronRight className="h-4 w-4 ms-1" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Success state
  // ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div dir={dir} className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto animate-in zoom-in duration-300">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {isAr ? "تم إرسال طلبك!" : "Request Submitted!"}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {isAr
                ? "تم استقبال طلب الاسترجاع بنجاح. سيتم مراجعته خلال 2-3 أيام عمل وسنتواصل معك."
                : "Your return request has been received. Our team will review it within 2-3 business days and contact you."}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                setOrderNumber("");
                setReason("");
                setDescription("");
                removeImage();
              }}
            >
              {isAr ? "طلب استرجاع جديد" : "New Request"}
            </Button>
            <Link href="/account">
              <Button className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
                {isAr ? "حسابي" : "My Account"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Main form
  // ─────────────────────────────────────────────
  return (
    <div dir={dir} className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 mt-1">
              <RotateCcw className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {t("nav.returns")}
              </h1>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                {isAr
                  ? "تقبل MEME الاسترجاع خلال 14 يوم من تاريخ الطلب. يُرجى ملء النموذج أدناه."
                  : "MEME accepts returns within 14 days of your order date. Please fill in the form below."}
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>
                  {isAr
                    ? "نافذة الاسترجاع: 14 يوم من تاريخ الطلب"
                    : "Return window: 14 days from order date"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-sm">
            <h2 className="font-display text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" />
              {isAr ? "تفاصيل الاسترجاع" : "Return Details"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Order Number */}
              <div className="space-y-2">
                <Label htmlFor="order_number" className="text-xs font-semibold uppercase tracking-wider">
                  {isAr ? "رقم الأوردر *" : "Order Number *"}
                </Label>
                <Input
                  id="order_number"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder={isAr ? "مثال: ORD-12345" : "e.g. ORD-12345"}
                  className="h-11 rounded-xl border-border/60 bg-background/80"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  {isAr
                    ? "ستجد رقم الأوردر في بريدك الإلكتروني أو في صفحة حسابك."
                    : "Find your order number in your confirmation email or account page."}
                </p>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-xs font-semibold uppercase tracking-wider">
                  {isAr ? "سبب الاسترجاع *" : "Reason for Return *"}
                </Label>
                <Select value={reason} onValueChange={(v) => setReason(v as ReturnReason)}>
                  <SelectTrigger id="reason" className="h-11 rounded-xl border-border/60 bg-background/80">
                    <SelectValue placeholder={isAr ? "اختر السبب" : "Select reason"} />
                  </SelectTrigger>
                  <SelectContent>
                    {REASON_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {isAr ? reasonLabels[key].ar : reasonLabels[key].en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider">
                  {isAr ? "وصف المشكلة" : "Describe the Issue"}
                  <span className="text-muted-foreground font-normal ms-1">
                    ({isAr ? "اختياري" : "optional"})
                  </span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isAr
                      ? "اشرح المشكلة بشكل مفصل لمساعدتنا في معالجة طلبك بشكل أسرع..."
                      : "Describe the issue in detail to help us process your request faster..."
                  }
                  className="rounded-xl border-border/60 bg-background/80 min-h-[100px] resize-none"
                  maxLength={2000}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  {isAr ? "صورة المنتج" : "Product Photo"}
                  <span className="text-muted-foreground font-normal">
                    ({isAr ? "اختياري" : "optional"})
                  </span>
                </Label>

                {imagePreview ? (
                  <div className="relative w-full aspect-video max-h-48 rounded-xl overflow-hidden border border-border/60 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Return item preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 end-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="return_image"
                    className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-border/60 bg-background/50 hover:bg-accent/40 cursor-pointer transition-colors gap-2"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {isAr ? "اضغط لرفع صورة (حتى 8MB)" : "Click to upload photo (max 8MB)"}
                    </span>
                    <input
                      id="return_image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={submitting || uploadingImage || !orderNumber || !reason}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-sm"
              >
                {submitting || uploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                    {isAr ? "جاري الإرسال..." : "Submitting..."}
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 me-2" />
                    {isAr ? "إرسال طلب الاسترجاع" : "Submit Return Request"}
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Sidebar — Policy + My Returns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Policy Card */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
            <h3 className="font-semibold text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {isAr ? "سياسة الاسترجاع" : "Return Policy"}
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">✓</span>
                {isAr ? "14 يوم من تاريخ الطلب" : "14 days from order date"}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">✓</span>
                {isAr ? "المنتج يجب أن يكون سليماً وغير مستخدم" : "Item must be unused and in original condition"}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">✓</span>
                {isAr ? "صورة المنتج تسرّع عملية الموافقة" : "A product photo speeds up approval"}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 mt-0.5">✗</span>
                {isAr ? "لا يُقبل الاسترجاع بعد 14 يوم" : "Returns not accepted after 14 days"}
              </li>
            </ul>
          </div>

          {/* My Returns */}
          <div className="rounded-2xl border border-border/80 bg-card/60 p-5">
            <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {isAr ? "طلباتي السابقة" : "My Previous Requests"}
            </h3>

            {loadingReturns ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : myReturns.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                {isAr ? "لا توجد طلبات استرجاع سابقة" : "No previous return requests"}
              </p>
            ) : (
              <div className="space-y-3">
                {myReturns.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-border/50 bg-background/60 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground">{r.order_number}</span>
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                          STATUS_COLORS[r.status]
                        )}
                      >
                        {isAr ? statusLabels[r.status].ar : statusLabels[r.status].en}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {isAr
                        ? reasonLabels[r.reason as ReturnReason]?.ar ?? r.reason
                        : reasonLabels[r.reason as ReturnReason]?.en ?? r.reason}
                    </p>
                    {r.admin_note && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 border-t border-border/40 pt-2">
                        <span className="font-semibold">{isAr ? "ملاحظة الإدارة: " : "Admin note: "}</span>
                        {r.admin_note}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60">
                      {new Date(r.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
