"use client";

import * as React from "react";
import {
  Store,
  CreditCard,
  Bell,
  Truck,
  Shield,
  Mail,
  Save,
  Globe,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function SettingsSection() {
  const [tab, setTab] = React.useState<
    "store" | "payments" | "shipping" | "notifications" | "security"
  >("store");

  const tabs = [
    { id: "store" as const, label: "Store", icon: Store },
    { id: "payments" as const, label: "Payments", icon: CreditCard },
    { id: "shipping" as const, label: "Shipping", icon: Truck },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-border/60 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "store" && <StoreSettings />}
      {tab === "payments" && <PaymentsSettings />}
      {tab === "shipping" && <ShippingSettings />}
      {tab === "notifications" && <NotificationsSettings />}
      {tab === "security" && <SecuritySettings />}
    </div>
  );
}

function StoreSettings() {
  const [form, setForm] = React.useState({
    name: "MEME Atelier",
    tagline: "Tailored for the modern Egyptian woman",
    description:
      "Premium women's fashion — Italian wool tailoring, cashmere knits, and silk dresses designed to outlive every trend cycle. Designed in Cairo.",
    email: "atelier@suitedbymeme.com",
    phone: "+20 100 000 0000",
    currency: "EGP",
    timezone: "Africa/Cairo",
    weightUnit: "kg",
    instagram: "https://instagram.com/suited_by_meme",
    domain: "memeatelier.com",
  });

  return (
    <Card className="p-6 max-w-2xl">
      <h3 className="font-display text-lg mb-1">Store profile</h3>
      <p className="text-xs text-muted-foreground mb-6">
        Basic information about your atelier shown across the storefront.
      </p>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Store name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Tagline</Label>
            <Input
              value={form.tagline}
              onChange={(e) =>
                setForm((f) => ({ ...f, tagline: e.target.value }))
              }
              className="mt-1"
            />
          </div>
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Contact email</Label>
            <Input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Currency</Label>
            <Select
              value={form.currency}
              onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EGP">EGP — Egyptian Pound</SelectItem>
                <SelectItem value="SAR">SAR — Saudi Riyal</SelectItem>
                <SelectItem value="AED">AED — UAE Dirham</SelectItem>
                <SelectItem value="USD">USD — US Dollar</SelectItem>
                <SelectItem value="EUR">EUR — Euro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Timezone</Label>
            <Select
              value={form.timezone}
              onValueChange={(v) => setForm((f) => ({ ...f, timezone: v }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Africa/Cairo">Cairo (EET)</SelectItem>
                <SelectItem value="Africa/Casablanca">Casablanca (WET)</SelectItem>
                <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                <SelectItem value="Asia/Riyadh">Riyadh (AST)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs">Instagram URL</Label>
          <Input
            value={form.instagram}
            onChange={(e) =>
              setForm((f) => ({ ...f, instagram: e.target.value }))
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Custom domain</Label>
          <Input
            value={form.domain}
            onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
            className="mt-1"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Configure DNS in Vercel dashboard to point this domain to your
            deployment.
          </p>
        </div>
      </div>
      <div className="flex justify-end mt-6">
        <Button onClick={() => toast.success("Settings saved")}>
          <Save className="h-4 w-4 mr-1" /> Save changes
        </Button>
      </div>
    </Card>
  );
}

function PaymentsSettings() {
  return (
    <Card className="p-6 max-w-2xl">
      <h3 className="font-display text-lg mb-1">Payment providers</h3>
      <p className="text-xs text-muted-foreground mb-6">
        Connect payment processors to accept checkout. Test mode recommended
        during development.
      </p>

      <div className="space-y-3">
        {[
          {
            name: "Stripe",
            desc: "Accept cards, Apple Pay, Google Pay, Klarna",
            connected: true,
            icon: CreditCard,
          },
          {
            name: "PayPal",
            desc: "PayPal balance & PayPal Credit",
            connected: false,
            icon: CreditCard,
          },
          {
            name: "Apple Pay",
            desc: "Direct via Stripe — no separate setup",
            connected: true,
            icon: CreditCard,
          },
        ].map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between p-4 border border-border/60 rounded-md"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-foreground/5 flex items-center justify-center">
                <p.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            </div>
            {p.connected ? (
              <span className="text-xs text-emerald-600 font-medium">
                Connected
              </span>
            ) : (
              <Button variant="outline" size="sm">
                Connect
              </Button>
            )}
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Test mode</p>
            <p className="text-xs text-muted-foreground">
              Use test cards, no real charges
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Capture payment automatically</p>
            <p className="text-xs text-muted-foreground">
              Authorize and capture at checkout
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Allow partial refunds</p>
            <p className="text-xs text-muted-foreground">
              Issue partial refunds from order detail
            </p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>
    </Card>
  );
}

function ShippingSettings() {
  return (
    <Card className="p-6 max-w-2xl">
      <h3 className="font-display text-lg mb-1">Shipping zones</h3>
      <p className="text-xs text-muted-foreground mb-6">
        Define rates by region. Free shipping threshold encourages larger carts.
      </p>

      <div className="space-y-3">
        {[
          {
            zone: "Cairo (Greater Cairo)",
            rate: "Free over 7,500 EGP, else 75 EGP flat",
            delivery: "1–2 business days",
          },
          {
            zone: "Alexandria",
            rate: "Free over 7,500 EGP, else 95 EGP flat",
            delivery: "2–3 business days",
          },
          {
            zone: "Delta & Canal Cities",
            rate: "Free over 7,500 EGP, else 110 EGP flat",
            delivery: "2–4 business days",
          },
          {
            zone: "Upper Egypt",
            rate: "Free over 7,500 EGP, else 145 EGP flat",
            delivery: "3–5 business days",
          },
          {
            zone: "Red Sea & Sinai (no COD)",
            rate: "165 EGP flat",
            delivery: "3–6 business days",
          },
        ].map((z) => (
          <div
            key={z.zone}
            className="flex items-center justify-between p-4 border border-border/60 rounded-md"
          >
            <div>
              <p className="text-sm font-medium">{z.zone}</p>
              <p className="text-xs text-muted-foreground">{z.delivery}</p>
            </div>
            <p className="text-xs font-medium">{z.rate}</p>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="mt-4">
        Add shipping zone
      </Button>
    </Card>
  );
}

function NotificationsSettings() {
  return (
    <Card className="p-6 max-w-2xl">
      <h3 className="font-display text-lg mb-1">Notification preferences</h3>
      <p className="text-xs text-muted-foreground mb-6">
        Choose which events trigger emails to staff and customers.
      </p>

      <div className="space-y-4">
        {[
          {
            label: "New order received",
            desc: "Email staff when an order is placed",
            on: true,
          },
          {
            label: "Low stock alert",
            desc: "Email when any SKU drops below 12 units",
            on: true,
          },
          {
            label: "New review submitted",
            desc: "Email when a customer leaves a review",
            on: false,
          },
          {
            label: "Order shipped",
            desc: "Send customer tracking notification",
            on: true,
          },
          {
            label: "Abandoned cart",
            desc: "Email customer 1 hour after abandonment",
            on: true,
          },
          {
            label: "Weekly summary",
            desc: "Monday morning recap of last week's sales",
            on: true,
          },
        ].map((n) => (
          <div key={n.label} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{n.label}</p>
              <p className="text-xs text-muted-foreground">{n.desc}</p>
            </div>
            <Switch defaultChecked={n.on} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function SecuritySettings() {
  return (
    <Card className="p-6 max-w-2xl">
      <h3 className="font-display text-lg mb-1">Security & access</h3>
      <p className="text-xs text-muted-foreground mb-6">
        Manage staff accounts and security policies for the admin dashboard.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-border/60 rounded-md">
          <div>
            <p className="text-sm font-medium">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground">
              Require 2FA for all staff accounts
            </p>
          </div>
          <Switch />
        </div>
        <div className="flex items-center justify-between p-4 border border-border/60 rounded-md">
          <div>
            <p className="text-sm font-medium">IP allowlist</p>
            <p className="text-xs text-muted-foreground">
              Restrict admin access to specific IPs
            </p>
          </div>
          <Switch />
        </div>
        <div className="flex items-center justify-between p-4 border border-border/60 rounded-md">
          <div>
            <p className="text-sm font-medium">Session timeout</p>
            <p className="text-xs text-muted-foreground">
              Auto sign-out after 30 minutes idle
            </p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>

      <Separator className="my-6" />

      <div>
        <p className="text-sm font-medium mb-3">Staff accounts</p>
        <div className="space-y-2">
          {[
            { email: "admin@memeatelier.com", role: "Owner", last: "Active now" },
            { email: "studio@memeatelier.com", role: "Staff", last: "2h ago" },
            { email: "support@memeatelier.com", role: "Staff", last: "Yesterday" },
          ].map((s) => (
            <div
              key={s.email}
              className="flex items-center justify-between p-3 border border-border/60 rounded-md"
            >
              <div>
                <p className="text-xs font-medium">{s.email}</p>
                <p className="text-[10px] text-muted-foreground">
                  {s.role} · {s.last}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                Manage
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-3">
          Invite staff member
        </Button>
      </div>
    </Card>
  );
}
