"use client";

import * as React from "react";
import Link from "next/link";
import { SmartImage as Image } from "@/components/ui/smart-image";
import {
  User,
  Package,
  Heart,
  MapPin,
  Bell,
  LogOut,
  Settings,
  CreditCard,
  Gift,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWishlistCount, useWishlist } from "@/components/providers/ui-provider";
import { products } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const mockOrders = [
  {
    id: "MEME-9X4K2P",
    date: "Oct 14, 2025",
    status: "Delivered",
    total: 657,
    items: [
      { name: "Obsidian Tailored Blazer", image: products[0].images[0], qty: 1, price: 489 },
      { name: "MEME Signature Tee", image: products[4].images[0], qty: 1, price: 78 },
      { name: "Minimal Leather Sneaker", image: products[11].images[0], qty: 1, price: 295 },
    ],
  },
  {
    id: "MEME-7H2L9Q",
    date: "Sep 28, 2025",
    status: "Shipped",
    total: 413,
    items: [
      { name: "Noir Oversized Hoodie", image: products[1].images[0], qty: 1, price: 168 },
      { name: "Monolith Cargo Pant", image: products[2].images[0], qty: 1, price: 245 },
    ],
  },
  {
    id: "MEME-3R8M1J",
    date: "Sep 02, 2025",
    status: "Delivered",
    total: 225,
    items: [
      { name: "Specter Relaxed Denim", image: products[10].images[0], qty: 1, price: 225 },
    ],
  },
];

