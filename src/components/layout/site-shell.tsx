"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { SearchOverlay } from "@/components/layout/search-overlay";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <AnnouncementBar />
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <MobileBottomNav />
      {/* Spacer matching the bottom nav's real height: 4rem + the phone's
          safe-area inset. A plain h-16 left the nav overlapping the last
          rows of page content on home-indicator phones. */}
      <div
        className="lg:hidden shrink-0"
        style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }}
        aria-hidden
      />
    </div>
  );
}
