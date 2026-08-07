"use client";

import * as React from "react";
import {
  Store,
  CreditCard,
  Truck,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Smartphone,
  Monitor,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAdminT } from "@/components/admin/admin-i18n";
import { useStoreSettingsStore } from "@/lib/store-settings-store";
import { useShippingStore } from "@/lib/shipping-store";
import { usePaymentStore } from "@/lib/payment-store";
import type { ShippingZone } from "@/lib/format";

export function SettingsSection() {
  const { isAr } = useAdminT();
  const [tab, setTab] = React.useState<"store" | "payments" | "shipping">("store");

  const [showPreviewModal, setShowPreviewModal] = React.useState(false);
  const [previewPath, setPreviewPath] = React.useState("/");
  const [previewMode, setPreviewMode] = React.useState<"desktop" | "mobile">("desktop");
  const [iframeKey, setIframeKey] = React.useState(0);

  const openPreview = (path?: string) => {
    const defaultPath = tab === "payments" || tab === "shipping" ? "/checkout" : "/";
    setPreviewPath(path || defaultPath);
    setIframeKey((k) => k + 1);
    setShowPreviewModal(true);
  };

  const tabs = [
    { id: "store" as const, label: isAr ? "إعدادات المتجر" : "Store Profile", icon: Store },
    { id: "payments" as const, label: isAr ? "وسائل الدفع والتحويل" : "Payments & Gateways", icon: CreditCard },
    { id: "shipping" as const, label: isAr ? "مناطق وأسعار الشحن" : "Shipping Zones & Fees", icon: Truck },
  ];

  return (
    <div className="space-y-6">
      {/* Settings Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-1">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                tab === tabItem.id
                  ? "border-amber-500 text-amber-600 dark:text-amber-400 font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tabItem.icon className="h-4 w-4" />
              {tabItem.label}
            </button>
          ))}
        </div>

        {/* Live Preview Header Action */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => openPreview()}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-2 shrink-0"
          >
            <Eye className="h-4 w-4 text-amber-500 animate-pulse" />
            {isAr ? "معاينة حية للموقع 👁️" : "Live Storefront Preview 👁️"}
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open(previewPath, "_blank")}
            className="h-9 px-3 text-xs font-bold flex items-center gap-1.5 shrink-0"
            title={isAr ? "فتح في نافذة جديدة" : "Open in new browser tab"}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "تبويب جديد" : "New Tab"}</span>
          </Button>
        </div>
      </div>

      {tab === "store" && <StoreSettings onOpenPreview={openPreview} />}
      {tab === "payments" && <PaymentsSettings onOpenPreview={openPreview} />}
      {tab === "shipping" && <ShippingSettings onOpenPreview={openPreview} />}

      {/* Live Storefront Interactive Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden rounded-2xl flex flex-col bg-background">
          <div className="p-3 px-5 border-b border-border bg-card flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-amber-500 animate-pulse" />
              <div>
                <h3 className="font-display font-bold text-base text-foreground">
                  {isAr ? "معاينة حية وتفاعلية للمتجر" : "Settings Live Interactive Preview"}
                </h3>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {previewPath}
                </p>
              </div>
            </div>

            {/* Path selector tabs & responsive mode toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-accent/60 p-1 rounded-xl text-xs">
                <button
                  onClick={() => { setPreviewPath("/"); setIframeKey((k) => k + 1); }}
                  className={cn("px-3 py-1 rounded-lg font-bold transition-all", previewPath === "/" ? "bg-amber-500 text-black shadow-xs" : "text-muted-foreground hover:text-foreground")}
                >
                  {isAr ? "الرئيسية" : "Home"}
                </button>
                <button
                  onClick={() => { setPreviewPath("/shop"); setIframeKey((k) => k + 1); }}
                  className={cn("px-3 py-1 rounded-lg font-bold transition-all", previewPath === "/shop" ? "bg-amber-500 text-black shadow-xs" : "text-muted-foreground hover:text-foreground")}
                >
                  {isAr ? "المتجر" : "Shop"}
                </button>
                <button
                  onClick={() => { setPreviewPath("/checkout"); setIframeKey((k) => k + 1); }}
                  className={cn("px-3 py-1 rounded-lg font-bold transition-all", previewPath === "/checkout" ? "bg-amber-500 text-black shadow-xs" : "text-muted-foreground hover:text-foreground")}
                >
                  {isAr ? "إنهاء الطلب" : "Checkout"}
                </button>
              </div>

              <div className="flex items-center gap-1 bg-accent/60 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={cn("p-1.5 rounded-lg transition-all", previewMode === "desktop" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground")}
                  title="Desktop View"
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={cn("p-1.5 rounded-lg transition-all", previewMode === "mobile" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground")}
                  title="Mobile View"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIframeKey((k) => k + 1)}
                className="h-8 w-8 rounded-lg"
                title={isAr ? "إعادة تحديث المعاينة" : "Refresh Preview"}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(previewPath, "_blank")}
                className="h-8 w-8 rounded-lg"
                title={isAr ? "فتح الصفحة في تبويب عادي" : "Open in full browser tab"}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 bg-zinc-950 flex items-center justify-center p-2 sm:p-4 overflow-hidden relative">
            <iframe
              key={iframeKey}
              src={previewPath}
              className={cn(
                "h-full border-0 transition-all duration-300 shadow-2xl rounded-xl bg-background",
                previewMode === "mobile" ? "w-[395px] max-h-[780px] rounded-[40px] border-4 border-zinc-800" : "w-full"
              )}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StoreSettings({ onOpenPreview }: { onOpenPreview?: (path?: string) => void }) {
  const { isAr } = useAdminT();
  const storeSettings = useStoreSettingsStore();

  const [form, setForm] = React.useState({
    name: storeSettings.name,
    tagline: storeSettings.tagline,
    description: storeSettings.description,
    email: storeSettings.email,
    phone: storeSettings.phone,
    currency: storeSettings.currency,
    timezone: storeSettings.timezone,
    instagram: storeSettings.instagram,
    instagramHandle: storeSettings.instagramHandle,
    domain: storeSettings.domain,
    address: storeSettings.address,
  });

  React.useEffect(() => {
    setForm({
      name: storeSettings.name,
      tagline: storeSettings.tagline,
      description: storeSettings.description,
      email: storeSettings.email,
      phone: storeSettings.phone,
      currency: storeSettings.currency,
      timezone: storeSettings.timezone,
      instagram: storeSettings.instagram,
      instagramHandle: storeSettings.instagramHandle,
      domain: storeSettings.domain,
      address: storeSettings.address,
    });
  }, [
    storeSettings.name,
    storeSettings.tagline,
    storeSettings.description,
    storeSettings.email,
    storeSettings.phone,
    storeSettings.currency,
    storeSettings.timezone,
    storeSettings.instagram,
    storeSettings.instagramHandle,
    storeSettings.domain,
    storeSettings.address,
  ]);

  const [saving, setSaving] = React.useState(false);

  const handleSave = () => {
    setSaving(true);
    storeSettings.updateSettings(form);
    setTimeout(() => {
      setSaving(false);
      toast.success(isAr ? "تم حفظ إعدادات وتفاصيل المتجر بنجاح ✨" : "Store profile updated & persisted live!");
    }, 250);
  };

  return (
    <Card className="p-6 max-w-3xl shadow-sm border-border/80">
      <h3 className="font-display text-lg font-bold mb-1">
        {isAr ? "ملف المتجر وتفاصيل العلامة التجارية" : "Store Profile & Branding"}
      </h3>
      <p className="text-xs text-muted-foreground mb-6">
        {isAr
          ? "المعلومات الرسمية عن الأتيليه والتواصل التي تظهر في المتجر والهيدر والفوتر بمرونة حية."
          : "Basic information about your atelier rendered dynamically across storefront footer, header, and receipts."}
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-bold">{isAr ? "اسم المتجر (Store Name)" : "Store name"}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1.5 h-10 text-xs font-bold"
            />
          </div>
          <div>
            <Label className="text-xs font-bold">{isAr ? "الشعار النصي (Tagline)" : "Tagline"}</Label>
            <Input
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              className="mt-1.5 h-10 text-xs"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-bold">{isAr ? "وصف المتجر (Description)" : "Description"}</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="mt-1.5 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-bold">{isAr ? "البريد الإلكتروني الرسمي" : "Contact email"}</Label>
            <Input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1.5 h-10 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-bold">{isAr ? "رقم الهاتف / واتساب" : "Phone / WhatsApp"}</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1.5 h-10 text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-bold">{isAr ? "عنوان الأتيليه المقر الرئيسي" : "Atelier Physical Address"}</Label>
          <Input
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="mt-1.5 h-10 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-bold">{isAr ? "رابط انستغرام (Instagram URL)" : "Instagram URL"}</Label>
            <Input
              value={form.instagram}
              onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
              className="mt-1.5 h-10 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs font-bold">{isAr ? "معرّف انستغرام (Handle)" : "Instagram Handle"}</Label>
            <Input
              value={form.instagramHandle}
              onChange={(e) => setForm((f) => ({ ...f, instagramHandle: e.target.value }))}
              className="mt-1.5 h-10 text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-bold">{isAr ? "العملة الأساسية" : "Currency"}</Label>
            <Select
              value={form.currency}
              onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
            >
              <SelectTrigger className="mt-1.5 h-10 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EGP">EGP — الجنيه المصري (LE)</SelectItem>
                <SelectItem value="USD">USD — US Dollar ($)</SelectItem>
                <SelectItem value="EUR">EUR — Euro (€)</SelectItem>
                <SelectItem value="SAR">SAR — الريال السعودي</SelectItem>
                <SelectItem value="AED">AED — الدرهم الإماراتي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold">{isAr ? "المنطقة الزمنية" : "Timezone"}</Label>
            <Select
              value={form.timezone}
              onValueChange={(v) => setForm((f) => ({ ...f, timezone: v }))}
            >
              <SelectTrigger className="mt-1.5 h-10 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Africa/Cairo">Cairo (EET - GMT+2/3)</SelectItem>
                <SelectItem value="Asia/Riyadh">Riyadh (AST - GMT+3)</SelectItem>
                <SelectItem value="Asia/Dubai">Dubai (GST - GMT+4)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold">{isAr ? "النطاق المخصص (Domain)" : "Custom domain"}</Label>
            <Input
              value={form.domain}
              onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
              className="mt-1.5 h-10 text-xs font-mono"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/60">
        {onOpenPreview && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenPreview("/")}
            className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold h-10 text-xs px-4"
          >
            <Eye className="h-4 w-4 mr-1.5 text-amber-500" />
            {isAr ? "معاينة حية للموقع" : "Live Storefront Preview"}
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-10 px-6 ml-auto shadow-md">
          <Save className="h-4 w-4 mr-2" />
          {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}
        </Button>
      </div>
    </Card>
  );
}

function PaymentsSettings({ onOpenPreview }: { onOpenPreview?: (path?: string) => void }) {
  const { isAr } = useAdminT();
  const paymentStore = usePaymentStore();

  const [paymobApiKey, setPaymobApiKey] = React.useState(paymentStore.paymobApiKey);
  const [paymobIntegrationId, setPaymobIntegrationId] = React.useState(paymentStore.paymobIntegrationId);
  const [paymobFrameId, setPaymobFrameId] = React.useState(paymentStore.paymobFrameId);
  const [paymobHmacSecret, setPaymobHmacSecret] = React.useState(paymentStore.paymobHmacSecret);
  const [paymobTestMode, setPaymobTestMode] = React.useState(paymentStore.paymobTestMode);

  const [vodafoneNumber, setVodafoneNumber] = React.useState(paymentStore.vodafoneCashNumber);
  const [instapayAddr, setInstapayAddr] = React.useState(paymentStore.instapayAddress);
  const [instapayPhone, setInstapayPhone] = React.useState(paymentStore.instapayPhone);
  const [instapayName, setInstapayName] = React.useState(paymentStore.instapayAccountName);

  const handleSaveAll = () => {
    paymentStore.updatePaymob({
      paymobApiKey,
      paymobIntegrationId,
      paymobFrameId,
      paymobHmacSecret,
      paymobTestMode,
    });
    paymentStore.updateVodafoneCash({
      vodafoneCashNumber: vodafoneNumber,
    });
    paymentStore.updateInstapay({
      instapayAddress: instapayAddr,
      instapayPhone,
      instapayAccountName: instapayName,
    });
    toast.success(isAr ? "تم حفظ إعدادات بوابات وأرقام التحويل بنجاح! 🎉" : "Payment gateway keys & numbers saved successfully!");
  };

  return (
    <Card className="p-6 max-w-3xl shadow-sm border-border/80 space-y-6">
      <div>
        <h3 className="font-display text-lg font-bold mb-1">
          {isAr ? "بوابة دفع باي موب (PayMob) وإعدادات التحويلات" : "PayMob Gateway & Wallet Transfer Settings"}
        </h3>
        <p className="text-xs text-muted-foreground">
          {isAr
            ? "ربط مادي وتكامل مباشر لبوابة باي موب (Visa/MasterCard/Meeza/Apple Pay) وتعديل أرقام فودافون كاش وإنستاباي التي تظهر للعميل في Checkout."
            : "Direct PayMob API integration keys (Visa, MasterCard, Meeza, Apple Pay) & mobile wallet numbers rendered dynamically at checkout."}
        </p>
      </div>

      {/* PayMob Gateway Card */}
      <div className="p-5 border border-amber-500/30 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">
                {isAr ? "ربط بوابة باي موب (PayMob Gateway)" : "PayMob Gateway (Visa, MasterCard, Meeza, Apple Pay)"}
              </h4>
              <p className="text-xs text-muted-foreground">
                {isAr ? "البوابة المعتمدة للدفع بالبطاقات البنكية في مصر" : "Certified online payment gateway for cards in Egypt"}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            {isAr ? "مفعل ومربوط" : "Connected"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <Label className="text-xs font-bold">{isAr ? "مفتاح API الخاص بباي موب (API Key)" : "PayMob API Key"}</Label>
            <Input
              type="password"
              value={paymobApiKey}
              onChange={(e) => setPaymobApiKey(e.target.value)}
              className="mt-1.5 h-10 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-bold">{isAr ? "رقم التكامل (Integration ID)" : "Integration ID"}</Label>
            <Input
              value={paymobIntegrationId}
              onChange={(e) => setPaymobIntegrationId(e.target.value)}
              className="mt-1.5 h-10 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-bold">{isAr ? "رقم الإطار (Frame ID)" : "Iframe ID"}</Label>
            <Input
              value={paymobFrameId}
              onChange={(e) => setPaymobFrameId(e.target.value)}
              className="mt-1.5 h-10 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-bold">{isAr ? "المفتاح السري (HMAC Secret)" : "HMAC Secret Key"}</Label>
            <Input
              type="password"
              value={paymobHmacSecret}
              onChange={(e) => setPaymobHmacSecret(e.target.value)}
              className="mt-1.5 h-10 text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Label className="text-xs font-bold">{isAr ? "تفعيل بيئة التجربة (PayMob Test Mode)" : "PayMob Sandbox / Test Mode"}</Label>
          <Switch checked={paymobTestMode} onCheckedChange={setPaymobTestMode} />
        </div>
      </div>

      <Separator />

      {/* Vodafone Cash Card */}
      <div className="p-5 border border-border/80 rounded-2xl bg-card space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-red-500 text-white flex items-center justify-center font-bold text-sm">
            🔴
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">
              {isAr ? "محفظة فودافون كاش (Vodafone Cash Wallet)" : "Vodafone Cash Wallet"}
            </h4>
            <p className="text-xs text-muted-foreground">
              {isAr ? "تعديل رقم محفظة التحويل المستهدفة للعملاء" : "Set target receiver wallet number shown at checkout"}
            </p>
          </div>
        </div>

        <div>
          <Label className="text-xs font-bold">{isAr ? "رقم محفظة فودافون كاش (Vodafone Cash Number)" : "Vodafone Cash Receiver Number"} *</Label>
          <Input
            value={vodafoneNumber}
            onChange={(e) => setVodafoneNumber(e.target.value)}
            placeholder="010XXXXXXXX"
            className="mt-1.5 h-11 text-sm font-bold font-mono border-amber-500/40 focus:border-amber-500"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            {isAr ? "يظهر هذا الرقم مباشرة للعميل عند اختيار طريقة فودافون كاش في صفحة إنهاء الطلب." : "This number is dynamically rendered on checkout when customer selects Vodafone Cash."}
          </p>
        </div>
      </div>

      {/* InstaPay Card */}
      <div className="p-5 border border-border/80 rounded-2xl bg-card space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold text-sm">
            ⚡
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">
              {isAr ? "عنوان وشبكة إنستاباي (InstaPay Account)" : "InstaPay Account Details"}
            </h4>
            <p className="text-xs text-muted-foreground">
              {isAr ? "تعديل عنوان الدفع الفوري IPA واسم الحساب" : "Set target IPA address & phone shown at checkout"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-bold">{isAr ? "عنوان الدفع الفوري (InstaPay Address IPA)" : "InstaPay Address (IPA)"} *</Label>
            <Input
              value={instapayAddr}
              onChange={(e) => setInstapayAddr(e.target.value)}
              placeholder="username@instapay"
              className="mt-1.5 h-10 text-xs font-bold font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-bold">{isAr ? "رقم الهاتف المسجل بإنستاباي" : "InstaPay Registered Mobile"}</Label>
            <Input
              value={instapayPhone}
              onChange={(e) => setInstapayPhone(e.target.value)}
              placeholder="010XXXXXXXX"
              className="mt-1.5 h-10 text-xs font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs font-bold">{isAr ? "اسم صاحب الحساب المستلم" : "Account Holder Name"}</Label>
            <Input
              value={instapayName}
              onChange={(e) => setInstapayName(e.target.value)}
              placeholder="SUITED BY MEME Atelier"
              className="mt-1.5 h-10 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        {onOpenPreview && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenPreview("/checkout")}
            className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold h-11 text-xs px-4"
          >
            <Eye className="h-4 w-4 mr-1.5 text-amber-500" />
            {isAr ? "معاينة صفحة إنهاء الطلب 👁️" : "Preview Checkout Page 👁️"}
          </Button>
        )}
        <Button onClick={handleSaveAll} className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-11 px-8 text-sm shadow-md ml-auto">
          <Save className="h-4 w-4 mr-2" />
          {isAr ? "حفظ مفاتيح باي موب وأرقام المحافظ" : "Save PayMob Keys & Wallet Numbers"}
        </Button>
      </div>
    </Card>
  );
}

