"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/shop/cart-drawer";

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
      <MobileBottomNav />
      <div className="lg:hidden h-16 shrink-0" aria-hidden /> {/* Spacer for bottom nav */}
    </div>
  );
}
