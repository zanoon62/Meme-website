"use client";

import * as React from "react";
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
} from "recharts";
import { Card } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, Eye } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useAdminT } from "../admin-i18n";

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
};

export function AnalyticsSection() {
  const { t } = useAdminT();
  const [data, setData] = React.useState<Analytics | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const kpi = data?.kpis;

  const kpis = [
    {
      label: t("totalRevenue"),
      value: kpi ? (kpi.revenue > 0 ? formatPrice(kpi.revenue) : "\u2014") : "\u2014",
      delta: kpi && kpi.revenueDelta !== 0 ? `${kpi.revenueDelta > 0 ? "+" : ""}${kpi.revenueDelta}%` : "\u2014",
      icon: DollarSign,
    },
    {
      label: t("orders"),
      value: kpi ? kpi.orders.toString() : "\u2014",
      delta: "\u2014",
      icon: ShoppingCart,
    },
    {
      label: t("avgOrderValue"),
      value: kpi ? (kpi.aov > 0 ? formatPrice(kpi.aov) : "\u2014") : "\u2014",
      delta: "\u2014",
      icon: TrendingUp,
    },
    {
      label: t("conversionRate"),
      value: "\u2014",
      delta: "\u2014",
      icon: Eye,
    },
  ];

  const hasSeriesData = (data?.series?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="h-9 w-9 rounded-md bg-foreground/5 flex items-center justify-center">
                <k.icon className="h-4 w-4" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {k.delta}
              </span>
            </div>
            <p className="text-2xl font-display tracking-tight">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </Card>
        ))}
      </div>

      {/* Revenue over time */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-lg">{t("revenueTrend")}</h3>
            <p className="text-xs text-muted-foreground">{t("last30Days")}</p>
          </div>
        </div>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
            {t("loading")}
          </div>
        ) : !hasSeriesData ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center gap-2">
            <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground font-medium">{t("noRevenueData")}</p>
            <p className="text-xs text-muted-foreground/70">{t("revenueAppearHere")}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data?.series ?? []}>
              <defs>
                <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
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
                tickFormatter={(v) => `${v / 1000}k`}
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
                fill="url(#rev2)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Orders per day */}
      <Card className="p-6">
        <h3 className="font-display text-lg mb-1">{t("ordersPerDay")}</h3>
        <p className="text-xs text-muted-foreground mb-4">{t("last30Days")}</p>
        {loading ? (
          <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
            {t("loading")}
          </div>
        ) : !hasSeriesData ? (
          <div className="h-[240px] flex flex-col items-center justify-center text-center gap-2">
            <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground font-medium">{t("noOrdersYet")}</p>
            <p className="text-xs text-muted-foreground/70">{t("orderVolumeAppearHere")}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.series ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickFormatter={(d) => d.slice(5)}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="orders" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