export default function AccountPage() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [mode, setMode] = React.useState<"login" | "register">("login");
  const itemsCount = useWishlistCount();
  const wishlistItems = useWishlist((s) => s.items);

  const handleGoogleLogin = async () => {
    try {
      const { getSupabaseBrowser } = await import("@/lib/supabase/browser");
      const { isSupabaseConfigured } = await import("@/lib/supabase/config");

      if (!isSupabaseConfigured()) {
        setIsLoggedIn(true);
        toast.success("Signed in with Google");
        return;
      }

      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate Google Sign In");
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <Link href="/" className="font-display text-3xl tracking-[0.18em] font-bold">MEME</Link>
            <h1 className="font-display text-3xl tracking-tight mt-6">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === "login" ? "Sign in to your MEME account" : "Join the MEME list for early access to drops"}
            </p>
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full h-12 rounded-full flex items-center justify-center gap-2" onClick={handleGoogleLogin}>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </Button>
            <Button variant="outline" className="w-full h-12 rounded-full" onClick={() => { setIsLoggedIn(true); toast.success("Signed in with Apple"); }}>
              Continue with Apple
            </Button>
          </div>

          <div className="flex items-center my-6">
            <Separator className="flex-1" />
            <span className="px-4 text-xs text-muted-foreground">OR</span>
            <Separator className="flex-1" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsLoggedIn(true);
              toast.success(mode === "login" ? "Welcome back" : "Account created");
            }}
            className="space-y-3"
          >
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" required className="h-11 mt-1" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" required className="h-11 mt-1" />
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="you@example.com" className="h-11 mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required className="h-11 mt-1" />
            </div>
            {mode === "login" && (
              <div className="text-right">
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
                  Forgot password?
                </button>
              </div>
            )}
            <Button type="submit" className="w-full h-12 rounded-full">
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

  return (
    <main className="flex-1 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-8 border-b border-border/60">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center font-display text-2xl">
            M
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">MEME Member</p>
            <h1 className="font-display text-3xl tracking-tight">Welcome back, MEME</h1>
            <p className="text-sm text-muted-foreground mt-1">2,450 reward points · Gold tier</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setIsLoggedIn(false); toast.success("Signed out"); }}>
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>

      <Tabs defaultValue="orders" className="grid lg:grid-cols-[240px_1fr] gap-10">
        {/* Sidebar */}
        <TabsList className="flex lg:flex-col h-auto bg-transparent p-0 gap-1 self-start">
          {[
            { value: "orders", icon: Package, label: "Orders" },
            { value: "wishlist", icon: Heart, label: "Wishlist", count: itemsCount },
            { value: "addresses", icon: MapPin, label: "Addresses" },
            { value: "rewards", icon: Gift, label: "Rewards" },
            { value: "notifications", icon: Bell, label: "Notifications" },
            { value: "settings", icon: Settings, label: "Settings" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="justify-start w-full px-3 py-2.5 text-sm data-[state=active]:bg-accent rounded-sm gap-2 relative"
            >
              <tab.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{tab.label}</span>
              {tab.count ? (
                <Badge variant="secondary" className="rounded-full text-[10px] h-5 min-w-5 flex items-center justify-center px-1.5">
                  {tab.count}
                </Badge>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        <div>
          {/* Orders */}
          <TabsContent value="orders" className="mt-0">
            <h2 className="font-display text-2xl tracking-tight mb-6">Recent orders</h2>
            <div className="space-y-6">
              {mockOrders.map((order) => (
                <div key={order.id} className="border border-border/60 rounded-sm overflow-hidden">
                  <div className="bg-accent/30 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
                      <div>
                        <p className="text-muted-foreground uppercase tracking-wider">Order</p>
                        <p className="font-medium font-mono">{order.id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase tracking-wider">Date</p>
                        <p className="font-medium">{order.date}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase tracking-wider">Total</p>
                        <p className="font-medium">{formatPrice(order.total)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase tracking-wider">Status</p>
                        <Badge variant={order.status === "Delivered" ? "default" : "secondary"} className="mt-0.5">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full">View details <ChevronRight className="h-3 w-3 ml-1" /></Button>
                  </div>
                  <div className="p-5 space-y-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="relative w-14 h-16 rounded-sm overflow-hidden bg-accent flex-shrink-0">
                          <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
                        </div>
                        <p className="text-sm font-medium">{formatPrice(item.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Wishlist */}
          <TabsContent value="wishlist" className="mt-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl tracking-tight">Saved items</h2>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/wishlist">View all</Link>
              </Button>
            </div>
            {wishlistItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8">No saved items yet.</p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistItems.slice(0, 6).map((item) => (
                  <Link key={item.productId} href={`/product/${item.slug}`} className="group">
                    <div className="relative aspect-[3/4] rounded-sm overflow-hidden bg-accent">
                      <Image src={item.image} alt={item.name} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <p className="text-sm mt-2 line-clamp-1">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Addresses */}
          <TabsContent value="addresses" className="mt-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl tracking-tight">Saved addresses</h2>
              <Button variant="outline" size="sm" className="rounded-full">Add new</Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border border-foreground rounded-sm p-5 relative">
                <Badge className="mb-3">Default</Badge>
                <p className="font-medium text-sm">MEME Member</p>
                <p className="text-sm text-muted-foreground mt-1">
                  12 Taha Hussein St.<br />
                  Apt 4B, Zamalek<br />
                  Cairo, Egypt<br />
                  +20 100 000 0000
                </p>
                <Button variant="ghost" size="sm" className="mt-3 -ml-3">Edit</Button>
              </div>
              <div className="border border-border/60 rounded-sm p-5">
                <p className="font-medium text-sm">MEME Studio</p>
                <p className="text-sm text-muted-foreground mt-1">
                  456 El-Geish Road<br />
                  Miami, Alexandria 21599<br />
                  Egypt<br />
                  +20 122 000 0000
                </p>
                <Button variant="ghost" size="sm" className="mt-3 -ml-3">Edit</Button>
              </div>
            </div>
          </TabsContent>

          {/* Rewards */}
          <TabsContent value="rewards" className="mt-0">
            <h2 className="font-display text-2xl tracking-tight mb-6">Rewards & loyalty</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Points balance", value: "2,450", sub: "Gold tier" },
                { label: "Lifetime spend", value: "146,700 EGP", sub: "Across 8 orders" },
                { label: "Store credit", value: "2,250 EGP", sub: "Expires Dec 2026" },
              ].map((stat, i) => (
                <div key={i} className="border border-border/60 rounded-sm p-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <p className="font-display text-3xl mt-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 border border-border/60 rounded-sm p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Available rewards</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <div>
                    <p className="text-sm font-medium">750 EGP off next order</p>
                    <p className="text-xs text-muted-foreground">500 points</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full">Redeem</Button>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <div>
                    <p className="text-sm font-medium">Free express shipping</p>
                    <p className="text-xs text-muted-foreground">300 points</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full">Redeem</Button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Early access to next drop</p>
                    <p className="text-xs text-muted-foreground">1,000 points</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full">Redeem</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="mt-0">
            <h2 className="font-display text-2xl tracking-tight mb-6">Notifications</h2>
            <div className="space-y-3">
              {[
                { title: "Order delivered", desc: "Your order MEME-9X4K2P has been delivered.", time: "2 hours ago", unread: true },
                { title: "Back in stock", desc: "Obsidian Tailored Blazer in Charcoal is back in stock.", time: "1 day ago", unread: true },
                { title: "New drop alert", desc: "Atelier Noir Fall/Winter 2026 is now live.", time: "3 days ago", unread: false },
                { title: "Reward earned", desc: "You earned 250 points for your last order.", time: "5 days ago", unread: false },
              ].map((n, i) => (
                <div key={i} className={cn("flex items-start gap-3 p-4 rounded-sm border", n.unread ? "border-foreground/30 bg-accent/30" : "border-border/60")}>
                  <div className={cn("w-2 h-2 rounded-full mt-2", n.unread ? "bg-foreground" : "bg-transparent")} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{n.title}</p>
                      <span className="text-xs text-muted-foreground">{n.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="mt-0">
            <h2 className="font-display text-2xl tracking-tight mb-6">Account settings</h2>
            <div className="space-y-6 max-w-xl">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Personal information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>First name</Label><Input defaultValue="MEME" className="h-11 mt-1" /></div>
                  <div><Label>Last name</Label><Input defaultValue="Member" className="h-11 mt-1" /></div>
                </div>
                <div className="mt-3"><Label>Email</Label><Input defaultValue="member@meme.com" className="h-11 mt-1" /></div>
                <div className="mt-3"><Label>Phone</Label><Input defaultValue="+1 (555) 012-3456" className="h-11 mt-1" /></div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Password</p>
                <Button variant="outline" className="rounded-full">Change password</Button>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Email preferences</p>
                <div className="space-y-2">
                  {["New drops & limited releases", "Order updates", "Marketing & promotions", "Newsletter"].map((pref) => (
                    <label key={pref} className="flex items-center gap-3 text-sm">
                      <input type="checkbox" defaultChecked className="rounded" />
                      {pref}
                    </label>
                  ))}
                </div>
              </div>
              <Button className="rounded-full h-11 px-6">Save changes</Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </main>
  );
}
