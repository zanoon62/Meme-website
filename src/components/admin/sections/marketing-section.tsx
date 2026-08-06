"use client";

import * as React from "react";
import {
  Megaphone,
  Plus,
  Tag,
  Percent,
  Truck,
  Calendar,
  Copy,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAdminT } from "@/components/admin/admin-i18n";
import { formatPrice } from "@/lib/format";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  description_ar?: string | null;
  type: "percent" | "fixed" | "shipping";
  value: number;
  min_subtotal: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
};

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: "c1",
    code: "WELCOME10",
    description: "10% off first order",
    description_ar: "خصم 10% على أول طلب",
    type: "percent",
    value: 10,
    min_subtotal: 0,
    max_uses: null,
    used_count: 0,
    is_active: true,
    starts_at: "2025-01-01T00:00:00Z",
    ends_at: null,
  },
  {
    id: "c2",
    code: "FREESHIP",
    description: "Free shipping on orders over 5,000 EGP",
    description_ar: "شحن مجاني للطلبات فوق 5,000 ج.م",
    type: "shipping",
    value: 0,
    min_subtotal: 5000,
    max_uses: null,
    used_count: 0,
    is_active: true,
    starts_at: "2025-01-01T00:00:00Z",
    ends_at: null,
  },
];

const typeIcon: Record<Coupon["type"], React.ElementType> = {
  percent: Percent,
  fixed: Tag,
  shipping: Truck,
};

const STORAGE_KEY = "meme-admin-promotions-v2";

export function MarketingSection() {
  const [coupons, setCoupons] = React.useState<Coupon[]>(DEFAULT_COUPONS);
  const [creating, setCreating] = React.useState(false);
  const [editingCoupon, setEditingCoupon] = React.useState<Coupon | null>(null);
  const { t, isAr } = useAdminT();

  // Load coupons from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCoupons(JSON.parse(saved));
        return;
      }
    } catch {
      // fallback to default
    }
    setCoupons(DEFAULT_COUPONS);
  }, []);

  const saveCoupons = (next: Coupon[]) => {
    setCoupons(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(isAr ? `تم نسخ "${code}"` : `Copied "${code}"`);
  };

  const deleteCoupon = async (id: string) => {
    const next = coupons.filter((c) => c.id !== id);
    saveCoupons(next);
    try {
      await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    } catch {
      // ignore
    }
    toast.success(t("couponDeleted"));
  };

  const toggleActive = async (coupon: Coupon) => {
    const nextActive = !coupon.is_active;
    const next = coupons.map((c) => (c.id === coupon.id ? { ...c, is_active: nextActive } : c));
    saveCoupons(next);
    try {
      await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextActive }),
      });
    } catch {
      // ignore
    }
    toast.success(nextActive ? (isAr ? "تم تفعيل الكوبون" : "Coupon activated") : (isAr ? "تم إيقاف الكوبون" : "Coupon paused"));
  };

  const updateCoupon = async (updated: Coupon) => {
    const next = coupons.map((c) => (c.id === updated.id ? updated : c));
    saveCoupons(next);
    try {
      await fetch(`/api/admin/coupons/${updated.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: updated.code,
          description: updated.description,
          type: updated.type,
          value: updated.value,
          min_subtotal: updated.min_subtotal,
          max_uses: updated.max_uses,
          is_active: updated.is_active,
        }),
      });
    } catch {
      // ignore
    }
    toast.success(isAr ? `تم تحديث كود الخصم "${updated.code}"` : `Coupon ${updated.code} updated`);
  };

  return (
    <div className="space-y-6">
      {/* Coupons Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl">{t("discountCodes")}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t("manageCoupons")}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> {t("newCoupon")}
        </Button>
      </div>

      {coupons.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground text-sm">
          {t("noCoupons")}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => {
            const Icon = typeIcon[c.type];
            const desc =
              isAr && c.description_ar ? c.description_ar : c.description;
            return (
              <Card key={c.id} className="p-5 relative group">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-9 w-9 rounded-md bg-foreground/5 flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleActive(c)}
                      className="focus:outline-none"
                      title={c.is_active ? "Click to pause" : "Click to activate"}
                    >
                      <Badge
                        variant={c.is_active ? "default" : "secondary"}
                        className="text-[10px] cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {c.is_active ? t("active") : t("paused")}
                      </Badge>
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setEditingCoupon(c)}
                      title={isAr ? "تعديل الكوبون" : "Edit Coupon"}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteCoupon(c.id)}
                      title={t("deleteCoupon")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-mono text-sm font-medium tracking-wider">
                    {c.code}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => copyCode(c.code)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {desc || "—"}
                </p>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("discount")}
                    </span>
                    <span className="font-medium">
                      {c.type === "percent"
                        ? `${c.value}%`
                        : c.type === "fixed"
                        ? formatPrice(c.value)
                        : t("freeShipping")}
                    </span>
                  </div>
                  {c.min_subtotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("minOrderAmount")}
                      </span>
                      <span className="font-medium">
                        {formatPrice(c.min_subtotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("usedCount")}
                    </span>
                    <span className="font-medium">
                      {c.used_count}
                      {c.max_uses ? ` / ${c.max_uses}` : ""}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(c.starts_at).toLocaleDateString()}
                    {c.ends_at &&
                      ` → ${new Date(c.ends_at).toLocaleDateString()}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingCoupon(c)}
                    className="text-amber-500 font-medium hover:underline text-[11px]"
                  >
                    {isAr ? "تعديل" : "Edit"} →
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCouponDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(c) => saveCoupons([c, ...coupons])}
      />

      {editingCoupon && (
        <EditCouponDialog
          coupon={editingCoupon}
          open={!!editingCoupon}
          onClose={() => setEditingCoupon(null)}
          onUpdate={(updated) => {
            updateCoupon(updated);
            setEditingCoupon(null);
          }}
        />
      )}
    </div>
  );
}

function CreateCouponDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (c: Coupon) => void;
}) {
  const { t, isAr } = useAdminT();
  const [form, setForm] = React.useState({
    code: "",
    description: "",
    type: "percent" as Coupon["type"],
    value: 10,
    min_subtotal: 0,
    max_uses: 100,
  });

  const create = async () => {
    if (!form.code) {
      toast.error(isAr ? "كود الخصم مطلوب" : "Coupon code is required");
      return;
    }
    const newCoupon: Coupon = {
      id: "c" + Date.now(),
      code: form.code.toUpperCase(),
      description: form.description,
      type: form.type,
      value: Number(form.value),
      min_subtotal: Number(form.min_subtotal),
      max_uses: Number(form.max_uses) || null,
      used_count: 0,
      is_active: true,
      starts_at: new Date().toISOString(),
      ends_at: null,
    };
    try {
      await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCoupon.code,
          type: newCoupon.type,
          value: newCoupon.value,
          min_subtotal: newCoupon.min_subtotal,
          usage_limit: newCoupon.max_uses,
        }),
      });
    } catch {
      // ignore
    }
    onCreate(newCoupon);
    toast.success(
      isAr
        ? `تم إنشاء كود الخصم "${newCoupon.code}"`
        : `Coupon ${newCoupon.code} created`
    );
    onClose();
    setForm({
      code: "",
      description: "",
      type: "percent",
      value: 10,
      min_subtotal: 0,
      max_uses: 100,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("newCoupon")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">{t("couponCode")}</Label>
            <Input
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              placeholder="ATELIER25"
              className="mt-1 font-mono uppercase"
            />
          </div>
          <div>
            <Label className="text-xs">{t("couponDesc")}</Label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder={isAr ? "خصم 25% على المجموعة" : "25% off collection"}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t("discountType")}</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as Coupon["type"] }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">{t("percentType")}</SelectItem>
                  <SelectItem value="fixed">{t("fixedType")}</SelectItem>
                  <SelectItem value="shipping">{t("shippingType")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("discountValue")}</Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, value: Number(e.target.value) }))
                }
                className="mt-1"
                disabled={form.type === "shipping"}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">
                {t("minOrderAmount")} ({isAr ? "ج.م" : "EGP"})
              </Label>
              <Input
                type="number"
                value={form.min_subtotal}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    min_subtotal: Number(e.target.value),
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Max uses</Label>
              <Input
                type="number"
                value={form.max_uses}
                onChange={(e) =>
                  setForm((f) => ({ ...f, max_uses: Number(e.target.value) }))
                }
                className="mt-1"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={create}>{t("createCoupon")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditCouponDialog({
  coupon,
  open,
  onClose,
  onUpdate,
}: {
  coupon: Coupon;
  open: boolean;
  onClose: () => void;
  onUpdate: (c: Coupon) => void;
}) {
  const { t, isAr } = useAdminT();
  const [form, setForm] = React.useState({
    code: coupon.code,
    description: coupon.description || "",
    type: coupon.type,
    value: coupon.value,
    min_subtotal: coupon.min_subtotal,
    max_uses: coupon.max_uses ?? 0,
    is_active: coupon.is_active,
  });

  const save = () => {
    if (!form.code.trim()) {
      toast.error(isAr ? "كود الخصم مطلوب" : "Coupon code is required");
      return;
    }
    onUpdate({
      ...coupon,
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      type: form.type,
      value: Number(form.value),
      min_subtotal: Number(form.min_subtotal),
      max_uses: Number(form.max_uses) || null,
      is_active: form.is_active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isAr ? `تعديل كود الخصم (${coupon.code})` : `Edit Promo Code (${coupon.code})`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">{t("couponCode")}</Label>
            <Input
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              placeholder="ATELIER25"
              className="mt-1 font-mono uppercase"
            />
          </div>
          <div>
            <Label className="text-xs">{t("couponDesc")}</Label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder={isAr ? "وصف الخصم..." : "Discount description..."}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t("discountType")}</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as Coupon["type"] }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">{t("percentType")}</SelectItem>
                  <SelectItem value="fixed">{t("fixedType")}</SelectItem>
                  <SelectItem value="shipping">{t("shippingType")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("discountValue")}</Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, value: Number(e.target.value) }))
                }
                className="mt-1"
                disabled={form.type === "shipping"}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">
                {t("minOrderAmount")} ({isAr ? "ج.م" : "EGP"})
              </Label>
              <Input
                type="number"
                value={form.min_subtotal}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    min_subtotal: Number(e.target.value),
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Max uses</Label>
              <Input
                type="number"
                value={form.max_uses}
                onChange={(e) =>
                  setForm((f) => ({ ...f, max_uses: Number(e.target.value) }))
                }
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Label className="text-xs font-medium">{isAr ? "تفعيل الكوبون" : "Active Status"}</Label>
            <Select
              value={form.is_active ? "active" : "paused"}
              onValueChange={(v) => setForm((f) => ({ ...f, is_active: v === "active" }))}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("active")}</SelectItem>
                <SelectItem value="paused">{t("paused")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={save} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
            {isAr ? "حفظ التغييرات" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
