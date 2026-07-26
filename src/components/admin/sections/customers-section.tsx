"use client";

import * as React from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Download,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/format";

type Customer = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  accepts_marketing: boolean;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
  created_at: string;
};

function tierFor(spent: number): { label: string; color: string } {
  if (spent >= 5000) return { label: "Platinum", color: "bg-neutral-900 text-white" };
  if (spent >= 2000) return { label: "Gold", color: "bg-amber-100 text-amber-800" };
  if (spent >= 500) return { label: "Silver", color: "bg-slate-100 text-slate-800" };
  return { label: "New", color: "bg-emerald-100 text-emerald-800" };
}

export function CustomersSection() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/customers?q=" + encodeURIComponent(search));
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [search]);

  const totalSpent = customers.reduce((s, c) => s + Number(c.total_spent), 0);
  const avgOrderValue =
    customers.length > 0
      ? customers.reduce((s, c) => s + Number(c.total_spent), 0) /
        Math.max(
          1,
          customers.reduce((s, c) => s + c.total_orders, 0)
        )
      : 0;
  const marketingOptIn = customers.filter((c) => c.accepts_marketing).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <Users className="h-4 w-4 text-muted-foreground mb-2" />
          <p className="text-xl font-display">{customers.length}</p>
          <p className="text-xs text-muted-foreground">Total customers</p>
        </Card>
        <Card className="p-4">
          <DollarSign className="h-4 w-4 text-muted-foreground mb-2" />
          <p className="text-xl font-display">{formatPrice(totalSpent)}</p>
          <p className="text-xs text-muted-foreground">Lifetime revenue</p>
        </Card>
        <Card className="p-4">
          <TrendingUp className="h-4 w-4 text-muted-foreground mb-2" />
          <p className="text-xl font-display">{formatPrice(avgOrderValue)}</p>
          <p className="text-xs text-muted-foreground">Avg order value</p>
        </Card>
        <Card className="p-4">
          <Mail className="h-4 w-4 text-muted-foreground mb-2" />
          <p className="text-xl font-display">{marketingOptIn}</p>
          <p className="text-xs text-muted-foreground">Marketing opt-in</p>
        </Card>
      </div>

      <div className="flex justify-between items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-background"
          />
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent/50 border-b border-border/60">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3 text-right">Spent</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Last order</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Loading customers…
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const tier = tierFor(Number(c.total_spent));
                  const name =
                    [c.first_name, c.last_name].filter(Boolean).join(" ") ||
                    c.email.split("@")[0];
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-border/40 hover:bg-accent/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-[10px] bg-foreground/5">
                              {name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-medium">{name}</p>
                            {c.accepts_marketing && (
                              <Badge variant="secondary" className="text-[9px] h-4">
                                Opted in
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs">{c.email}</p>
                        {c.phone && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" /> {c.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3" />
                          {c.total_orders}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatPrice(Number(c.total_spent))}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${tier.color}`}
                        >
                          {tier.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {c.last_order_at
                          ? new Date(c.last_order_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
