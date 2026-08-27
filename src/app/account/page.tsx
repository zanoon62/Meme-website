"use client";

import * as React from "react";
import Link from "next/link";
import { SmartImage as Image } from "@/components/ui/smart-image";
import {
  Package,
  Heart,
  MapPin,
  Bell,
  LogOut,
  Settings,
  Gift,
  ChevronRight,
  Loader2,
  ShoppingBag,
  User,
  Plus,
  Phone,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWishlistCount, useWishlist } from "@/components/providers/ui-provider";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Customer = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  total_orders: number;
  total_spent: number;
};

type AuthUser = {
  id: string;
  email: string | undefined;
  avatar_url: string | null;
  created_at: string;
};

type SessionData = {
  user: AuthUser | null;
  customer: Customer | null;
};

type OrderItem = {
  id: string;
  product_name: string;
  product_slug: string | null;
  product_image: string | null;
  variant_color: string | null;
  variant_size: string | null;
  quantity: number;
  unit_price: number;
  total: number;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal?: number;
  discount_total?: number;
  shipping_total?: number;
  tax_total?: number;
  total: number;
  currency: string;
  placed_at: string;
  tracking_number: string | null;
  tracking_url: string | null;
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    phone?: string;
  } | null;
  order_items: OrderItem[];
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function getInitials(customer: Customer | null, email?: string): string {
  if (customer?.first_name) {
    const last = customer.last_name ?? "";
    return `${customer.first_name[0]}${last[0] ?? ""}`.toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "M";
}

function getDisplayName(customer: Customer | null, email?: string): string {
  if (customer?.first_name) {
    const last = customer.last_name ? ` ${customer.last_name}` : "";
    return `${customer.first_name}${last}`;
  }
  if (email) return email.split("@")[0];
  return "Member";
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "delivered" || status === "paid") return "default";
  if (status === "cancelled" || status === "refunded") return "outline";
  return "secondary";
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────
// Login Screen
// ─────────────────────────────────────────────
function LoginScreen() {
  const [mode, setMode] = React.useState<"login" | "register">("login");
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    window.location.href = "/api/auth/google?next=/account";
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error ?? "Signup failed"); return; }
        toast.success("Account created! Welcome.");
        window.location.reload();
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error ?? "Login failed"); return; }
        await fetch("/api/admin/auth/elevate", { method: "POST" });
        toast.success("Welcome back!");
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="font-display text-3xl tracking-[0.18em] font-bold">MEME</Link>
          <h1 className="font-display text-3xl tracking-tight mt-6">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === "login"
              ? "Sign in to your MEME account"
              : "Join the MEME list for early access to drops"}
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-12 rounded-full flex items-center justify-center gap-2"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            Continue with Google
          </Button>
        </div>

        <div className="flex items-center my-6">
          <Separator className="flex-1" />
          <span className="px-4 text-xs text-muted-foreground">OR</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  required
                  className="h-11 mt-1"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  required
                  className="h-11 mt-1"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              className="h-11 mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              className="h-11 mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {mode === "login" && (
            <div className="text-right">
              <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
                Forgot password?
              </button>
            </div>
          )}
          <Button type="submit" className="w-full h-12 rounded-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-foreground font-medium link-underline"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────
