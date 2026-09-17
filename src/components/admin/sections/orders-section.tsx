"use client";

import * as React from "react";
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Package,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { useAdminT } from "@/components/admin/admin-i18n";
import { useAdminRealtimeEvent } from "@/lib/realtime/use-admin-socket";
import { downloadCsv } from "@/lib/csv-export";

type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

type Order = {
  id: string;
  order_number: string;
  email: string;
  status: OrderStatus;
  payment_status: string;
  fulfillment_status: string;
  payment_method: string | null;
  payment_proof_url: string | null;
  payment_sender_info: string | null;
  payment_confirmed_at: string | null;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  currency: string;
  coupon_code: string | null;
  shipping_address: Record<string, unknown> | null;
  tracking_number: string | null;
  customer_note: string | null;
  staff_note: string | null;
  placed_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  items?: OrderItem[];
};

type OrderItem = {
  id: string;
  product_name: string;
  variant_color: string | null;
  variant_size: string | null;
  unit_price: number;
  quantity: number;
  total: number;
  product_image: string | null;
};

const STATUS_OPTIONS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const statusColor: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  fulfilled: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
  refunded: "bg-neutral-100 text-neutral-800",
};

// Module-level cache keyed by status+page, so switching admin sections and
// coming back to Orders shows the last-fetched page instantly.
const ordersCache = new Map<
  string,
  { orders: Order[]; items: Record<string, OrderItem[]>; total: number; fetchedAt: number }
>();
const ORDERS_STALE_MS = 30_000;
const PAGE_SIZE = 50;

