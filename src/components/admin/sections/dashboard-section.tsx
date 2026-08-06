"use client";

import * as React from "react";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Package,
  AlertCircle,
  ArrowUpRight,
  ArrowRight,
  Plus,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useProductStore } from "@/components/providers/product-store";
import { formatPrice } from "@/lib/format";
import type { AdminSection } from "@/components/admin/admin-shell";
import { useAdminT } from "@/components/admin/admin-i18n";

type Analytics = {
  kpis: {
    revenue: number;
    revenueDelta: number;
    orders: number;
    aov: number;
    totalProducts: number;
    totalCustomers: number;
    pendingOrders: number;
  };
  series: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; units: number; revenue: number }[];
  generatedAt: string;
};

export function DashboardSection({
  onNewProduct,
  onJump,
}: {
  onNewProduct?: () => void;
  onJump?: (s: AdminSection) => void;
}) {
  const products = useProductStore((s) => s.products);
  const [analytics, setAnalytics] = React.useState<Analytics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { t, isAr } = useAdminT();

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setAnalytics(data);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpi = analytics?.kpis;
  const lowStock = products.filter((p) => p.inventory <= 12);
  const outOfStock = products.filter((p) => p.inventory === 0);

  const kpis = [
    {
      label: t("revenue30d"),
      value: kpi ? formatPrice(kpi.revenue) : "—",
      change: kpi ? `${kpi.revenueDelta > 0 ? "+" : ""}${kpi.revenueDelta}%` : "—",
      up: (kpi?.revenueDelta ?? 0) >= 0,
      icon: DollarSign,
      sub: t("vsPrev30"),
    },
    {
      label: t("orders30d"),
      value: kpi ? kpi.orders.toString() : "—",
      change: kpi ? (kpi.orders > 0 ? isAr ? "طلبات مكتملة" : "Completed orders" : "—") : "—",
      up: (kpi?.orders ?? 0) >= 0,
      icon: ShoppingCart,
      sub: t("vsPrevPeriod"),
    },
    {
      label: t("avgOrderValue"),
      value: kpi ? (kpi.aov > 0 ? formatPrice(kpi.aov) : "—") : "—",
      change: "—",
      up: true,
      icon: TrendingUp,
      sub: t("vsPrevPeriod"),
    },
    {
      label: t("pendingOrders"),
      value: kpi?.pendingOrders?.toString() ?? "—",
      change: kpi ? (kpi.pendingOrders ? t("actionNeeded") : t("allCaughtUp")) : "—",
      up: !kpi?.pendingOrders,
      icon: AlertCircle,
      sub: isAr ? "بانتظار الشحن" : "Awaiting fulfillment",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-950 to-black dark:from-zinc-950 dark:via-zinc-900 dark:to-black text-white rounded-3xl p-6 sm:p-8 border border-zinc-800/80 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500" />
        <div className="relative z-10">
          <p className="text-[11px] uppercase tracking-[0.25em] text-amber-400 font-bold mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {t("welcomeBack")}
          </p>
          <h3 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-white">
            {t("manageCatalog")}
          </h3>
          <p className="text-sm text-zinc-300 mt-2 font-medium flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white font-bold text-xs border border-white/10">
              {products.length} {t("productsLive")}
            </span>
            ·
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
              {products.filter((p) => p.inventory > 0).length} {t("active")}
            </span>
            ·
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
              {lowStock.length} {t("lowStock")}
            </span>
            {outOfStock.length > 0 && (
              <>
                ·
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30">
                  {outOfStock.length} {t("outOfStock")}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2.5 flex-shrink-0 relative z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onJump?.("guide")}
            className="border-zinc-700/80 text-white bg-zinc-800/80 hover:bg-zinc-700 hover:text-white font-semibold rounded-xl backdrop-blur-md hover:scale-105 transition-all"
          >
            <BookOpen className="h-4 w-4 mr-1.5 text-amber-400" /> {t("guide")}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5 border border-border/80 bg-card/80 backdrop-blur-xl shadow-xs hover:shadow-xl hover:border-amber-500/30 dark:hover:border-amber-400/30 transition-all duration-300 rounded-3xl space-y-3 group">
            <div className="flex items-center justify-between">
              <div className="h-11 w-11 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center border border-amber-500/20 text-amber-500 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                <k.icon className="h-5 w-5" />
              </div>
              <span
                className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${
                  k.up
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                }`}
              >
                {k.up ? (
                  <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                )}
                {k.change}
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{k.label}</p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight mt-1">{k.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">{k.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 border border-border/80 bg-card rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                {isAr ? "تحليلات الإيرادات والطلبات" : "Revenue & Orders Analytics"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr ? "آخر 30 يوماً · بيانات المتجر الحية" : "Last 30 days · Live store data"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onJump?.("analytics")}
              className="text-xs font-bold text-amber-500 hover:text-amber-600"
            >
              {isAr ? "التفاصيل" : "View details"} <ArrowRight className="h-3.5 w-3.5 mr-1" />
            </Button>
          </div>
          {loading ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
              {t("loading")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={analytics?.series ?? []}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(v: number) => formatPrice(v)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#d4af37"
                  strokeWidth={2.5}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Top Products */}
        <Card className="p-6 border border-border/80 bg-card rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                {isAr ? "الأكثر مبيعاً" : "Top Products"}
              </h3>
              <p className="text-xs text-muted-foreground">{isAr ? "حسب إجمالي المبيعات" : "By total revenue"}</p>
            </div>
          </div>
          <div className="space-y-4">
            {(analytics?.topProducts ?? []).map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/40 transition-colors">
                <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/20">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {p.units} {isAr ? "قطعة مباعة" : "sold"}
                  </p>
                </div>
                <p className="text-xs font-bold text-foreground">{formatPrice(p.revenue)}</p>
              </div>
            ))}
            {!analytics?.topProducts?.length && (
              <p className="text-xs text-muted-foreground py-6 text-center">
                {isAr ? "لا توجد بيانات مبيعات بعد" : "No sales data yet"}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 border border-border/80 bg-card rounded-2xl shadow-sm">
          <h3 className="font-display font-bold text-base mb-4 text-foreground">
            {isAr ? "إجراءات سريعة" : "Quick Actions"}
          </h3>
          <div className="space-y-2">
            <button
              onClick={onNewProduct}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-accent/60 text-xs font-bold text-foreground transition-colors border border-border/40"
            >
              <span className="flex items-center gap-2.5">
                <Plus className="h-4 w-4 text-amber-500" />
                {t("newProduct")}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => onJump?.("products")}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-accent/60 text-xs font-bold text-foreground transition-colors border border-border/40"
            >
              <span className="flex items-center gap-2.5">
                <Package className="h-4 w-4 text-amber-500" />
                {isAr ? "إدارة الكتالوج" : "Manage Products"}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </Card>

        {/* Low Stock Warning Card */}
        <Card className="p-6 lg:col-span-2 border border-border/80 bg-card rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-500" />
              {isAr ? "تنبيهات المخزون المنخفض" : "Low Stock Alerts"}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onJump?.("inventory")}
              className="text-xs font-bold text-amber-500 hover:text-amber-600"
            >
              {isAr ? "المخزون الكامل" : "View Inventory"}
            </Button>
          </div>

          {lowStock.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              {isAr ? "المخزون بفيّر وصحي 100% ✨" : "All products have healthy stock levels ✨"}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lowStock.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/40 border border-border/40">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.category}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                    {p.inventory} {isAr ? "متبقي" : "left"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