// Dashboard Screen
// ─────────────────────────────────────────────
function Dashboard({ session }: { session: SessionData }) {
  const { user, customer } = session;
  const itemsCount = useWishlistCount();
  const wishlistItems = useWishlist((s) => s.items);

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(true);
  const [signingOut, setSigningOut] = React.useState(false);

  // Settings form state (controlled)
  const [firstName, setFirstName] = React.useState(customer?.first_name ?? "");
  const [lastName, setLastName] = React.useState(customer?.last_name ?? "");
  const [phone, setPhone] = React.useState(customer?.phone ?? "");
  const [savingProfile, setSavingProfile] = React.useState(false);

  const displayName = getDisplayName(customer, user?.email);
  const initials = getInitials(customer, user?.email);
  const avatarUrl = user?.avatar_url ?? null;

  // Saved custom addresses state
  const [customAddresses, setCustomAddresses] = React.useState<any[]>([]);
  const [showAddAddressModal, setShowAddAddressModal] = React.useState(false);
  const [newAddrForm, setNewAddrForm] = React.useState({
    first_name: customer?.first_name ?? "",
    last_name: customer?.last_name ?? "",
    address1: "",
    address2: "",
    city: "",
    state: "Cairo",
    phone: customer?.phone ?? "",
  });

  // Load custom saved addresses from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("meme-saved-addresses");
      if (saved) setCustomAddresses(JSON.parse(saved));
    } catch {}
  }, []);

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrForm.address1 || !newAddrForm.city) {
      toast.error("Address and city are required");
      return;
    }
    const updated = [...customAddresses, { id: `custom-${Date.now()}`, ...newAddrForm }];
    setCustomAddresses(updated);
    localStorage.setItem("meme-saved-addresses", JSON.stringify(updated));
    toast.success("New address saved successfully!");
    setShowAddAddressModal(false);
    setNewAddrForm({
      first_name: customer?.first_name ?? "",
      last_name: customer?.last_name ?? "",
      address1: "",
      address2: "",
      city: "",
      state: "Cairo",
      phone: customer?.phone ?? "",
    });
  };

  const handleDeleteAddress = (id: string) => {
    const updated = customAddresses.filter((a) => a.id !== id);
    setCustomAddresses(updated);
    localStorage.setItem("meme-saved-addresses", JSON.stringify(updated));
    toast.success("Address removed");
  };

  // Combine custom addresses + addresses extracted from real orders
  const allAddresses = React.useMemo(() => {
    const fromOrders = orders
      .map((o) => o.shipping_address)
      .filter(Boolean)
      .map((a, i) => ({
        id: `order-addr-${i}`,
        first_name: a?.first_name || customer?.first_name || "",
        last_name: a?.last_name || customer?.last_name || "",
        address1: a?.address1 || "",
        address2: a?.address2 || "",
        city: a?.city || "",
        state: a?.state || "",
        phone: a?.phone || "",
        source: "order",
      }));

    const combined = [...customAddresses, ...fromOrders];
    const seen = new Set();
    return combined.filter((item) => {
      if (!item.address1) return false;
      const key = `${item.address1.toLowerCase()}-${item.city?.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [orders, customAddresses, customer]);

  // Load real orders
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/account/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders ?? []);
        }
      } finally {
        setOrdersLoading(false);
      }
    })();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      toast.success("Signed out");
      window.location.href = "/account";
    } catch {
      toast.error("Sign out failed");
      setSigningOut(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save");
      } else {
        toast.success("Profile saved!");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <main className="flex-1 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 py-8 lg:py-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border/60">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-foreground text-background flex items-center justify-center font-display text-xl sm:text-2xl overflow-hidden flex-shrink-0">
            {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            initials
          )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground">MEME Member</p>
            <h1 className="font-display text-2xl sm:text-3xl tracking-tight truncate">Welcome back, {displayName}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full self-start sm:self-auto shrink-0"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4 mr-2" />
          )}
          Sign out
        </Button>
      </div>

      <Tabs defaultValue="orders" className="grid lg:grid-cols-[240px_1fr] gap-6 lg:gap-10">
        {/* Sidebar */}
        <TabsList className="flex lg:flex-col h-auto bg-transparent p-0 gap-1.5 self-start w-full overflow-x-auto scrollbar-none pb-2 lg:pb-0 border-b border-border/40 lg:border-b-0">
          {[
            { value: "orders", icon: Package, label: "Orders", count: orders.length || undefined },
            { value: "wishlist", icon: Heart, label: "Wishlist", count: itemsCount || undefined },
            { value: "addresses", icon: MapPin, label: "Addresses" },
            { value: "rewards", icon: Gift, label: "Rewards" },
            { value: "notifications", icon: Bell, label: "Notifications" },
            { value: "settings", icon: Settings, label: "Settings" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="justify-start shrink-0 lg:w-full px-3.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-accent data-[state=active]:text-foreground rounded-full lg:rounded-sm gap-2 relative border border-border/40 lg:border-none"
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="text-left whitespace-nowrap">{tab.label}</span>
              {tab.count ? (
                <Badge
                  variant="secondary"
                  className="rounded-full text-[10px] h-5 min-w-5 flex items-center justify-center px-1.5 ml-1"
                >
                  {tab.count}
                </Badge>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="min-w-0">
          {/* ── Orders ── */}
          <TabsContent value="orders" className="mt-0">
            <h2 className="font-display text-2xl tracking-tight mb-6">Your orders</h2>
            {ordersLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading orders…</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
                <div>
                  <p className="font-medium">No orders yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    When you place your first order, it will appear here.
                  </p>
                </div>
                <Button asChild className="rounded-full mt-2">
                  <Link href="/shop">Start shopping</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="border border-border/60 rounded-sm overflow-hidden">
                    <div className="bg-accent/30 px-4 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs">
                        <div>
                          <p className="text-muted-foreground uppercase tracking-wider text-[10px]">Order</p>
                          <p className="font-medium font-mono text-xs truncate">{order.order_number}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground uppercase tracking-wider text-[10px]">Date</p>
                          <p className="font-medium text-xs">{formatDate(order.placed_at)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground uppercase tracking-wider text-[10px]">Total</p>
                          <p className="font-medium text-xs text-amber-500 font-bold">{formatPrice(order.total)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground uppercase tracking-wider text-[10px]">Status</p>
                          <Badge variant={statusVariant(order.status)} className="mt-0.5 text-[10px]">
                            {statusLabel(order.status)}
                          </Badge>
                        </div>
                      </div>
                      {order.tracking_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full self-start sm:self-auto shrink-0"
                          asChild
                        >
                          <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                            Track <ChevronRight className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                    <div className="p-5 space-y-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="relative w-14 h-16 rounded-sm overflow-hidden bg-accent flex-shrink-0">
                            {item.product_image ? (
                              <Image
                                src={item.product_image}
                                alt={item.product_name}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="h-6 w-6 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity}
                              {item.variant_size ? ` · ${item.variant_size}` : ""}
                              {item.variant_color ? ` · ${item.variant_color}` : ""}
                            </p>
                          </div>
                          <p className="text-sm font-medium">{formatPrice(item.unit_price)}</p>
                        </div>
                      ))}
                    </div>

                    {order.shipping_address && (
                      <div className="bg-accent/20 px-5 py-3 border-t border-border/40 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          Delivery: {order.shipping_address.address1} {order.shipping_address.address2 ? `(${order.shipping_address.address2})` : ""}, {order.shipping_address.city}
                        </span>
                        {order.shipping_address.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {order.shipping_address.phone}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Wishlist ── */}
          <TabsContent value="wishlist" className="mt-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl tracking-tight">Saved items</h2>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/wishlist">View all</Link>
              </Button>
            </div>
            {wishlistItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <Heart className="h-12 w-12 text-muted-foreground/40" />
                <div>
                  <p className="font-medium">No saved items yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tap the heart on any product to save it here.
                  </p>
                </div>
                <Button asChild className="rounded-full mt-2">
                  <Link href="/shop">Browse collection</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistItems.slice(0, 6).map((item) => (
                  <Link key={item.productId} href={`/product/${item.slug}`} className="group">
                    <div className="relative aspect-[3/4] rounded-sm overflow-hidden bg-accent">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="200px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <p className="text-sm mt-2 line-clamp-1">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Addresses ── */}
          <TabsContent value="addresses" className="mt-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl tracking-tight">Saved addresses</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Addresses from your orders and saved shipping locations
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full flex items-center gap-1.5"
                onClick={() => setShowAddAddressModal(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Add new
              </Button>
            </div>

            {allAddresses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center border border-dashed border-border/70 rounded-2xl">
                <MapPin className="h-12 w-12 text-muted-foreground/40" />
                <div>
                  <p className="font-medium">No saved addresses</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Addresses from your orders will appear here automatically, or you can add one now.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="rounded-full mt-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  onClick={() => setShowAddAddressModal(true)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Address
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {allAddresses.map((addr, idx) => (
                  <div
                    key={addr.id || idx}
                    className="border border-border/80 rounded-2xl p-5 bg-card relative shadow-xs hover:border-amber-500/50 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-amber-500" />
                        <h4 className="font-bold text-sm text-foreground">
                          {addr.first_name || addr.last_name
                            ? `${addr.first_name} ${addr.last_name}`
                            : "Saved Address"}
                        </h4>
                      </div>
                      {idx === 0 && (
                        <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-500 font-bold">
                          Default Shipping
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground">{addr.address1}</p>
                    {addr.address2 && <p className="text-xs text-muted-foreground">{addr.address2}</p>}
                    <p className="text-xs text-muted-foreground font-medium">
                      {addr.city}{addr.state ? `, ${addr.state}` : ""}
                    </p>
                    {addr.phone && (
                      <p className="text-xs text-muted-foreground pt-2 border-t border-border/40 flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-amber-500" /> {addr.phone}
                      </p>
                    )}
                    {addr.source !== "order" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="absolute bottom-4 right-4 text-muted-foreground hover:text-destructive text-xs"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Rewards ── */}
          <TabsContent value="rewards" className="mt-0">
            <h2 className="font-display text-2xl tracking-tight mb-6">Rewards &amp; loyalty</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Total orders", value: String(customer?.total_orders ?? 0), sub: "All time" },
                {
                  label: "Lifetime spend",
                  value: customer?.total_spent ? formatPrice(customer.total_spent) : "—",
                  sub: "Across all orders",
                },
                { label: "Reward points", value: "Coming soon", sub: "Loyalty program" },
              ].map((stat, i) => (
                <div key={i} className="border border-border/60 rounded-sm p-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <p className="font-display text-3xl mt-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── Notifications ── */}
          <TabsContent value="notifications" className="mt-0">
            <h2 className="font-display text-2xl tracking-tight mb-6">Notifications</h2>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center border border-dashed border-border/70 rounded-2xl">
                <Bell className="h-12 w-12 text-muted-foreground/40" />
                <div>
                  <p className="font-medium">No notifications yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    When you place an order, live delivery updates and alerts will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 border border-border/80 rounded-xl bg-card flex items-start gap-3.5 shadow-xs">
                    <div className="h-9 w-9 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-foreground">Order Confirmed #{order.order_number}</h4>
                        <span className="text-xs text-muted-foreground font-mono">{formatDate(order.placed_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Thank you! Your order of {order.order_items?.length || 1} item(s) totaling {formatPrice(order.total)} is confirmed and status is currently <span className="font-semibold text-foreground uppercase">{order.status}</span>.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Settings ── */}
          <TabsContent value="settings" className="mt-0">
            <h2 className="font-display text-2xl tracking-tight mb-6">Account settings</h2>
            <div className="space-y-6 max-w-xl">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Personal information
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-11 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11 mt-1"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Label>Email</Label>
                  <Input
                    value={user?.email ?? ""}
                    className="h-11 mt-1 opacity-60 cursor-not-allowed"
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here.</p>
                </div>
                <div className="mt-3">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 100 000 0000"
                    className="h-11 mt-1"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Email preferences
                </p>
                <div className="space-y-2">
                  {[
                    "New drops & limited releases",
                    "Order updates",
                    "Marketing & promotions",
                    "Newsletter",
                  ].map((pref) => (
                    <label key={pref} className="flex items-center gap-3 text-sm">
                      <input type="checkbox" defaultChecked className="rounded" />
                      {pref}
                    </label>
                  ))}
                </div>
              </div>
              <Button
                className="rounded-full h-11 px-6"
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Add New Address Modal */}
      <Dialog open={showAddAddressModal} onOpenChange={setShowAddAddressModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-500" /> Add New Address
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveNewAddress} className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">First Name</Label>
                <Input
                  value={newAddrForm.first_name}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, first_name: e.target.value })}
                  placeholder="First name"
                  className="h-10 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Last Name</Label>
                <Input
                  value={newAddrForm.last_name}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, last_name: e.target.value })}
                  placeholder="Last name"
                  className="h-10 text-sm mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Street Address / Building *</Label>
              <Input
                value={newAddrForm.address1}
                onChange={(e) => setNewAddrForm({ ...newAddrForm, address1: e.target.value })}
                placeholder="Building No., Street Name, Area"
                required
                className="h-10 text-sm mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Apartment / Floor / Landmark (optional)</Label>
              <Input
                value={newAddrForm.address2}
                onChange={(e) => setNewAddrForm({ ...newAddrForm, address2: e.target.value })}
                placeholder="Floor 3, Apt 12, Near Mall"
                className="h-10 text-sm mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">City / District *</Label>
                <Input
                  value={newAddrForm.city}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, city: e.target.value })}
                  placeholder="City"
                  required
                  className="h-10 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Governorate</Label>
                <Input
                  value={newAddrForm.state}
                  onChange={(e) => setNewAddrForm({ ...newAddrForm, state: e.target.value })}
                  placeholder="Governorate"
                  className="h-10 text-sm mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Phone Number</Label>
              <Input
                value={newAddrForm.phone}
                onChange={(e) => setNewAddrForm({ ...newAddrForm, phone: e.target.value })}
                placeholder="+20 1X XXXX XXXX"
                className="h-10 text-sm mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setShowAddAddressModal(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                Save Address
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

// ─────────────────────────────────────────────
// Main page — checks real session
// ─────────────────────────────────────────────
export default function AccountPage() {
  const [session, setSession] = React.useState<SessionData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data: SessionData = await res.json();
          setSession(data);
          if (data.user) {
            fetch("/api/admin/auth/elevate", { method: "POST" })
              .then((r) => r.json())
              .then((d) => {
                if (d?.isAdmin) window.dispatchEvent(new Event("adminSessionGranted"));
              })
              .catch(() => {});
          }
        }
      } catch {
        setSession({ user: null, customer: null });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Full-page loading spinner
  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  // Not logged in
  if (!session?.user) {
    return <LoginScreen />;
  }

  // Logged in
  return <Dashboard session={session} />;
}
