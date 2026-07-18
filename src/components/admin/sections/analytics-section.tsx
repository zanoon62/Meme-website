"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, Eye } from "lucide-react";
import { formatPrice } from "@/lib/format";

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

const CATEGORY_DATA = [
  { name: "Tailoring", value: 35, color: "#0d0d0d" },
  { name: "Outerwear", value: 22, color: "#525252" },
  { name: "Knitwear", value: 18, color: "#a3a3a3" },
  { name: "Dresses", value: 14, color: "#d4d4d4" },
  { name: "Footwear", value: 7, color: "#e5e5e5" },
  { name: "Other", value: 4, color: "#f5f5f5" },
];

const TRAFFIC_DATA = [
  { day: "Mon", direct: 4200, organic: 3100, social: 2100 },
  { day: "Tue", direct: 4800, organic: 3400, social: 2400 },
  { day: "Wed", direct: 5100, organic: 3700, social: 2800 },
  { day: "Thu", direct: 4900, organic: 3500, social: 2600 },
  { day: "Fri", direct: 5800, organic: 4200, social: 3200 },
  { day: "Sat", direct: 6400, organic: 4500, social: 3800 },
  { day: "Sun", direct: 5600, organic: 3900, social: 3100 },
];

export function AnalyticsSection() {
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
      label: "Total Revenue",
      value: kpi ? formatPrice(kpi.revenue) : "$—",
      delta: kpi ? `${kpi.revenueDelta > 0 ? "+" : ""}${kpi.revenueDelta}%` : "—",
      icon: DollarSign,
    },
    {
      label: "Orders",
      value: kpi?.orders?.toString() ?? "—",
      delta: "+8.2%",
      icon: ShoppingCart,
    },
    {
      label: "Avg Order Value",
      value: kpi ? formatPrice(kpi.aov) : "$—",
      delta: "+3.8%",
      icon: TrendingUp,
    },
    {
      label: "Conversion Rate",
      value: "3.42%",
      delta: "+0.4%",
      icon: Eye,
    },
  ];

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
              <span className="text-xs text-emerald-600 font-medium">
                {k.delta}
              </span>
            </div>
            <p className="text-2xl font-display tracking-tight">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </Card>
        ))}
      </div>

      {/* Revenue + orders over time */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-lg">Revenue trend</h3>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </div>
        </div>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
            Loading…
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
                fill="url(#rev2)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Orders per day */}
        <Card className="p-6">
          <h3 className="font-display text-lg mb-1">Orders per day</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 30 days</p>
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
        </Card>

        {/* Category distribution */}
        <Card className="p-6">
          <h3 className="font-display text-lg mb-1">Revenue by category</h3>
          <p className="text-xs text-muted-foreground mb-4">All time</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={CATEGORY_DATA}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {CATEGORY_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => `${v}%`}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Traffic by source */}
      <Card className="p-6">
        <h3 className="font-display text-lg mb-1">Traffic by source</h3>
        <p className="text-xs text-muted-foreground mb-4">Last 7 days</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={TRAFFIC_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
            <Line type="monotone" dataKey="direct" stroke="#0d0d0d" strokeWidth={2} />
            <Line type="monotone" dataKey="organic" stroke="#737373" strokeWidth={2} />
            <Line type="monotone" dataKey="social" stroke="#d4d4d4" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
