"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, Heart, User } from "lucide-react";
import { useCartCount, useUI, useWishlistCount } from "@/components/providers/ui-provider";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const setCartOpen = useUI((s) => s.setCartOpen);
  const setSearchOpen = useUI((s) => s.setSearchOpen);
  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();

  const items_nav = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Search", action: () => setSearchOpen(true) },
    { icon: ShoppingBag, label: "Cart", action: () => setCartOpen(true), badge: cartCount },
    { icon: Heart, label: "Wishlist", href: "/wishlist", badge: wishlistCount },
    { icon: User, label: "Account", href: "/account" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-border/60 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {items_nav.map((item, i) => {
          const isActive = item.href && pathname === item.href;
          const content = (
            <button
              key={i}
              onClick={item.action}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative"
              aria-label={item.label}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wide transition-colors",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              {item.badge ? (
                <span className="absolute top-1 right-1/4 bg-primary text-primary-foreground text-[9px] font-medium rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
          return item.href ? (
            <Link key={i} href={item.href} className="flex-1 h-full flex items-center justify-center">
              {content}
            </Link>
          ) : (
            content
          );
        })}
      </div>
    </nav>
  );
}
