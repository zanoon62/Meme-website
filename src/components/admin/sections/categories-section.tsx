"use client";

import * as React from "react";
import { FolderTree, Plus, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useProductStore } from "@/components/providers/product-store";
import { categories as seedCategories } from "@/data/products";
import { useT, useLangDir } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
};

export function CategoriesSection() {
  const products = useProductStore((s) => s.products);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [creating, setCreating] = React.useState(false);
  const t = useT();
  const dir = useLangDir();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        const list = data.categories && data.categories.length > 0
          ? data.categories
          : seedCategories.map((c, i) => ({
              id: `cat-seed-${i}`,
              slug: c.slug,
              name: c.name,
              description: `All ${c.name} products`,
              sort_order: i,
              is_active: true,
            }));
        setCategories(list);
      }
    } catch {
      setCategories(
        seedCategories.map((c, i) => ({
          id: `cat-seed-${i}`,
          slug: c.slug,
          name: c.name,
          description: `All ${c.name} products`,
          sort_order: i,
          is_active: true,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = categories.filter((c) =>
    !search ? true : c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const productCount = (catName: string) =>
    products.filter((p) => p.category === catName || p.category.toLowerCase() === catName.toLowerCase()).length;

  const getCategoryLabel = (name: string) => {
    const key = `cat.${name}`;
    const translated = t(key);
    return translated !== key ? translated : name;
  };

  return (
    <div dir={dir} className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.search_categories")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-background"
          />
        </div>
        <Button size="sm" onClick={() => setCreating(true)} className="font-semibold shadow-sm">
          <Plus className="h-4 w-4 mr-1" /> {t("admin.new_category")}
        </Button>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          {t("admin.loading")}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className="p-5 border border-border/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center border border-border/40">
                  <FolderTree className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:bg-accent"
                    onClick={() => setEditing(c)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="font-bold text-base text-foreground">{getCategoryLabel(c.name)}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                /{c.slug}
              </p>
              {c.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                  {c.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
                <Badge variant="secondary" className="text-[10px] font-semibold">
                  {productCount(c.name)} {t("admin.products_count")}
                </Badge>
                <Badge
                  variant={c.is_active ? "default" : "secondary"}
                  className={cn(
                    "text-[10px] font-bold px-2.5 py-0.5",
                    c.is_active ? "bg-emerald-600 dark:bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {c.is_active ? t("admin.active") : t("admin.hidden")}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CategoryDialog
        open={creating || !!editing}
        category={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={load}
      />
    </div>
  );
}

function CategoryDialog({
  open,
  category,
  onClose,
  onSaved,
}: {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const t = useT();

  React.useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description ?? "");
    } else {
      setName("");
      setSlug("");
      setDescription("");
    }
  }, [category, open]);

  const save = async () => {
    if (!name || !slug) {
      toast.error("Name and slug are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
          description,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast.success(category ? "Category updated" : "Category created successfully!");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? t("admin.edit_category") : t("admin.new_category")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!category) {
                  setSlug(
                    e.target.value.toLowerCase().replace(/\s+/g, "-")
                  );
                }
              }}
              placeholder="e.g. Dresses"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="dresses"
              className="mt-1 font-mono text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description shown on category page"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("admin.cancel")}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? t("admin.loading") : category ? t("admin.save_changes") : t("admin.create_category")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