function ShippingSettings({ onOpenPreview }: { onOpenPreview?: (path?: string) => void }) {
  const { isAr } = useAdminT();
  const zones = useShippingStore((s) => s.zones);
  const addZone = useShippingStore((s) => s.addZone);
  const updateZone = useShippingStore((s) => s.updateZone);
  const deleteZone = useShippingStore((s) => s.deleteZone);
  const resetToDefaults = useShippingStore((s) => s.resetToDefaults);

  const [showAddModal, setShowAddModal] = React.useState(false);
  const [editingZone, setEditingZone] = React.useState<ShippingZone | null>(null);

  const [newForm, setNewForm] = React.useState({
    name: "",
    nameAr: "",
    cost: 100,
    estimatedDays: "2–3 days",
    codAvailable: true,
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim()) {
      toast.error(isAr ? "يرجى كتابة اسم المنطقة" : "Zone name is required");
      return;
    }
    addZone({
      name: newForm.name,
      nameAr: newForm.nameAr || newForm.name,
      cost: Number(newForm.cost),
      estimatedDays: newForm.estimatedDays,
      codAvailable: newForm.codAvailable,
    });
    setShowAddModal(false);
    setNewForm({ name: "", nameAr: "", cost: 100, estimatedDays: "2–3 days", codAvailable: true });
    toast.success(isAr ? "تمت إضافة منطقة الشحن بنجاح!" : "Shipping zone added successfully!");
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;
    updateZone(editingZone.id, {
      name: editingZone.name,
      nameAr: editingZone.nameAr,
      cost: Number(editingZone.cost),
      estimatedDays: editingZone.estimatedDays,
      codAvailable: editingZone.codAvailable,
    });
    setEditingZone(null);
    toast.success(isAr ? "تم تحديث أسعار الشحن بنجاح!" : "Shipping zone updated!");
  };

  return (
    <Card className="p-6 max-w-3xl shadow-sm border-border/80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-bold mb-1">
            {isAr ? "مناطق وأسعار الشحن في مصر" : "Egyptian Shipping Zones & Rates"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "تحكم كامل في أسعار الشحن ومدة التوصيل المخصصة لكل محافظة في مصر."
              : "Full control over shipping fees and estimated delivery times per Egyptian governorate."}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm(isAr ? "إعادة الضبط لأسعار الشحن الافتراضية؟" : "Reset all shipping zones to defaults?")) {
              resetToDefaults();
              toast.success(isAr ? "تمت إعادة الضبط بنجاح" : "Reset shipping zones");
            }
          }}
          className="text-xs text-muted-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          {isAr ? "إعادة الضبط" : "Reset Defaults"}
        </Button>
      </div>

      <div className="space-y-3">
        {zones.map((z) => (
          <div
            key={z.id}
            className="p-4 border border-border/80 rounded-xl bg-card hover:bg-accent/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  {isAr ? z.nameAr : z.name}
                </span>
                {z.codAvailable && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    COD Available
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                ⏱ {z.estimatedDays}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="text-sm font-display font-bold text-amber-600 dark:text-amber-400">
                  LE {z.cost}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isAr ? "سعر ثابت" : "Flat Shipping Rate"}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingZone({ ...z })}
                  title="Edit Zone"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                {zones.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      deleteZone(z.id);
                      toast.success(isAr ? `تم حذف ${z.nameAr}` : `Deleted ${z.name}`);
                    }}
                    title="Delete Zone"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/60">
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-10 px-5 text-xs shadow-md"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isAr ? "+ إضافة منطقة شحن جديدة" : "+ Add New Shipping Zone"}
        </Button>

        {onOpenPreview && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenPreview("/checkout")}
            className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold h-10 text-xs px-4"
          >
            <Eye className="h-4 w-4 mr-1.5 text-amber-500" />
            {isAr ? "معاينة صفحة إنهاء الطلب 👁️" : "Preview Checkout Page 👁️"}
          </Button>
        )}
      </div>

      {/* Add Zone Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold flex items-center gap-2">
              <Truck className="h-5 w-5 text-amber-500" />
              {isAr ? "إضافة منطقة شحن جديدة" : "Add New Shipping Zone"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold">{isAr ? "اسم المنطقة (إنجليزي)" : "Zone Name (English)"} *</Label>
              <Input
                required
                placeholder="e.g. Red Sea & Sinai"
                value={newForm.name}
                onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 h-10 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">{isAr ? "اسم المنطقة (عربي)" : "Zone Name (Arabic)"}</Label>
              <Input
                placeholder="مثال: البحر الأحمر وسيناء"
                value={newForm.nameAr}
                onChange={(e) => setNewForm((f) => ({ ...f, nameAr: e.target.value }))}
                className="mt-1 h-10 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">{isAr ? "تكلفة الشحن (بالجنيه LE)" : "Shipping Fee (LE)"} *</Label>
              <Input
                type="number"
                required
                min={0}
                value={newForm.cost}
                onChange={(e) => setNewForm((f) => ({ ...f, cost: Number(e.target.value) }))}
                className="mt-1 h-10 text-xs font-bold"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">{isAr ? "مدة التوصيل المتوقعة" : "Estimated Delivery Timeframe"}</Label>
              <Input
                placeholder="e.g. 2–3 days"
                value={newForm.estimatedDays}
                onChange={(e) => setNewForm((f) => ({ ...f, estimatedDays: e.target.value }))}
                className="mt-1 h-10 text-xs"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label className="text-xs font-bold">{isAr ? "إتاحة الدفع عند الاستلام (COD)" : "Allow Cash on Delivery"}</Label>
              <Switch
                checked={newForm.codAvailable}
                onCheckedChange={(c) => setNewForm((f) => ({ ...f, codAvailable: c }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                {isAr ? "إضافة المنطقة" : "Add Zone"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Zone Modal */}
      <Dialog open={!!editingZone} onOpenChange={(open) => !open && setEditingZone(null)}>
        {editingZone && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-amber-500" />
                {isAr ? `تعديل منطقة: ${editingZone.nameAr}` : `Edit Zone: ${editingZone.name}`}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 pt-2">
              <div>
                <Label className="text-xs font-bold">{isAr ? "اسم المنطقة (إنجليزي)" : "Zone Name (English)"}</Label>
                <Input
                  value={editingZone.name}
                  onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                  className="mt-1 h-10 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">{isAr ? "اسم المنطقة (عربي)" : "Zone Name (Arabic)"}</Label>
                <Input
                  value={editingZone.nameAr}
                  onChange={(e) => setEditingZone({ ...editingZone, nameAr: e.target.value })}
                  className="mt-1 h-10 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">{isAr ? "تكلفة الشحن (LE)" : "Shipping Fee (LE)"}</Label>
                <Input
                  type="number"
                  min={0}
                  value={editingZone.cost}
                  onChange={(e) => setEditingZone({ ...editingZone, cost: Number(e.target.value) })}
                  className="mt-1 h-10 text-xs font-bold"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">{isAr ? "مدة التوصيل" : "Estimated Delivery"}</Label>
                <Input
                  value={editingZone.estimatedDays}
                  onChange={(e) => setEditingZone({ ...editingZone, estimatedDays: e.target.value })}
                  className="mt-1 h-10 text-xs"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Label className="text-xs font-bold">{isAr ? "إتاحة الدفع عند الاستلام" : "Allow Cash on Delivery"}</Label>
                <Switch
                  checked={editingZone.codAvailable}
                  onCheckedChange={(c) => setEditingZone({ ...editingZone, codAvailable: c })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingZone(null)}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                  {isAr ? "حفظ التغييرات" : "Save Zone"}
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}
