"use client";

import * as React from "react";
import { Layers, Plus, Star, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useProductStore } from "@/components/providers/product-store";

type Collection = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
};

export function CollectionsSection() {
  const products = useProductStore((s) => s.products);
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const productCount = (name: string) =>
    products.filter((p) => p.collection === name).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {collections.length} collections ·{" "}
          {collections.filter((c) => c.is_featured).length} featured
        </p>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> New collection
        </Button>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          Loading…
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collections.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="aspect-[16/9] bg-accent relative">
                {c.image_url && (
                   
                  <img
                    src={c.image_url}
                    alt={c.name}
                    className="w-full h-full object-cover"
                  />
                )}
                {c.is_featured && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-foreground text-background text-[10px]">
                      <Star className="h-2.5 w-2.5 mr-1" /> Featured
                    </Badge>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-display text-lg tracking-tight">{c.name}</h3>
                  {c.tagline && (
                    <p className="text-xs opacity-90 mt-0.5">{c.tagline}</p>
                  )}
                </div>
              </div>
              <div className="p-4">
                {c.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {c.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
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
              </div>
            </Card>
          ))}
        </div>
      )}

      <CollectionDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={load}
      />
    </div>
  );
}

function CollectionDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState({
    name: "",
    slug: "",
    tagline: "",
    description: "",
    image_url: "",
    is_featured: false,
    is_active: true,
  });
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast.success("Collection created");
      onSaved();
      onClose();
      setForm({
        name: "",
        slug: "",
        tagline: "",
        description: "",
        image_url: "",
        is_featured: false,
        is_active: true,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: e.target.value,
                  slug: f.slug || e.target.value.toLowerCase().replace(/\s+/g, "-"),
                }))
              }
              placeholder="e.g. Spring Atelier"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Tagline</Label>
            <Input
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              placeholder="Short marketing line"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Cover image URL</Label>
            <Input
              value={form.image_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, image_url: e.target.value }))
              }
              placeholder="https://…"
              className="mt-1"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <Label className="text-xs">Featured on homepage</Label>
            <Switch
              checked={form.is_featured}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_featured: v }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Creating…" : "Create collection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
