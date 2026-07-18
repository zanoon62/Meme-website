"use client";

import * as React from "react";
import {
  Megaphone,
  Plus,
  Tag,
  Percent,
  Truck,
  Calendar,
  Copy,
  Trash2,
  Mail,
  Instagram,
  Facebook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  type: "percent" | "fixed" | "shipping";
  value: number;
  min_subtotal: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
};

const DEMO_COUPONS: Coupon[] = [
  {
    id: "c1",
    code: "ATELIER10",
    description: "10% off for newsletter subscribers",
    type: "percent",
    value: 10,
    min_subtotal: 0,
    max_uses: 1000,
    used_count: 247,
    is_active: true,
    starts_at: "2025-09-01T00:00:00Z",
    ends_at: null,
  },
  {
    id: "c2",
    code: "FREESHIP",
    description: "Free shipping on orders over 6,000 EGP",
    type: "shipping",
    value: 0,
    min_subtotal: 6000,
    max_uses: null,
    used_count: 412,
    is_active: true,
    starts_at: "2025-01-01T00:00:00Z",
    ends_at: null,
  },
  {
    id: "c3",
    code: "WELCOME50",
    description: "1,500 EGP off first order over 9,000 EGP",
    type: "fixed",
    value: 1500,
    min_subtotal: 9000,
    max_uses: 500,
    used_count: 89,
    is_active: true,
    starts_at: "2025-08-15T00:00:00Z",
    ends_at: "2025-12-31T23:59:59Z",
  },
];

const typeIcon: Record<Coupon["type"], React.ElementType> = {
  percent: Percent,
  fixed: Tag,
  shipping: Truck,
};

export function MarketingSection() {
  const [coupons, setCoupons] = React.useState<Coupon[]>(DEMO_COUPONS);
  const [creating, setCreating] = React.useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied "${code}" to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Marketing channels overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
              <Instagram className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium">Instagram Shop</p>
              <p className="text-[10px] text-muted-foreground">@suited_by_meme</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-display">24.8k</p>
              <p className="text-[10px] text-muted-foreground">Followers</p>
            </div>
            <div>
              <p className="text-lg font-display">847</p>
              <p className="text-[10px] text-muted-foreground">Posts</p>
            </div>
            <div>
              <p className="text-lg font-display">3.2%</p>
              <p className="text-[10px] text-muted-foreground">Engagement</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium">Email (Klaviyo)</p>
              <p className="text-[10px] text-muted-foreground">2,847 subscribers</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-display">42%</p>
              <p className="text-[10px] text-muted-foreground">Open rate</p>
            </div>
            <div>
              <p className="text-lg font-display">3.8%</p>
              <p className="text-[10px] text-muted-foreground">Click rate</p>
            </div>
            <div>
              <p className="text-lg font-display">246k</p>
              <p className="text-[10px] text-muted-foreground">Revenue</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-md bg-blue-800 flex items-center justify-center text-white">
              <Facebook className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium">Meta Ads</p>
              <p className="text-[10px] text-muted-foreground">Active campaigns</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-display">36k</p>
              <p className="text-[10px] text-muted-foreground">Spend (30d)</p>
            </div>
            <div>
              <p className="text-lg font-display">3.4x</p>
              <p className="text-[10px] text-muted-foreground">ROAS</p>
            </div>
            <div>
              <p className="text-lg font-display">847</p>
              <p className="text-[10px] text-muted-foreground">Clicks</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Coupons */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg">Discount codes</h3>
          <p className="text-xs text-muted-foreground">
            Create and manage promotional codes
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> New coupon
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {coupons.map((c) => {
          const Icon = typeIcon[c.type];
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-9 w-9 rounded-md bg-foreground/5 flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <Badge
                  variant={c.is_active ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {c.is_active ? "Active" : "Paused"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <p className="font-mono text-sm font-medium tracking-wider">
                  {c.code}
                </p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => copyCode(c.code)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {c.description}
              </p>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">
                    {c.type === "percent"
                      ? `${c.value}%`
                      : c.type === "fixed"
                        ? `$${c.value}`
                        : "Free shipping"}
                  </span>
                </div>
                {c.min_subtotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min subtotal</span>
                    <span className="font-medium">${c.min_subtotal}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-medium">
                    {c.used_count}
                    {c.max_uses ? ` / ${c.max_uses}` : ""}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2 text-[10px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(c.starts_at).toLocaleDateString()}
                {c.ends_at && ` → ${new Date(c.ends_at).toLocaleDateString()}`}
              </div>
            </Card>
          );
        })}
      </div>

      <CreateCouponDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(c) => setCoupons((prev) => [c, ...prev])}
      />
    </div>
  );
}

function CreateCouponDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (c: Coupon) => void;
}) {
  const [form, setForm] = React.useState({
    code: "",
    description: "",
    type: "percent" as Coupon["type"],
    value: 10,
    min_subtotal: 0,
    max_uses: 100,
  });

  const create = () => {
    if (!form.code) {
      toast.error("Coupon code is required");
      return;
    }
    const newCoupon: Coupon = {
      id: "c" + Date.now(),
      code: form.code.toUpperCase(),
      description: form.description,
      type: form.type,
      value: Number(form.value),
      min_subtotal: Number(form.min_subtotal),
      max_uses: Number(form.max_uses) || null,
      used_count: 0,
      is_active: true,
      starts_at: new Date().toISOString(),
      ends_at: null,
    };
    onCreate(newCoupon);
    toast.success(`Coupon ${newCoupon.code} created`);
    onClose();
    setForm({
      code: "",
      description: "",
      type: "percent",
      value: 10,
      min_subtotal: 0,
      max_uses: 100,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New discount code</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Code</Label>
            <Input
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              placeholder="SUMMER25"
              className="mt-1 font-mono uppercase"
            />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="25% off summer collection"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as Coupon["type"] }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed amount</SelectItem>
                  <SelectItem value="shipping">Free shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">
                {form.type === "percent" ? "Percent off" : "Amount off"}
              </Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, value: Number(e.target.value) }))
                }
                className="mt-1"
                disabled={form.type === "shipping"}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Min subtotal ($)</Label>
              <Input
                type="number"
                value={form.min_subtotal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, min_subtotal: Number(e.target.value) }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Max uses</Label>
              <Input
                type="number"
                value={form.max_uses}
                onChange={(e) =>
                  setForm((f) => ({ ...f, max_uses: Number(e.target.value) }))
                }
                className="mt-1"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={create}>Create coupon</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
