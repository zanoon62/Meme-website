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
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useUI, useCartCount, useWishlistCount } from "@/components/providers/ui-provider";
import { useLiveCategories } from "@/components/providers/product-store";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { useT, useLangDir } from "@/lib/i18n";
import { getAdminEmailClient } from "@/lib/auth/simple-auth";

export function Header() {
  const router = useRouter();
  const { setCartOpen, setSearchOpen, searchOpen } = useUI();
  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const t = useT();
  const dir = useLangDir();
  const liveCategories = useLiveCategories();
  const [adminEmail, setAdminEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Read immediately on mount
    setAdminEmail(getAdminEmailClient());
    // Poll every 2s so the icon appears right after OAuth redirect sets the cookie
    const interval = setInterval(() => {
      setAdminEmail(getAdminEmailClient());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getCategoryLabel = (name: string) => {
    const key = `cat.${name}`;
    const translated = t(key);
    return translated !== key ? translated : name;
  };

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
          {/* Mobile menu trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden -ml-2 text-foreground">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] sm:w-[380px] p-0 bg-background">
              <SheetHeader className="p-6 border-b border-white/5">
                <SheetTitle className="font-display text-2xl tracking-[0.18em] text-gold-gradient flex items-center gap-2.5">
                  <img src="/logo.svg" alt="MEME" className="h-6 w-6 rounded-md object-contain" />
                  MEME
                </SheetTitle>
              </SheetHeader>
              <div className="px-6 py-4 overflow-y-auto h-[calc(100vh-100px)]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">{t("nav.home")}</p>
                <nav className="flex flex-col gap-1">
                  <Link href="/" onClick={() => setMobileOpen(false)} className="py-3 text-base border-b border-white/5 hover:translate-x-1 transition-transform">{t("nav.home")}</Link>
                  <Link href="/shop" onClick={() => setMobileOpen(false)} className="py-3 text-base border-b border-white/5 hover:translate-x-1 transition-transform">{t("nav.shop")}</Link>
                  {liveCategories.length > 0 && (
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-6 mb-3">{t("shop.category")}</p>
                  )}
                  {liveCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/shop?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setMobileOpen(false)}
                      className="py-3 text-base border-b border-white/5 hover:translate-x-1 transition-transform"
                    >
                      {getCategoryLabel(cat.name)}
                    </Link>
                  ))}
                  <Link href="/account" onClick={() => setMobileOpen(false)} className="py-3 text-base border-b border-white/5 mt-4">{t("nav.account")}</Link>
                  <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="py-3 text-base border-b border-white/5">{t("nav.wishlist")}</Link>
                  {adminEmail && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)} className="py-3 text-base border-b border-white/5 text-amber-600 font-medium flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-3 lg:mr-8 group">
            <img src="/logo.svg" alt="SUITED BY MEME" className="h-9 w-9 rounded-full object-contain group-hover:scale-105 transition-transform duration-300 shadow-sm" />
            <div className="flex flex-col">
              <span className="font-display text-xl lg:text-2xl tracking-[0.2em] font-bold leading-none text-foreground">
                ME<span className="text-amber-600/80">/</span>ME
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground mt-0.5 font-sans font-medium">
                SUITED BY MEME
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8 text-[13px] uppercase tracking-[0.14em] font-medium flex-1">
            <Link href="/" className="link-underline hover:text-foreground/80">{t("nav.home")}</Link>
            <Link href="/shop" className="link-underline hover:text-foreground/80">{t("nav.shop")}</Link>
            <div className="relative group">
              <Link href="/shop" className="link-underline hover:text-foreground/80 inline-flex items-center gap-1">
                {t("shop.category")}
              </Link>
              {/* Category Mega menu */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
                <div className="bg-card border border-white/10 rounded-sm shadow-2xl p-6 min-w-[280px]">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">{t("shop.category")}</p>
                  {liveCategories.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 py-1">No categories yet</p>
                  ) : (
                    <ul className="space-y-2">
                      {liveCategories.map((cat) => (
                        <li key={cat.slug}>
                          <Link
                            href={`/shop?category=${encodeURIComponent(cat.name)}`}
                            className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground hover:translate-x-1 transition-all inline-block py-1"
                          >
                            {getCategoryLabel(cat.name)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <LanguageToggle />

            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-white/5"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Link href="/account" className="hidden sm:inline-flex">
              <Button variant="ghost" size="icon" className="text-foreground hover:bg-white/5" aria-label="Account">
                <User className="h-5 w-5" />
              </Button>
            </Link>

            {adminEmail && (
              <Link href="/admin" className="hidden sm:inline-flex">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-amber-600 hover:bg-amber-500/10"
                  aria-label="Admin Panel"
                  title={`Admin: ${adminEmail}`}
                >
                  <LayoutDashboard className="h-5 w-5" />
                </Button>
              </Link>
            )}

            <Link href="/wishlist">
              <Button variant="ghost" size="icon" className="relative text-foreground hover:bg-white/5" aria-label="Wishlist">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={() => setCartOpen(true)}
              className="relative h-9 px-3 gap-2 border-white/20 hover:border-white/40 bg-background"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">{t("nav.cart")}</span>
              {cartCount > 0 && (
                <span className="ml-1 h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold inline-flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
