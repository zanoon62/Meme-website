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

export function OrdersSection() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [items, setItems] = React.useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Order | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/orders?status=${statusFilter}&limit=100`
      );
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
        // group items by order_id
        const map: Record<string, OrderItem[]> = {};
        for (const it of data.items ?? []) {
          (map[it.order_id] ??= []).push(it);
        }
        setItems(map);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const lc = search.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(lc) ||
      o.email.toLowerCase().includes(lc)
    );
  });

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <TrendingUp className="h-3 w-3 text-emerald-500" />
          </div>
          <p className="text-xl font-display">{formatPrice(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">Total revenue</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xl font-display">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xl font-display">{shippedCount}</p>
          <p className="text-xs text-muted-foreground">In transit</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xl font-display">{deliveredCount}</p>
          <p className="text-xs text-muted-foreground">Delivered</p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order # or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-background"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-9 bg-background">
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
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Orders table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent/50 border-b border-border/60">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Loading orders…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No orders found
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
    if (!res.ok) throw new Error("Failed to update");
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
          </div>
        </div>

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
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatPrice(Number(order.tax_total))}</span>
          </div>
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

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={saveTracking}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
