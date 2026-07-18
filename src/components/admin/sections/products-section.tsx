"use client";

import * as React from "react";
import Link from "next/link";
import { SmartImage as Image } from "@/components/ui/smart-image";
import {
  Package,
  Search,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  ExternalLink,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProductStore } from "@/components/providers/product-store";
import type { Product } from "@/components/providers/ui-provider";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ProductsSection({
  onAdd,
  onEdit,
}: {
  onAdd: () => void;
  onEdit: (p: Product) => void;
}) {
  const products = useProductStore((s) => s.products);
  const deleteProduct = useProductStore((s) => s.deleteProduct);
  const resetToSeed = useProductStore((s) => s.resetToSeed);

  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [pendingDelete, setPendingDelete] = React.useState<Product | null>(null);
  const [pendingReset, setPendingReset] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const filtered = React.useMemo(() => {
    let r = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.collection.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
      );
    }
    if (categoryFilter !== "all") {
      r = r.filter((p) => p.category === categoryFilter);
    }
    return r;
  }, [products, search, categoryFilter]);

  const categoryOptions = React.useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products]
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await deleteProduct(pendingDelete.id);
      toast.success(`Deleted "${pendingDelete.name}"`);
      setPendingDelete(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusy(false);
    }
  };

  const confirmReset = async () => {
    setBusy(true);
    try {
      await resetToSeed();
      toast.success("Catalog reset to original 12 products");
      setPendingReset(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reset");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">{products.length}</span>{" "}
          products ·{" "}
          <span className="text-foreground font-medium">
            {products.filter((p) => p.inventory > 0).length}
          </span>{" "}
          active ·{" "}
          <span className="text-amber-600 font-medium">
            {products.filter((p) => p.inventory <= 12 && p.inventory > 0).length}
          </span>{" "}
          low stock
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="pl-8 h-8 w-44 sm:w-56 text-xs"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="all">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setPendingReset(true)}
            title="Restore the original 12-product catalog"
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Download className="h-3 w-3 mr-1" /> Export
          </Button>
          <Button size="sm" className="h-8" onClick={onAdd}>
            <Plus className="h-3 w-3 mr-1" /> Add product
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent/30 border-b border-border/60">
              <tr>
                <th className="text-left p-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Product
                </th>
                <th className="text-left p-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Category
                </th>
                <th className="text-left p-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Price
                </th>
                <th className="text-left p-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Inventory
                </th>
                <th className="text-left p-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Flags
                </th>
                <th className="text-left p-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Status
                </th>
                <th className="p-4 text-right text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium text-foreground mb-1">
                      No products found
                    </p>
                    <p className="text-xs">
                      Try a different search, or add a new product.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border/40 hover:bg-accent/20"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-12 rounded-sm overflow-hidden bg-accent flex-shrink-0">
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium line-clamp-1">{p.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {p.subtitle}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      <p>{p.category}</p>
                      <p className="text-xs">{p.collection}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{formatPrice(p.price)}</p>
                      {p.compareAtPrice && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatPrice(p.compareAtPrice)}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          p.inventory === 0
                            ? "text-destructive"
                            : p.inventory <= 12
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                        )}
                      >
                        {p.inventory} in stock
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {p.isNew && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            New
                          </Badge>
                        )}
                        {p.isBestSeller && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            Best
                          </Badge>
                        )}
                        {p.isTrending && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            Trend
                          </Badge>
                        )}
                        {p.isLimited && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            Limit
                          </Badge>
                        )}
                        {!p.isNew &&
                          !p.isBestSeller &&
                          !p.isTrending &&
                          !p.isLimited && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={p.inventory > 0 ? "default" : "secondary"}>
                        {p.inventory > 0 ? "Active" : "Sold out"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="View on storefront"
                          asChild
                        >
                          <Link href={`/product/${p.slug}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit product"
                          onClick={() => onEdit(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Delete product"
                          onClick={() => setPendingDelete(p)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete{" "}
              <strong className="text-foreground">{pendingDelete?.name}</strong>.
              This action cannot be undone. The product will be removed from the
              storefront immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? "Deleting…" : "Delete product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingReset} onOpenChange={setPendingReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset the catalog?</AlertDialogTitle>
            <AlertDialogDescription>
              This will discard all your admin edits and restore the original
              12-product MEME women&apos;s catalog. Any products you added or
              modified will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset} disabled={busy}>
              {busy ? "Resetting…" : "Reset catalog"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
