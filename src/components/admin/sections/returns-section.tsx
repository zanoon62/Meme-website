"use client";

import * as React from "react";
import {
  RotateCcw,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  ChevronDown,
  Loader2,
  Package,
  ImageIcon,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";
import { useAdminT } from "@/components/admin/admin-i18n";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ReturnStatus = "pending" | "reviewing" | "approved" | "rejected" | "refunded";

type ReturnRecord = {
  id: string;
  order_id: string | null;
  order_number: string;
  customer_id: string | null;
  customer_email: string;
  reason: string;
  description: string | null;
  image_url: string | null;
  status: ReturnStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_META: Record<
  ReturnStatus,
  { en: string; ar: string; color: string; icon: React.ElementType }
> = {
  pending: {
    en: "Pending",
    ar: "في الانتظار",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    icon: Clock,
  },
  reviewing: {
    en: "Reviewing",
    ar: "قيد المراجعة",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    icon: Eye,
  },
  approved: {
    en: "Approved",
    ar: "موافق عليه",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    icon: CheckCircle2,
  },
  rejected: {
    en: "Rejected",
    ar: "مرفوض",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/30",
    icon: XCircle,
  },
  refunded: {
    en: "Refunded",
    ar: "تم الاسترداد",
    color: "bg-violet-500/10 text-violet-600 border-violet-500/30",
    icon: RotateCcw,
  },
};

const REASON_LABELS: Record<string, { en: string; ar: string }> = {
  wrong_size: { en: "Wrong size", ar: "مقاس غلط" },
  wrong_item: { en: "Wrong item received", ar: "منتج غير صحيح" },
  damaged: { en: "Item arrived damaged", ar: "وصل تالف" },
  not_as_described: { en: "Not as described", ar: "مختلف عن الوصف" },
  changed_mind: { en: "Changed mind", ar: "غيّر رأيه" },
  other: { en: "Other", ar: "أخرى" },
};

const ALL_STATUSES: Array<ReturnStatus | "all"> = [
  "all",
  "pending",
  "reviewing",
  "approved",
  "rejected",
  "refunded",
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export function ReturnsSection() {
  const { t, isAr } = useAdminT();

  const [returns, setReturns] = React.useState<ReturnRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<ReturnStatus | "all">("all");
  const [search, setSearch] = React.useState("");

  const [selectedReturn, setSelectedReturn] = React.useState<ReturnRecord | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newStatus, setNewStatus] = React.useState<ReturnStatus>("pending");
  const [adminNote, setAdminNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // ── Fetch
  const fetchReturns = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/returns?${params}`);
      if (!res.ok) throw new Error("Failed to fetch returns");
      const data = await res.json();
      setReturns(data.returns ?? []);
    } catch {
      toast.error(isAr ? "فشل تحميل المرتجعات" : "Failed to load returns");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, isAr]);

  React.useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  // ── Open detail dialog
  const openDetail = (r: ReturnRecord) => {
    setSelectedReturn(r);
    setNewStatus(r.status);
    setAdminNote(r.admin_note ?? "");
    setDialogOpen(true);
  };

  // ── Save update
  const handleSave = async () => {
    if (!selectedReturn) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/returns/${selectedReturn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, admin_note: adminNote }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(isAr ? "تم تحديث الطلب بنجاح" : "Return updated successfully");
      setDialogOpen(false);
      fetchReturns();
    } catch {
      toast.error(isAr ? "فشل التحديث" : "Failed to update return");
    } finally {
      setSaving(false);
    }
  };

  // ── Filtered list
  const filtered = React.useMemo(() => {
    if (!search.trim()) return returns;
    const q = search.toLowerCase();
    return returns.filter(
      (r) =>
        r.order_number.toLowerCase().includes(q) ||
        r.customer_email.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
    );
  }, [returns, search]);

  // ── KPI counts
  const kpis = React.useMemo(() => {
    const total = returns.length;
    const pending = returns.filter((r) => r.status === "pending").length;
    const approved = returns.filter((r) => r.status === "approved").length;
    const refunded = returns.filter((r) => r.status === "refunded").length;
    return { total, pending, approved, refunded };
  }, [returns]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-amber-500" />
            {isAr ? "المرتجعات" : "Returns"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr
              ? "إدارة طلبات الاسترجاع والاستبدال من العملاء"
              : "Manage customer return and refund requests"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchReturns}
          className="rounded-xl text-xs"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
          <span className="ms-1.5">{isAr ? "تحديث" : "Refresh"}</span>
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: isAr ? "إجمالي" : "Total", value: kpis.total, color: "text-foreground" },
          { label: isAr ? "في الانتظار" : "Pending", value: kpis.pending, color: "text-amber-500" },
          { label: isAr ? "موافق عليه" : "Approved", value: kpis.approved, color: "text-emerald-500" },
          { label: isAr ? "تم الاسترداد" : "Refunded", value: kpis.refunded, color: "text-violet-500" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4 rounded-2xl border-border/60 bg-card/80">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
            <p className={cn("text-2xl font-display font-bold mt-1", kpi.color)}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث برقم الأوردر أو الإيميل..." : "Search by order # or email..."}
            className="ps-9 h-9 rounded-xl text-xs border-border/60"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ReturnStatus | "all")}
        >
          <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all"
                  ? isAr
                    ? "جميع الحالات"
                    : "All statuses"
                  : isAr
                    ? STATUS_META[s as ReturnStatus].ar
                    : STATUS_META[s as ReturnStatus].en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/60 bg-card/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Package className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {isAr ? "لا توجد مرتجعات" : "No return requests found"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-accent/30">
                  <th className="text-start px-4 py-3 font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? "رقم الأوردر" : "Order #"}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                    {isAr ? "الإيميل" : "Email"}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                    {isAr ? "السبب" : "Reason"}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                    {isAr ? "التاريخ" : "Date"}
                  </th>
                  <th className="text-start px-4 py-3 font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? "الحالة" : "Status"}
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((r) => {
                  const meta = STATUS_META[r.status];
                  const StatusIcon = meta.icon;
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-accent/20 transition-colors group"
                    >
                      <td className="px-4 py-3 font-bold text-foreground">
                        {r.order_number}
                        {r.image_url && (
                          <ImageIcon className="inline h-3 w-3 text-muted-foreground ms-1.5" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-[160px] truncate">
                        {r.customer_email}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {isAr
                          ? REASON_LABELS[r.reason]?.ar ?? r.reason
                          : REASON_LABELS[r.reason]?.en ?? r.reason}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold",
                            meta.color
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {isAr ? meta.ar : meta.en}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2.5 rounded-lg text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => openDetail(r)}
                        >
                          {isAr ? "إدارة" : "Manage"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-500" />
              {isAr ? "تفاصيل طلب الاسترجاع" : "Return Request Details"}
            </DialogTitle>
          </DialogHeader>

          {selectedReturn && (
            <div className="space-y-4 mt-2">
              {/* Info rows */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-accent/30 p-3">
                  <p className="text-muted-foreground mb-1">{isAr ? "رقم الأوردر" : "Order #"}</p>
                  <p className="font-bold text-foreground">{selectedReturn.order_number}</p>
                </div>
                <div className="rounded-xl bg-accent/30 p-3">
                  <p className="text-muted-foreground mb-1">{isAr ? "الإيميل" : "Email"}</p>
                  <p className="font-bold text-foreground truncate">{selectedReturn.customer_email}</p>
                </div>
                <div className="rounded-xl bg-accent/30 p-3">
                  <p className="text-muted-foreground mb-1">{isAr ? "السبب" : "Reason"}</p>
                  <p className="font-bold text-foreground">
                    {isAr
                      ? REASON_LABELS[selectedReturn.reason]?.ar ?? selectedReturn.reason
                      : REASON_LABELS[selectedReturn.reason]?.en ?? selectedReturn.reason}
                  </p>
                </div>
                <div className="rounded-xl bg-accent/30 p-3">
                  <p className="text-muted-foreground mb-1">{isAr ? "تاريخ الطلب" : "Submitted"}</p>
                  <p className="font-bold text-foreground">
                    {new Date(selectedReturn.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedReturn.description && (
                <div className="rounded-xl bg-accent/30 p-3 text-xs">
                  <p className="text-muted-foreground mb-1">{isAr ? "وصف المشكلة" : "Description"}</p>
                  <p className="text-foreground leading-relaxed">{selectedReturn.description}</p>
                </div>
              )}

              {/* Image */}
              {selectedReturn.image_url && (
                <div className="rounded-xl overflow-hidden border border-border/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedReturn.image_url}
                    alt="Return item"
                    className="w-full max-h-48 object-cover"
                  />
                  <a
                    href={selectedReturn.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 p-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {isAr ? "فتح الصورة" : "Open full image"}
                  </a>
                </div>
              )}

              {/* Status update */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">
                  {isAr ? "تحديث الحالة" : "Update Status"}
                </Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ReturnStatus)}>
                  <SelectTrigger className="h-10 rounded-xl border-border/60 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_META) as ReturnStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {isAr ? STATUS_META[s].ar : STATUS_META[s].en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Admin note */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {isAr ? "ملاحظة للعميل (اختياري)" : "Note to Customer (optional)"}
                </Label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={
                    isAr
                      ? "سيتم عرض هذه الملاحظة للعميل في صفحة الاسترجاع..."
                      : "This note will be shown to the customer on their returns page..."
                  }
                  className="rounded-xl border-border/60 text-xs min-h-[80px] resize-none"
                  maxLength={1000}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              size="sm"
              className="rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />{isAr ? "جاري الحفظ..." : "Saving..."}</>
              ) : (
                isAr ? "حفظ التغييرات" : "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
