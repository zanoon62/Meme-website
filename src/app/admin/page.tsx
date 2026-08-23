"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell, type AdminSection } from "@/components/admin/admin-shell";
import { DashboardSection } from "@/components/admin/sections/dashboard-section";
import { ProductsSection } from "@/components/admin/sections/products-section";
import { OrdersSection } from "@/components/admin/sections/orders-section";
import { CustomersSection } from "@/components/admin/sections/customers-section";
import { InventorySection } from "@/components/admin/sections/inventory-section";
import { CategoriesSection } from "@/components/admin/sections/categories-section";
import { MarketingSection } from "@/components/admin/sections/marketing-section";
import { ReviewsSection } from "@/components/admin/sections/reviews-section";
import { ReturnsSection } from "@/components/admin/sections/returns-section";
import { AnalyticsSection } from "@/components/admin/sections/analytics-section";
import { SettingsSection } from "@/components/admin/sections/settings-section";
import { AdminGuideSection } from "@/components/admin/admin-guide";
import { HomepageSection } from "@/components/admin/sections/homepage-section";
import { AdminAccessSection } from "@/components/admin/sections/admin-access-section";
import { ProductFormView } from "@/components/admin/product-form-view";
import { useProductStore } from "@/components/providers/product-store";
import type { Product } from "@/components/providers/ui-provider";

const VALID_SECTIONS: AdminSection[] = [
  "dashboard",
  "products",
  "orders",
  "customers",
  "inventory",
  "categories",
  "marketing",
  "reviews",
  "returns",
  "analytics",
  "settings",
  "guide",
  "homepage",
  "admin-access",
];

export default function AdminPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as AdminSection | null) ?? "dashboard";
  const [section, setSection] = React.useState<AdminSection>(
    VALID_SECTIONS.includes(initialTab) ? initialTab : "dashboard"
  );

  // Full-page workspace state for adding/editing products
  const [isProductFormActive, setIsProductFormActive] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);

  // Pull latest products from Supabase on mount (no-op if not configured)
  const refreshFromServer = useProductStore((s) => s.refreshFromServer);
  React.useEffect(() => {
    refreshFromServer();
  }, [refreshFromServer]);

  // Sync section changes with URL ?tab= for deep-linking / refresh safety without RSC network delay
  const handleSectionChange = React.useCallback(
    (s: AdminSection) => {
      setSection(s);
      setIsProductFormActive(false);
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        params.set("tab", s);
        window.history.replaceState(null, "", `/admin?${params.toString()}`);
      }
    },
    []
  );

  const openAdd = () => {
    setEditingProduct(null);
    setIsProductFormActive(true);
  };
  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setIsProductFormActive(true);
  };
  const closeForm = () => {
    setIsProductFormActive(false);
    setEditingProduct(null);
  };

  // If full-page product form is active, render full-page spacious ProductFormView with free scrolling
  if (isProductFormActive) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <ProductFormView product={editingProduct} onBack={closeForm} />
      </main>
    );
  }

  return (
    <AdminShell
      section={section}
      onSection={handleSectionChange}
      onNewProduct={openAdd}
    >
      {section === "dashboard" && (
        <DashboardSection onNewProduct={openAdd} onJump={handleSectionChange} />
      )}
      {section === "products" && (
        <ProductsSection onAdd={openAdd} onEdit={openEdit} />
      )}
      {section === "orders" && <OrdersSection />}
      {section === "customers" && <CustomersSection />}
      {section === "inventory" && <InventorySection />}
      {section === "categories" && <CategoriesSection />}
      {section === "marketing" && <MarketingSection />}
      {section === "reviews" && <ReviewsSection />}
      {section === "returns" && <ReturnsSection />}
      {section === "analytics" && <AnalyticsSection />}
      {section === "settings" && <SettingsSection />}
      {section === "guide" && <AdminGuideSection />}
      {section === "homepage" && <HomepageSection />}
      {section === "admin-access" && <AdminAccessSection />}
    </AdminShell>
  );
}
