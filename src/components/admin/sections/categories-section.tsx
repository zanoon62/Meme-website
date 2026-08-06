"use client";

import * as React from "react";
import { FolderTree, Plus, Pencil, Search, Trash2, AlertCircle } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useProductStore } from "@/components/providers/product-store";
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
  const [confirmDelete, setConfirmDelete] = React.useState<Category | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const t = useT();
  const dir = useLangDir();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        // Only show what's actually in the database — no seed fallback
        setCategories(data.categories ?? []);
      }
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories?id=${confirmDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete");
      }
      toast.success(`Category "${confirmDelete.name}" deleted`);
      setConfirmDelete(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = categories.filter((c) =>
    !search
      ? true
      : c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const productCount = (catName: string) =>
    products.filter(
      (p) => p.category === catName || p.category.toLowerCase() === catName.toLowerCase()
    ).length;

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
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <FolderTree className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No categories yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Categories are created automatically when you add products, or create them manually here.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" /> Create first category
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card
              key={c.id}
              className="p-5 border border-border/80 shadow-sm hover:shadow-md transition-shadow"
            >
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
                    title="Edit category"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmDelete(c)}
                    title="Delete category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="font-bold text-base text-foreground">{getCategoryLabel(c.name)}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">/{c.slug}</p>
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
                    c.is_active
                      ? "bg-emerald-600 dark:bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {c.is_active ? t("admin.active") : t("admin.hidden")}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <CategoryDialog
        open={creating || !!editing}
        category={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={load}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Delete category?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">&ldquo;{confirmDelete?.name}&rdquo;</strong>?{" "}
              {productCount(confirmDelete?.name ?? "") > 0 && (
                <span className="text-amber-600 font-medium">
                  ⚠ {productCount(confirmDelete?.name ?? "")} product(s) use this category — they
                  won&apos;t be deleted but will lose their category filter.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const [isActive, setIsActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const t = useT();

  React.useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description ?? "");
      setIsActive(category.is_active);
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setIsActive(true);
    }
  }, [category, open]);

  const save = async () => {
    if (!name || !slug) {
      toast.error("Name and slug are required");
      return;
    }
    setSaving(true);
    try {
      const method = category ? "PATCH" : "POST";
      const url = category
        ? `/api/admin/categories?id=${category.id}`
        : "/api/admin/categories";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, is_active: isActive }),
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
            <Label className="text-xs">Name *</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!category) {
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                }
              }}
              placeholder="e.g. Dresses"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Slug *</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="dresses"
              className="mt-1 font-mono text-sm"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Used in the URL: /shop?category=…
            </p>
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
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <p className="text-xs font-medium">Active</p>
              <p className="text-[10px] text-muted-foreground">Visible in store filter</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((v) => !v)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                isActive ? "bg-primary" : "bg-input"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                  isActive ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("admin.cancel")}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving
              ? t("admin.loading")
              : category
              ? t("admin.save_changes")
              : t("admin.create_category")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
