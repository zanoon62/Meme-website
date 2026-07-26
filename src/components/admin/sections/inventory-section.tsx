"use client";

import * as React from "react";
import {
  Boxes,
  Search,
  AlertTriangle,
  Package,
  TrendingDown,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProductStore } from "@/components/providers/product-store";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export function InventorySection() {
  const products = useProductStore((s) => s.products);
  const updateProduct = useProductStore((s) => s.updateProduct);
  const [search, setSearch] = React.useState("");
  const [edits, setEdits] = React.useState<Record<string, number>>({});

  const filtered = products.filter((p) =>
    !search ? true : p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnits = products.reduce((s, p) => s + p.inventory, 0);
  const lowStock = products.filter(
    (p) => p.inventory > 0 && p.inventory <= 12
  ).length;
  const outOfStock = products.filter((p) => p.inventory === 0).length;
  const inventoryValue = products.reduce(
    (s, p) => s + p.inventory * p.price,
    0
  );

  const saveQty = async (id: string) => {
    const qty = edits[id];
    if (qty === undefined) return;
    try {
      await updateProduct(id, { inventory: qty });
      toast.success("Inventory updated");
      setEdits((e) => {
        const next = { ...e };
        delete next[id];
        return next;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <Boxes className="h-4 w-4 text-muted-foreground mb-2" />
          <p className="text-xl font-display">{totalUnits}</p>
          <p className="text-xs text-muted-foreground">Units in stock</p>
        </Card>
        <Card className="p-4">
          <Package className="h-4 w-4 text-muted-foreground mb-2" />
          <p className="text-xl font-display">{products.length}</p>
          <p className="text-xs text-muted-foreground">Active SKUs</p>
        </Card>
        <Card className="p-4">
          <AlertTriangle className="h-4 w-4 text-amber-500 mb-2" />
          <p className="text-xl font-display">{lowStock}</p>
          <p className="text-xs text-muted-foreground">Low stock</p>
        </Card>
        <Card className="p-4">
          <TrendingDown className="h-4 w-4 text-rose-500 mb-2" />
          <p className="text-xl font-display">{outOfStock}</p>
          <p className="text-xs text-muted-foreground">Out of stock</p>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-background"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Inventory value:{" "}
          <span className="font-medium text-foreground">
            {formatPrice(inventoryValue)}
          </span>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent/50 border-b border-border/60">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isLow = p.inventory > 0 && p.inventory <= 12;
                const isOut = p.inventory === 0;
                const editValue = edits[p.id] ?? p.inventory;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-border/40 hover:bg-accent/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-accent overflow-hidden flex-shrink-0">
                          {p.images[0] && (
                             
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <p className="text-xs font-medium">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {p.id.toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-xs">{p.category}</td>
                    <td className="px-4 py-3 text-right text-xs font-medium">
                      {formatPrice(p.price)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          value={editValue}
                          onChange={(e) =>
                            setEdits((s) => ({
                              ...s,
                              [p.id]: Number(e.target.value),
                            }))
                          }
                          className="h-7 w-20 text-center text-xs"
                        />
                        {edits[p.id] !== undefined && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => saveQty(p.id)}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isOut ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Out of stock
                        </Badge>
                      ) : isLow ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-amber-100 text-amber-800"
                        >
                          Low
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-emerald-100 text-emerald-800"
                        >
                          In stock
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.inventory} on hand
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
