"use client";

import * as React from "react";
import { FolderTree, Plus, Pencil, Trash2, Search } from "lucide-react";
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

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = categories.filter((c) =>
    !search ? true : c.name.toLowerCase().includes(search.toLowerCase())
  );

  const productCount = (catName: string) =>
    products.filter((p) => p.category === catName).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-background"
          />
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> New category
        </Button>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          Loading…
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="h-9 w-9 rounded-md bg-foreground/5 flex items-center justify-center">
                  <FolderTree className="h-4 w-4" />
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setEditing(c)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="font-medium text-sm">{c.name}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                /{c.slug}
              </p>
              {c.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {c.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                <Badge variant="secondary" className="text-[10px]">
                  {productCount(c.name)} products
                </Badge>
                <Badge
                  variant={c.is_active ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {c.is_active ? "Active" : "Hidden"}
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
      toast.success(category ? "Category updated" : "Category created");
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
            {category ? "Edit category" : "New category"}
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
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : category ? "Save changes" : "Create category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
