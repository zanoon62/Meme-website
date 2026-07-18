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
import { CollectionsSection } from "@/components/admin/sections/collections-section";
import { MarketingSection } from "@/components/admin/sections/marketing-section";
import { ReviewsSection } from "@/components/admin/sections/reviews-section";
import { AnalyticsSection } from "@/components/admin/sections/analytics-section";
import { SettingsSection } from "@/components/admin/sections/settings-section";
import { AdminGuideSection } from "@/components/admin/admin-guide";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { useProductStore } from "@/components/providers/product-store";
import type { Product } from "@/components/providers/ui-provider";

const VALID_SECTIONS: AdminSection[] = [
  "dashboard",
  "products",
  "orders",
  "customers",
  "inventory",
  "categories",
  "collections",
  "marketing",
  "reviews",
  "analytics",
  "settings",
  "guide",
];

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as AdminSection | null) ?? "dashboard";
  const [section, setSection] = React.useState<AdminSection>(
    VALID_SECTIONS.includes(initialTab) ? initialTab : "dashboard"
  );
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(
    null
  );

  // Pull latest products from Supabase on mount (no-op if not configured)
  const refreshFromServer = useProductStore((s) => s.refreshFromServer);
  React.useEffect(() => {
    refreshFromServer();
  }, [refreshFromServer]);

  // Sync section changes with URL ?tab= for deep-linking / refresh safety
  const handleSectionChange = React.useCallback(
    (s: AdminSection) => {
      setSection(s);
      const params = new URLSearchParams(window.location.search);
      params.set("tab", s);
      router.replace(`/admin?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const openAdd = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormOpen(true);
  };

  return (
    <>
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
        {section === "collections" && <CollectionsSection />}
        {section === "marketing" && <MarketingSection />}
        {section === "reviews" && <ReviewsSection />}
        {section === "analytics" && <AnalyticsSection />}
        {section === "settings" && <SettingsSection />}
        {section === "guide" && <AdminGuideSection />}
      </AdminShell>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
      />
    </>
  );
}
