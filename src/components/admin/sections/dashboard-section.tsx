"use client";

import * as React from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  AlertCircle,
  ArrowUpRight,
  ArrowRight,
  Plus,
  BookOpen,
  Eye,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useProductStore } from "@/components/providers/product-store";
import { formatPrice } from "@/lib/format";
import type { AdminSection } from "@/components/admin/admin-shell";

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
      label: "Revenue (30d)",
      value: kpi ? formatPrice(kpi.revenue) : "$—",
      change: kpi ? `${kpi.revenueDelta > 0 ? "+" : ""}${kpi.revenueDelta}%` : "—",
      up: (kpi?.revenueDelta ?? 0) >= 0,
      icon: DollarSign,
      sub: "vs previous 30 days",
    },
    {
      label: "Orders (30d)",
      value: kpi?.orders?.toString() ?? "—",
      change: "+8.2%",
      up: true,
      icon: ShoppingCart,
      sub: "vs previous period",
    },
    {
      label: "Avg order value",
      value: kpi ? formatPrice(kpi.aov) : "$—",
      change: "+3.8%",
      up: true,
      icon: TrendingUp,
      sub: "vs previous period",
    },
    {
      label: "Pending orders",
      value: kpi?.pendingOrders?.toString() ?? "—",
      change: kpi?.pendingOrders ? "Action needed" : "All caught up",
      up: !kpi?.pendingOrders,
      icon: AlertCircle,
      sub: "Awaiting fulfillment",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-foreground text-background rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] opacity-70 mb-1">
            Welcome back
          </p>
          <h3 className="font-display text-2xl tracking-tight">
            Manage your women&apos;s atelier catalog
          </h3>
          <p className="text-sm opacity-80 mt-1.5">
            {products.length} products live ·{" "}
            {products.filter((p) => p.inventory > 0).length} active ·{" "}
            {lowStock.length} low stock
            {outOfStock.length > 0 && ` · ${outOfStock.length} out of stock`}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onNewProduct}
            className="bg-background text-foreground hover:bg-background/90"
          >
            <Plus className="h-4 w-4 mr-1" /> Add product
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onJump?.("guide")}
            className="border-background/30 text-background hover:bg-background/10"
          >
            <BookOpen className="h-4 w-4 mr-1" /> How to use
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="h-9 w-9 rounded-md bg-foreground/5 flex items-center justify-center">
                <k.icon className="h-4 w-4" />
              </div>
              <span
                className={`inline-flex items-center text-xs font-medium ${
                  k.up ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {k.up ? (
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                )}
                {k.change}
              </span>
            </div>
            <p className="text-2xl font-display tracking-tight">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">{k.sub}</p>
          </Card>
        ))}
      </div>

      {/* Revenue chart + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg">Revenue & Orders</h3>
              <p className="text-xs text-muted-foreground">
                Last 30 days · {analytics?.series.length ?? 0} data points
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onJump?.("analytics")}
            >
              View details <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          {loading ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
              Loading analytics…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={analytics?.series ?? []}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
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
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => formatPrice(v)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg">Top products</h3>
              <p className="text-xs text-muted-foreground">By revenue</p>
            </div>
          </div>
          <div className="space-y-3">
            {(analytics?.topProducts ?? []).map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-foreground text-background text-[10px] font-medium flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {p.units} sold
                  </p>
                </div>
                <p className="text-xs font-medium">{formatPrice(p.revenue)}</p>
              </div>
            ))}
            {!analytics?.topProducts?.length && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No sales data yet
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick actions + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="font-display text-base mb-4">Quick actions</h3>
          <div className="space-y-2">
            <button
              onClick={onNewProduct}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent text-sm text-left"
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add new product
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => onJump?.("orders")}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent text-sm text-left"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                View orders
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => onJump?.("inventory")}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent text-sm text-left"
            >
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Manage inventory
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <Link
              href="/"
              target="_blank"
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent text-sm"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                View storefront
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-base">Low stock alerts</h3>
              <p className="text-xs text-muted-foreground">
                Items below 12 units
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onJump?.("inventory")}
            >
              All inventory <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              All products are well-stocked
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lowStock.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent"
                >
                  <div className="w-10 h-10 rounded bg-accent overflow-hidden flex-shrink-0">
                    {p.images[0] && (
                       
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.category}
                    </p>
                  </div>
                  <Badge
                    variant={p.inventory === 0 ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {p.inventory === 0 ? "Out of stock" : `${p.inventory} left`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Catalog summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <Package className="h-4 w-4 text-muted-foreground mb-2" />
          <p className="text-xl font-display">{products.length}</p>
          <p className="text-xs text-muted-foreground">Total products</p>
        </Card>
        <Card className="p-4">
          <TrendingUp className="h-4 w-4 text-muted-foreground mb-2" />
          <p className="text-xl font-display">
            {products.filter((p) => p.isNew).length}
          </p>
          <p className="text-xs text-muted-foreground">New arrivals</p>
        </Card>
        <Card className="p-4">
          <Users className="h-4 w-4 text-muted-foreground mb-2" />
          <p className="text-xl font-display">
            {kpi?.totalCustomers ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground">Customers</p>
        </Card>
        <Card className="p-4">
          <Eye className="h-4 w-4 text-muted-foreground mb-2" />
          <p className="text-xl font-display">
            {kpi?.totalProducts ?? products.length}
          </p>
          <p className="text-xs text-muted-foreground">Live SKUs</p>
        </Card>
      </div>
    </div>
  );
}
