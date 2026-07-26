"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useUI, useCartCount, useWishlistCount } from "@/components/providers/ui-provider";
import { categories, collections } from "@/data/products";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { useT, useLangDir } from "@/lib/i18n";

// Cloned from dream-stock3 reference header:
// - Logo (left, with optional video / brand text)
// - Desktop nav: Home, Shop, Collections, Contact
// - Right: Search, Account, Wishlist, Cart (with badge)
// - Mobile hamburger (left) + nav drawer

export function Header() {
  const router = useRouter();
  const { setCartOpen, setSearchOpen, searchOpen } = useUI();
  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const t = useT();
  const dir = useLangDir();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      dir={dir}
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300 border-b border-white/5",
        scrolled ? "glass" : "bg-background"
      )}
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 lg:h-20 items-center justify-between gap-4">
          {/* Mobile menu trigger (left, like reference) */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden -ml-2 text-foreground">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] sm:w-[380px] p-0 bg-background">
              <SheetHeader className="p-6 border-b border-white/5">
                <SheetTitle className="font-display text-2xl tracking-[0.18em] text-gold-gradient">
                  MEME
                </SheetTitle>
              </SheetHeader>
              <div className="px-6 py-4 overflow-y-auto h-[calc(100vh-100px)]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Menu</p>
                <nav className="flex flex-col gap-1">
                  <Link href="/" onClick={() => setMobileOpen(false)} className="py-3 text-base border-b border-white/5 hover:translate-x-1 transition-transform">Home</Link>
                  <Link href="/shop" onClick={() => setMobileOpen(false)} className="py-3 text-base border-b border-white/5 hover:translate-x-1 transition-transform">Shop</Link>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-6 mb-3">Collections</p>
                  {collections.map((col) => (
                    <Link
                      key={col.slug}
                      href={`/collection/${col.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="py-3 text-base border-b border-white/5 hover:translate-x-1 transition-transform"
                    >
                      {col.name}
                    </Link>
                  ))}
                  <Link href="/" onClick={() => setMobileOpen(false)} className="py-3 text-base border-b border-white/5 hover:translate-x-1 transition-transform mt-6">Contact</Link>
                  <Link href="/account" onClick={() => setMobileOpen(false)} className="py-3 text-base border-b border-white/5">Account</Link>
                  <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="py-3 text-base border-b border-white/5">Wishlist</Link>
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="py-3 text-base border-b border-white/5 text-primary font-semibold">Admin Dashboard →</Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo — centered on mobile, left on desktop */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 lg:mr-8">
            <span className="font-display text-2xl lg:text-[26px] tracking-[0.18em] font-bold leading-none text-gold-gradient">
              MEME
            </span>
          </Link>

          {/* Desktop nav — matches reference: Home, Shop, Collections, Contact */}
          <nav className="hidden lg:flex items-center gap-8 text-[13px] uppercase tracking-[0.14em] font-medium flex-1">
            <Link href="/" className="link-underline hover:text-foreground/80">{t("nav.home")}</Link>
            <Link href="/shop" className="link-underline hover:text-foreground/80">{t("nav.shop")}</Link>
            <div className="relative group">
              <Link href="/shop" className="link-underline hover:text-foreground/80 inline-flex items-center gap-1">
                {t("nav.collections")}
              </Link>
              {/* Mega menu */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
                <div className="bg-card border border-white/10 rounded-sm shadow-2xl p-6 min-w-[280px]">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Collections</p>
                  <ul className="space-y-2">
                    {collections.map((col) => (
                      <li key={col.slug}>
                        <Link
                          href={`/collection/${col.slug}`}
                          className="block py-1.5 text-sm hover:text-primary transition-colors"
                        >
                          {col.name}
                          <span className="text-xs text-muted-foreground ml-2">({col.count})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-5 mb-3">Categories</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {categories.slice(1, 7).map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                        className="text-sm hover:text-primary transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Link href="/" className="link-underline hover:text-foreground/80">{t("nav.contact")}</Link>
            <Link
              href="/admin"
              className="hidden lg:inline-flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.14em] font-semibold border border-primary/30 bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {t("nav.admin")}
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-foreground hover:text-primary"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="h-[1.1rem] w-[1.1rem]" />
              <span className="sr-only">Search</span>
            </Button>
            <div className="hidden sm:block">
              <LanguageToggle />
            </div>
            <ThemeToggle />

            <Button variant="ghost" size="icon" className="rounded-full hidden sm:inline-flex relative text-foreground hover:text-primary" asChild>
              <Link href="/wishlist" aria-label="Wishlist">
                <Heart className="h-[1.1rem] w-[1.1rem]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hidden sm:inline-flex text-foreground hover:text-primary" asChild>
              <Link href="/account" aria-label="Account">
                <User className="h-[1.1rem] w-[1.1rem]" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full relative text-foreground hover:text-primary"
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
            >
              <ShoppingBag className="h-[1.1rem] w-[1.1rem]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <SearchOverlay onClose={() => setSearchOpen(false)} />
      )}
    </header>
  );
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  return (
    <div className="absolute inset-x-0 top-full glass border-b border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Search</p>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={onSubmit} className="max-w-3xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, brands, collections…"
              className="pl-12 pr-4 h-14 text-lg bg-background border-2 focus-visible:border-primary"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-6 justify-center">
            <span className="text-xs text-muted-foreground mr-2">Trending:</span>
            {["Silk Slip Dress", "Cashmere Hoodie", "Leather Moto", "Camel Overcoat"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setQuery(t);
                  router.push(`/shop?q=${encodeURIComponent(t)}`);
                  onClose();
                }}
                className="text-xs px-3 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