export function OrdersSection() {
  const { t } = useAdminT();
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(0);
  const cacheKey = `${statusFilter}:${page}`;
  const cached = ordersCache.get(cacheKey);
  const [orders, setOrders] = React.useState<Order[]>(cached?.orders ?? []);
  const [items, setItems] = React.useState<Record<string, OrderItem[]>>(cached?.items ?? {});
  const [total, setTotal] = React.useState(cached?.total ?? 0);
  const [loading, setLoading] = React.useState(!cached);
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Order | null>(null);

  const load = React.useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/orders?status=${statusFilter}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`
      );
      if (res.ok) {
        const data = await res.json();
        const nextOrders: Order[] = data.orders ?? [];
        const nextTotal: number = data.total ?? nextOrders.length;
        const map: Record<string, OrderItem[]> = {};
        for (const it of data.items ?? []) {
          (map[it.order_id] ??= []).push(it);
        }
        setOrders(nextOrders);
        setItems(map);
        setTotal(nextTotal);
        ordersCache.set(cacheKey, { orders: nextOrders, items: map, total: nextTotal, fetchedAt: Date.now() });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, cacheKey]);

  React.useEffect(() => {
    const entry = ordersCache.get(cacheKey);
    if (entry) {
      // Show cached data immediately; revalidate in the background if stale.
      setOrders(entry.orders);
      setItems(entry.items);
      setTotal(entry.total);
      setLoading(false);
      if (Date.now() - entry.fetchedAt > ORDERS_STALE_MS) {
        load({ silent: true });
      }
    } else {
      load();
    }
  }, [cacheKey, load]);

  // Reset to page 0 whenever the status filter changes.
  React.useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  // Live updates — a new order or a status change (e.g. another admin tab
  // confirming payment) invalidates the cache and silently revalidates
  // the currently visible page instead of waiting for a manual refresh.
  const invalidateAndReload = React.useCallback(() => {
    ordersCache.delete(cacheKey);
    load({ silent: true });
  }, [cacheKey, load]);
  useAdminRealtimeEvent("order.created", invalidateAndReload);
  useAdminRealtimeEvent("order.status_changed", invalidateAndReload);

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const lc = search.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(lc) ||
      o.email.toLowerCase().includes(lc)
    );
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  const [exporting, setExporting] = React.useState(false);
  const exportCsv = async () => {
    setExporting(true);
    try {
      // Export every order matching the current filter, not just the
      // currently-loaded page — the whole point of an export.
      const res = await fetch(`/api/admin/orders?status=${statusFilter}&limit=5000&offset=0`);
      if (!res.ok) throw new Error("Failed to fetch orders for export");
      const data = await res.json();
      const rows: Order[] = data.orders ?? [];
      if (rows.length === 0) {
        toast.error("No orders to export");
        return;
      }
      downloadCsv(
        `orders-${statusFilter}-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Order #", "Email", "Status", "Payment status", "Payment method", "Subtotal", "Discount", "Shipping", "Total", "Currency", "Placed at"],
        rows.map((o) => [
          o.order_number,
          o.email,
          o.status,
          o.payment_status,
          o.payment_method ?? "",
          o.subtotal,
          o.discount_total,
          o.shipping_total,
          o.total,
          o.currency,
          o.placed_at,
        ]),
      );
      toast.success(`Exported ${rows.length} orders`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 sm:p-4 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <TrendingUp className="h-3 w-3 text-emerald-500" />
          </div>
          <p className="text-base sm:text-xl font-display truncate">{formatPrice(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">Total revenue</p>
        </Card>
        <Card className="p-3 sm:p-4 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-base sm:text-xl font-display">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </Card>
        <Card className="p-3 sm:p-4 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-base sm:text-xl font-display">{shippedCount}</p>
          <p className="text-xs text-muted-foreground">In transit</p>
        </Card>
        <Card className="p-3 sm:p-4 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-base sm:text-xl font-display">{deliveredCount}</p>
          <p className="text-xs text-muted-foreground">Delivered</p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order # or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 sm:h-9 bg-background"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 h-10 sm:h-9 bg-background">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="h-10 sm:h-9 shrink-0" onClick={exportCsv} disabled={exporting}>
          <Download className="h-4 w-4 mr-1" /> {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      {/* Orders — card list on phones, table from `md` up. A 7-column table
          can't be read on a 390px screen, so small viewports get a stacked
          card per order with the same tap targets. */}
      <Card className="overflow-hidden md:hidden divide-y divide-border/40">
        {loading ? (
          <p className="text-center py-12 text-sm text-muted-foreground">{t("loading")}</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
            {t("noResults")}
          </div>
        ) : (
          filtered.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelected(o)}
              className="w-full text-left p-4 active:bg-accent/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-xs font-medium">{o.order_number}</span>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusColor[o.status]}`}
                >
                  {o.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 truncate">{o.email}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-muted-foreground">
                  {new Date(o.placed_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" · "}
                  <span className="capitalize">{o.payment_status}</span>
                </span>
                <span className="text-sm font-medium">
                  {formatPrice(Number(o.total), o.currency)}
                </span>
              </div>
            </button>
          ))
        )}
        <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
          <span>
            {total === 0 ? "0 orders" : `${page * PAGE_SIZE + 1}–${Math.min(total, (page + 1) * PAGE_SIZE)} of ${total}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Prev
            </Button>
            <span className="font-medium">{page + 1}/{totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Orders table (md and up) */}
      <Card className="overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent/50 border-b border-border/60">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">{t("orderId")}</th>
                <th className="px-4 py-3">{t("customer")}</th>
                <th className="px-4 py-3">{t("date")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3">{t("payment")}</th>
                <th className="px-4 py-3 text-right">{t("total")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    {t("loading")}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    {t("noResults")}
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-border/40 hover:bg-accent/30 cursor-pointer"
                    onClick={() => setSelected(o)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {o.order_number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium">{o.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(o.placed_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusColor[o.status]}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize text-muted-foreground">
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatPrice(Number(o.total), o.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelected(o)}>
                            <Eye className="mr-2 h-3.5 w-3.5" /> View details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {o.payment_status === "awaiting" && o.payment_method !== "cod" && (
                            <DropdownMenuItem
                              className="text-emerald-600"
                              onClick={() =>
                                updateOrderStatus(o.id, "paid", load)
                              }
                            >
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Confirm payment
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              updateOrderStatus(o.id, "shipped", load)
                            }
                          >
                            <Truck className="mr-2 h-3.5 w-3.5" /> Mark as shipped
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateOrderStatus(o.id, "delivered", load)
                            }
                          >
                            <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Mark delivered
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-rose-600"
                            onClick={() =>
                              updateOrderStatus(o.id, "cancelled", load)
                            }
                          >
                            <XCircle className="mr-2 h-3.5 w-3.5" /> Cancel order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — fetches one page (50 rows) at a time from the server
            rather than loading the whole orders table, so this stays fast
            no matter how many orders the store accumulates. */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 text-xs text-muted-foreground">
          <span>
            {total === 0 ? "0 orders" : `${page * PAGE_SIZE + 1}–${Math.min(total, (page + 1) * PAGE_SIZE)} of ${total}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="font-medium">{page + 1} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Order detail dialog */}
      <OrderDetailDialog
        order={selected}
        items={selected ? items[selected.id] ?? [] : []}
        onClose={() => setSelected(null)}
        onUpdated={load}
      />
    </div>
  );
}

async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  reload: () => void
) {
  try {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    // Surface the server's real reason (auth, validation, DB) instead of a
    // generic "Failed" — a silent 400 here is what made this look like the
    // button simply did nothing.
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Update failed (HTTP ${res.status})`);
    toast.success(`Order marked as ${status}`);
    reload();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Failed");
  }
}

function OrderDetailDialog({
  order,
  items,
  onClose,
  onUpdated,
}: {
  order: Order | null;
  items: OrderItem[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [tracking, setTracking] = React.useState("");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    setTracking(order?.tracking_number ?? "");
    setNote(order?.staff_note ?? "");
  }, [order]);

  if (!order) return null;

  const saveTracking = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_number: tracking,
          staff_note: note,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Order updated");
      onUpdated();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const addr = order.shipping_address as Record<string, string> | null;

  return (
    <Dialog open={!!order} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-foreground/5 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="font-mono text-base">
                {order.order_number}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Placed{" "}
                {new Date(order.placed_at).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Status
            </p>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusColor[order.status]}`}
            >
              {order.status}
            </span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Payment
            </p>
            <span className="text-xs capitalize">{order.payment_status}</span>
            {order.payment_method && (
              <span className="text-xs text-muted-foreground capitalize"> · {order.payment_method}</span>
            )}
          </div>
        </div>

        {/* Transfer proof review — InstaPay / Vodafone Cash orders awaiting confirmation */}
        {order.payment_method !== "cod" && (order.payment_proof_url || order.payment_sender_info) && (
          <div className="mt-4 p-3 border border-amber-500/30 rounded-lg bg-amber-500/5 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
              Transfer proof
            </p>
            {order.payment_sender_info && (
              <p className="text-xs">
                Sender: <span className="font-mono font-medium">{order.payment_sender_info}</span>
              </p>
            )}
            {order.payment_proof_url && (
              <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={order.payment_proof_url}
                  alt="Transfer proof screenshot"
                  className="max-h-56 rounded-md border border-border/60 object-contain"
                />
              </a>
            )}
            {order.payment_status === "awaiting" && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                onClick={async () => {
                  await updateOrderStatus(order.id, "paid", onUpdated);
                  onClose();
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Confirm payment received
              </Button>
            )}
            {order.payment_confirmed_at && (
              <p className="text-[10px] text-muted-foreground">
                Confirmed {new Date(order.payment_confirmed_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
          </div>
        )}

        {/* Items */}
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Items
          </p>
          <div className="border border-border/60 rounded-md divide-y divide-border/40">
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center">
                No line items recorded
              </p>
            ) : (
              items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 p-3">
                  <div className="w-12 h-12 rounded bg-accent overflow-hidden flex-shrink-0">
                    {it.product_image && (
                       
                      <img
                        src={it.product_image}
                        alt={it.product_name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{it.product_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {it.variant_color} · {it.variant_size} · Qty {it.quantity}
                    </p>
                  </div>
                  <p className="text-xs font-medium">
                    {formatPrice(Number(it.total))}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="mt-4 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(Number(order.subtotal))}</span>
          </div>
          {Number(order.discount_total) > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</span>
              <span>-{formatPrice(Number(order.discount_total))}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{formatPrice(Number(order.shipping_total))}</span>
          </div>
          {Number(order.tax_total) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatPrice(Number(order.tax_total))}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-border/60 font-medium text-sm">
            <span>Total</span>
            <span>{formatPrice(Number(order.total), order.currency)}</span>
          </div>
        </div>

        {/* Shipping address */}
        {addr && (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Ship to
            </p>
            <p className="text-xs">
              {addr.first_name} {addr.last_name}
              <br />
              {addr.address1}
              {addr.address2 ? `, ${addr.address2}` : ""}
              <br />
              {addr.city}, {addr.state} {addr.postal_code}
              <br />
              {addr.country}
            </p>
          </div>
        )}

        {/* Staff controls */}
        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-xs">Order status</Label>
            <Select
              value={order.status}
              onValueChange={async (v) => {
                await updateOrderStatus(order.id, v as OrderStatus, onUpdated);
                onClose();
              }}
            >
              <SelectTrigger className="mt-1 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.filter((s) => s.value !== "all").map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">
              Changing to Paid confirms payment and emails the customer.
            </p>
          </div>
          <div>
            <Label className="text-xs">Tracking number</Label>
            <Input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="e.g. 1Z999AA10123456784"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Internal note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Staff notes (not visible to customer)"
              rows={2}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="mt-4 flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
          <Button onClick={saveTracking} className="w-full sm:w-auto">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
